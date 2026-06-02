import streamlit as st
import requests
import json
import os
import base64
import pandas as pd
from PIL import Image
import joblib
import numpy as np

APP_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(APP_DIR)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
load_dotenv(os.path.join(APP_DIR, ".env"))

try:
    streamlit_secret_key = st.secrets.get("GEMINI_API_KEY", "") or st.secrets.get("GOOGLE_API_KEY", "")
except Exception:
    streamlit_secret_key = ""

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "") or streamlit_secret_key

# Page config
st.set_page_config(
    page_title="DiaRisk AI - Diabetes Prediction",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

def _inject_local_css():
    """Inject local CSS files into Streamlit so the app matches the repo design.

    Looks for common frontend CSS (e.g., `src/index.css`) and injects it first,
    then falls back to the inline CSS defined for Streamlit-specific classes.
    """
    css_paths = [
        os.path.join(PROJECT_ROOT, "src", "index.css"),
        os.path.join(PROJECT_ROOT, "src", "styles.css"),
    ]

    injected = False
    for p in css_paths:
        try:
            if os.path.exists(p):
                with open(p, "r", encoding="utf-8") as f:
                    css = f.read()
                st.markdown(f"<style>\n{css}\n</style>", unsafe_allow_html=True)
                injected = True
                # Emit a clear log marker so Streamlit build logs indicate which CSS was used
                try:
                    print(f"STREAMLIT_CSS_INJECTED: {p}")
                except Exception:
                    pass
        except Exception:
            # ignore and try next
            pass

    # If no local CSS injected, include the existing inline CSS as a fallback
    if not injected:
        st.markdown("""
            <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
            .main { padding-top: 0rem; font-family: 'Inter', sans-serif; }
            .stTabs [data-baseweb="tab-list"] button { font-weight: 600; }
            .risk-card { padding: 1.5rem; border-radius: 1rem; text-align: center; border: 1px solid #e5e7eb; }
            .risk-high { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-color: #fca5a5; }
            .risk-medium { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fcd34d; }
            .risk-low { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-color: #86efac; }
            .nutrition-card { padding: 1rem; border-radius: 0.75rem; text-align: center; border: 1px solid #e5e7eb; }
            .hero-section { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); padding: 2rem; border-radius: 1rem; color: white; margin-bottom: 1.5rem; }
            .range-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; margin-top: 0.5rem; }
            .range-card { border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 1rem; padding: 1rem; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.98)); box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04); }
            .range-title { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-bottom: 0.65rem; }
            .range-row { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin: 0.35rem 0; font-size: 0.84rem; color: #475569; }
            .range-badge { border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 700; color: white; }
            .badge-normal { background: linear-gradient(135deg, #16a34a, #22c55e); }
            .badge-elevated { background: linear-gradient(135deg, #d97706, #f59e0b); }
            .badge-high { background: linear-gradient(135deg, #dc2626, #ef4444); }
            </style>
        """, unsafe_allow_html=True)
        try:
            print("STREAMLIT_CSS_INJECTED: fallback_inline_css")
        except Exception:
            pass


_inject_local_css()

# --- Load ML model directly (no Flask dependency for prediction) ---
def resolve_existing_path(*candidates):
    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate
    return candidates[0]


@st.cache_resource
def load_model():
    model_path = resolve_existing_path(
        os.path.join(PROJECT_ROOT, "model.pkl"),
        os.path.join(APP_DIR, "model.pkl"),
    )
    scaler_path = resolve_existing_path(
        os.path.join(PROJECT_ROOT, "scaler.pkl"),
        os.path.join(APP_DIR, "scaler.pkl"),
    )
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        return None, None
    
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler

model, scaler = load_model()

# --- Gemini API helper ---
def call_gemini(prompt, image_data=None, mime_type=None):
    """Call Gemini API directly via REST."""
    if not GEMINI_API_KEY:
        return None, "GEMINI_API_KEY not configured. Please set it in .env file."
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    parts = [{"text": prompt}]
    if image_data and mime_type:
        parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": image_data
            }
        })
    
    payload = {"contents": [{"parts": parts}]}
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return text, None
        else:
            return None, f"Gemini API error: {response.status_code} - {response.text[:200]}"
    except Exception as e:
        return None, f"Gemini API connection error: {str(e)}"


# Initialize session state
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

# Header
st.markdown("""
<div class="hero-section">
    <h1 style="margin:0; font-size:2rem;">🏥 DiaRisk AI</h1>
    <p style="margin:0.5rem 0 0 0; opacity:0.8;">Advanced AI-powered diabetes risk assessment and health management</p>
</div>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("### 🧭 Navigation")
    page = st.radio(
        "Select a feature:",
        ["🔮 Risk Prediction", "🤖 AI Health Assistant", "📸 Food Scanner", "🧮 Health Calculators", "📚 Education"],
        label_visibility="collapsed"
    )
    
    st.divider()
    
    st.markdown("### ℹ️ About")
    st.info(
        "**DiaRisk AI** is a comprehensive platform for diabetes prevention and management.\n\n"
        "**✨ Features:**\n"
        "- ML-based risk assessment\n"
        "- AI health chatbot (Gemini)\n"
        "- Food nutrition scanner\n"
        "- Health calculators\n"
        "- Educational resources"
    )
    
    st.divider()
    st.caption("⚕️ For educational purposes only. Not medical advice.")

# =================== RISK PREDICTION PAGE ===================
if page == "🔮 Risk Prediction":
    st.markdown("## 🔮 AI Risk Prediction")
    st.markdown("Enter your health parameters for an AI-powered diabetes risk assessment.")
    
    if model is None or scaler is None:
        st.error("❌ ML model not found! Please run `python diabetes_prediction.py` first to train the model.")
        st.stop()
    
    col1, col2 = st.columns(2)
    
    with col1:
        glucose = st.number_input("🩸 Glucose (mg/dL)", min_value=0, max_value=300, value=120,
                                   help="Plasma glucose concentration from a 2-hour oral glucose tolerance test")
        blood_pressure = st.number_input("💓 Blood Pressure (mmHg)", min_value=0, max_value=200, value=70,
                                          help="Diastolic blood pressure. Normal is around 80 mmHg")
        insulin = st.number_input("💉 Insulin (mU/ml)", min_value=0, max_value=900, value=80,
                                   help="2-Hour serum insulin level")
    
    with col2:
        bmi = st.number_input("⚖️ BMI (kg/m²)", min_value=10.0, max_value=60.0, value=25.5, step=0.1,
                               help="Body Mass Index. Over 30 is considered obese")
        diabetes_pedigree = st.number_input("🧬 Diabetes Pedigree Function", min_value=0.0, max_value=2.5, value=0.5, step=0.01,
                                             help="Genetic influence score based on family history")
        age = st.number_input("🎂 Age (years)", min_value=18, max_value=120, value=30,
                               help="Risk typically increases with age")
    
    st.markdown("")
    # Reference ranges for user guidance
    with st.expander("📚 Reference Ranges (what's normal / elevated / high)", expanded=False):
        range_cards = [
            {
                "title": "Glucose (mg/dL)",
                "normal": "< 140",
                "elevated": "140 - 199",
                "high": ">= 200",
                "note": "2-hour OGTT: Normal / Prediabetes / Diabetes",
            },
            {
                "title": "Blood Pressure (mmHg)",
                "normal": "60 - 80",
                "elevated": "81 - 90",
                "high": "> 90",
                "note": "Diastolic guide (approx).",
            },
            {
                "title": "Insulin (mU/ml)",
                "normal": "~ 2 - 25",
                "elevated": "25 - 200",
                "high": ">= 200",
                "note": "2-hour serum insulin (general guide).",
            },
            {
                "title": "BMI (kg/m²)",
                "normal": "18.5 - 24.9",
                "elevated": "25 - 29.9",
                "high": ">= 30",
                "note": "Standard BMI categories.",
            },
            {
                "title": "Diabetes Pedigree",
                "normal": "< 0.5",
                "elevated": "0.5 - 1.0",
                "high": "> 1.0",
                "note": "Relative genetic risk indicator.",
            },
            {
                "title": "Age (years)",
                "normal": "< 45",
                "elevated": "45 - 60",
                "high": "> 60",
                "note": "Risk generally increases with age.",
            },
        ]

        cards_html = ["<div class='range-grid'>"]
        for item in range_cards:
            cards_html.append(f"""
                <div class='range-card'>
                    <div class='range-title'>{item['title']}</div>
                    <div class='range-row'><span>Normal</span><span class='range-badge badge-normal'>{item['normal']}</span></div>
                    <div class='range-row'><span>Elevated</span><span class='range-badge badge-elevated'>{item['elevated']}</span></div>
                    <div class='range-row'><span>High</span><span class='range-badge badge-high'>{item['high']}</span></div>
                    <div style='margin-top:0.65rem; font-size:0.78rem; color:#64748b; line-height:1.4;'>{item['note']}</div>
                </div>
            """)
        cards_html.append("</div>")
        st.markdown("".join(cards_html), unsafe_allow_html=True)
    
    if st.button("🔬 Run Diagnostic Analysis", key="predict_btn", use_container_width=True, type="primary"):
        with st.spinner("🧠 Analyzing clinical data with ML model..."):
            try:
                # Prepare features (Pregnancies=0, hidden from UI)
                features = np.array([[0, glucose, blood_pressure, 
                                      insulin, bmi, diabetes_pedigree, age]])
                features_scaled = scaler.transform(features)
                
                prediction = model.predict(features_scaled)[0]
                prediction_proba = model.predict_proba(features_scaled)[0]
                probability = float(prediction_proba[1])
                
                if prediction == 1:
                    prediction_label = "Diabetic"
                    if probability >= 0.8:
                        risk_level = "Very High"
                    elif probability >= 0.6:
                        risk_level = "High"
                    else:
                        risk_level = "Medium"
                else:
                    prediction_label = "Non-Diabetic"
                    if probability >= 0.4:
                        risk_level = "Medium"
                    elif probability >= 0.2:
                        risk_level = "Low"
                    else:
                        risk_level = "Very Low"
                
                confidence = max(prediction_proba) * 100
                
                st.markdown("---")
                
                # Results
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric("🏷️ Prediction", prediction_label)
                with col2:
                    st.metric("📊 Risk Probability", f"{probability * 100:.1f}%")
                with col3:
                    risk_emoji = "🔴" if risk_level in ["High", "Very High"] else "🟡" if risk_level == "Medium" else "🟢"
                    st.metric("⚠️ Risk Level", f"{risk_emoji} {risk_level}")
                
                # Confidence gauge
                st.markdown(f"**Model Confidence:** {confidence:.1f}%")
                st.progress(confidence / 100)
                
                st.markdown("---")
                
                # Recommendations
                if prediction == 1:
                    st.warning("⚠️ Based on the analysis, you have elevated diabetes risk. Please consult a healthcare professional.")
                    st.markdown("**🩺 Recommended Actions:**")
                    st.markdown("""
                    - 📅 Schedule a consultation with an endocrinologist
                    - 🩸 Monitor your glucose levels regularly  
                    - 🥗 Adopt a balanced, low-sugar diet
                    - 🏃 Increase physical activity (150+ min/week)
                    - ⚖️ Maintain a healthy weight
                    - 💤 Get 7-9 hours of quality sleep
                    """)
                else:
                    st.success("✅ Your diabetes risk is relatively low. Continue maintaining healthy habits!")
                    st.markdown("**💪 Preventive Measures:**")
                    st.markdown("""
                    - 🏋️ Maintain regular exercise routine
                    - 🥦 Keep a balanced diet
                    - ⚖️ Monitor your BMI
                    - 📋 Schedule annual health checkups
                    - 🧘 Manage stress levels
                    """)
                
                # Disclaimer
                st.markdown("---")
                st.caption("⚕️ **DISCLAIMER:** This is an AI-based screening tool, not a medical diagnosis. "
                          "Always consult a healthcare provider for confirmation and treatment.")
                
            except Exception as e:
                st.error(f"❌ Prediction error: {str(e)}")

# =================== AI HEALTH ASSISTANT PAGE ===================
elif page == "🤖 AI Health Assistant":
    st.markdown("## 🤖 AI Health Assistant")
    st.markdown("Chat with our AI powered by Google Gemini about diabetes, nutrition, and health.")
    
    if not GEMINI_API_KEY:
        st.error("❌ GEMINI_API_KEY not configured. Please set it in your `.env` file.")
        st.stop()
    
    # Display chat history
    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Chat input
    user_input = st.chat_input("Ask a health question...")
    
    if user_input:
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        
        with st.chat_message("user"):
            st.markdown(user_input)
        
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                # Build conversation context
                system_prompt = """You are a helpful AI health assistant specializing in diabetes prevention, nutrition, and healthy lifestyle guidance.

IMPORTANT GUIDELINES:
- Provide general health information and educational content only
- NEVER diagnose conditions or prescribe medications
- ALWAYS remind users to consult healthcare providers for medical advice
- Use evidence-based information
- Be empathetic and supportive
- Keep responses concise (2-4 paragraphs)"""
                
                context = system_prompt + "\n\n"
                # Include last 10 messages for context
                recent = st.session_state.chat_history[-10:]
                for msg in recent:
                    role = "User" if msg["role"] == "user" else "Assistant"
                    context += f"{role}: {msg['content']}\n"
                context += "\nAssistant:"
                
                response_text, error = call_gemini(context)
                
                if error:
                    st.error(error)
                    assistant_message = "Sorry, I couldn't generate a response. Please try again."
                else:
                    assistant_message = response_text
                
                st.markdown(assistant_message)
                st.session_state.chat_history.append({"role": "assistant", "content": assistant_message})
    
    # Clear chat button
    if st.session_state.chat_history:
        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.chat_history = []
            st.rerun()

# =================== FOOD SCANNER PAGE ===================
elif page == "📸 Food Scanner":
    st.markdown("## 📸 AI Food Scanner")
    st.markdown("Upload a food photo for AI-powered nutrition analysis using Google Gemini Vision.")
    
    if not GEMINI_API_KEY:
        st.error("❌ GEMINI_API_KEY not configured. Please set it in your `.env` file.")
        st.stop()
    
    uploaded_file = st.file_uploader("Choose a food image", type=["jpg", "jpeg", "png", "webp"])
    
    if uploaded_file is not None:
        col1, col2 = st.columns([1, 1])
        
        with col1:
            image = Image.open(uploaded_file)
            st.image(image, caption="📷 Uploaded Image", use_container_width=True)
        
        if st.button("🔍 Analyze Nutrition", key="food_btn", use_container_width=True, type="primary"):
            with st.spinner("🤖 AI is analyzing your food..."):
                # Read image and convert to base64
                uploaded_file.seek(0)
                image_bytes = uploaded_file.read()
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                
                mime_type = uploaded_file.type or "image/jpeg"
                
                prompt = """Analyze this food image and identify the food item(s). Return ONLY a valid JSON object with no markdown formatting, no code fences, and no extra text. Use this exact structure:
{
  "foodName": "name of the food",
  "calories": <number>,
  "carbs": <number in grams>,
  "protein": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>,
  "sugar": <number in grams>,
  "sodium": <number in mg>
}

If there are multiple food items, combine them into one entry with totals.
If you cannot identify the food, use your best guess based on appearance.
Base nutrition values on a typical single serving size.
Return ONLY the JSON object, nothing else."""
                
                response_text, error = call_gemini(prompt, base64_image, mime_type)
                
                if error:
                    st.error(f"❌ {error}")
                else:
                    try:
                        # Parse JSON
                        clean_json = response_text.replace("```json", "").replace("```", "").strip()
                        nutrition = json.loads(clean_json)
                        
                        with col2:
                            st.markdown(f"### 🍽️ {nutrition.get('foodName', 'Unknown Food')}")
                            st.markdown("---")
                            
                            # Main macros
                            m1, m2 = st.columns(2)
                            with m1:
                                st.metric("🔥 Calories", f"{nutrition.get('calories', 0)} kcal")
                                st.metric("🥩 Protein", f"{nutrition.get('protein', 0)}g")
                                st.metric("🧈 Fat", f"{nutrition.get('fat', 0)}g")
                            with m2:
                                st.metric("🌾 Carbs", f"{nutrition.get('carbs', 0)}g")
                                st.metric("🍬 Sugar", f"{nutrition.get('sugar', 0)}g")
                                st.metric("🥬 Fiber", f"{nutrition.get('fiber', 0)}g")
                            
                            st.metric("🧂 Sodium", f"{nutrition.get('sodium', 0)}mg")
                        
                        # Detailed table
                        st.markdown("---")
                        st.markdown("### 📊 Detailed Breakdown")
                        df = pd.DataFrame({
                            'Nutrient': ['Calories', 'Protein', 'Carbs', 'Fat', 'Fiber', 'Sugar', 'Sodium'],
                            'Amount': [
                                f"{nutrition.get('calories', 0)} kcal",
                                f"{nutrition.get('protein', 0)}g",
                                f"{nutrition.get('carbs', 0)}g",
                                f"{nutrition.get('fat', 0)}g",
                                f"{nutrition.get('fiber', 0)}g",
                                f"{nutrition.get('sugar', 0)}g",
                                f"{nutrition.get('sodium', 0)}mg"
                            ]
                        })
                        st.dataframe(df, use_container_width=True, hide_index=True)
                        
                        st.info("💡 Nutrition values are AI estimates based on image recognition. "
                               "Actual values may vary by preparation and portion size.")
                        
                    except json.JSONDecodeError:
                        st.error("❌ Could not parse nutrition data from AI response.")
                        st.code(response_text)

# =================== HEALTH CALCULATORS PAGE ===================
elif page == "🧮 Health Calculators":
    st.markdown("## 🧮 Health Calculators")
    
    calc_tab1, calc_tab2, calc_tab3, calc_tab4 = st.tabs(["⚖️ BMI", "🔥 Calories", "📊 Daily Risk", "🍬 Sugar Tracker"])
    
    # BMI Calculator
    with calc_tab1:
        st.subheader("⚖️ BMI Calculator")
        col1, col2 = st.columns(2)
        
        with col1:
            height = st.number_input("Height (cm)", min_value=100, max_value=250, value=170)
        with col2:
            weight = st.number_input("Weight (kg)", min_value=30, max_value=200, value=70)
        
        if st.button("Calculate BMI", key="bmi_btn", use_container_width=True, type="primary"):
            bmi_val = weight / ((height / 100) ** 2)
            
            if bmi_val < 18.5:
                category, color = "Underweight", "🔵"
            elif bmi_val < 25:
                category, color = "Normal Weight", "🟢"
            elif bmi_val < 30:
                category, color = "Overweight", "🟡"
            else:
                category, color = "Obese", "🔴"
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Your BMI", f"{bmi_val:.1f}")
            with col2:
                st.metric("Category", f"{color} {category}")
            with col3:
                st.metric("Healthy Range", "18.5 - 24.9")
    
    # Calorie Calculator
    with calc_tab2:
        st.subheader("🔥 Calorie & TDEE Calculator")
        
        col1, col2 = st.columns(2)
        with col1:
            cal_age = st.number_input("Age", min_value=18, max_value=100, value=30, key="cal_age")
            cal_weight = st.number_input("Weight (kg)", min_value=30, max_value=200, value=70, key="cal_weight")
            cal_height = st.number_input("Height (cm)", min_value=100, max_value=250, value=170, key="cal_height")
        
        with col2:
            gender = st.selectbox("Gender", ["Male", "Female"])
            activity = st.selectbox("Activity Level", 
                ["Sedentary", "Lightly Active", "Moderately Active", "Very Active"])
        
        if st.button("Calculate TDEE", key="calorie_btn", use_container_width=True, type="primary"):
            if gender == "Male":
                bmr = 10 * cal_weight + 6.25 * cal_height - 5 * cal_age + 5
            else:
                bmr = 10 * cal_weight + 6.25 * cal_height - 5 * cal_age - 161
            
            multipliers = {
                "Sedentary": 1.2, "Lightly Active": 1.375,
                "Moderately Active": 1.55, "Very Active": 1.725
            }
            tdee = bmr * multipliers[activity]
            
            col1, col2 = st.columns(2)
            with col1:
                st.metric("🔥 Daily Calorie Needs (TDEE)", f"{tdee:.0f} kcal/day")
            with col2:
                st.metric("💤 Basal Metabolic Rate (BMR)", f"{bmr:.0f} kcal/day")
            
            st.markdown("### 🎯 Goal-based Calories")
            goals = pd.DataFrame({
                'Goal': ['Extreme Loss', 'Weight Loss', 'Mild Loss', 'Maintain', 'Mild Gain', 'Weight Gain'],
                'Daily Calories': [f"{tdee-1000:.0f}", f"{tdee-500:.0f}", f"{tdee-250:.0f}", 
                                   f"{tdee:.0f}", f"{tdee+250:.0f}", f"{tdee+500:.0f}"]
            })
            st.dataframe(goals, use_container_width=True, hide_index=True)
    
    # Daily Risk
    with calc_tab3:
        st.subheader("📊 Daily Risk Assessment")
        
        col1, col2 = st.columns(2)
        with col1:
            sleep = st.slider("💤 Hours of Sleep", 0, 12, 7, key="sleep")
            exercise = st.slider("🏃 Minutes of Exercise", 0, 180, 30, key="exercise")
        with col2:
            water = st.slider("💧 Glasses of Water", 0, 12, 8, key="water")
            stress = st.slider("😰 Stress Level (1-10)", 1, 10, 5, key="stress")
        
        sugar_intake = st.slider("🍬 Grams of Added Sugar", 0, 200, 25, key="sugar_input")
        
        if st.button("Assess Daily Risk", key="daily_risk_btn", use_container_width=True, type="primary"):
            score = 100
            factors = []
            
            if sleep < 6:
                score -= 15
                factors.append("❌ Insufficient sleep (< 6 hours)")
            elif 7 <= sleep <= 9:
                factors.append("✅ Good sleep (7-9 hours)")
            else:
                score -= 10
                factors.append("⚠️ Sleep could be better")
            
            if exercise < 15:
                score -= 20
                factors.append("❌ Very low exercise (< 15 min)")
            elif exercise >= 30:
                factors.append("✅ Good exercise (30+ min)")
            else:
                score -= 10
                factors.append("⚠️ Moderate exercise")
            
            if water < 6:
                score -= 10
                factors.append("❌ Low water intake")
            else:
                factors.append("✅ Good hydration")
            
            if sugar_intake > 50:
                score -= 25
                factors.append("❌ High sugar intake (> 50g)")
            elif sugar_intake <= 25:
                factors.append("✅ Low sugar intake")
            else:
                score -= 15
                factors.append("⚠️ Moderate sugar intake")
            
            if stress >= 7:
                score -= 15
                factors.append("❌ High stress level")
            else:
                factors.append("✅ Good stress management")
            
            score = max(0, min(100, score))
            
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Health Score", f"{score}/100")
                st.progress(score / 100)
            with col2:
                if score >= 80:
                    st.success("🟢 **Low Risk** - Great job! Keep it up!")
                elif score >= 60:
                    st.warning("🟡 **Medium Risk** - Room for improvement")
                else:
                    st.error("🔴 **High Risk** - Consider lifestyle changes")
            
            st.markdown("### 📋 Breakdown")
            for f in factors:
                st.markdown(f"- {f}")
    
    # Sugar Tracker
    with calc_tab4:
        st.subheader("🍬 Daily Sugar Intake Tracker")
        
        st.info("**Recommended Daily Sugar Limit:** Men: 36g | Women: 25g | Children: 12-25g")
        
        col1, col2 = st.columns(2)
        with col1:
            breakfast_sugar = st.number_input("🌅 Breakfast (g)", min_value=0, max_value=100, value=10)
            lunch_sugar = st.number_input("☀️ Lunch (g)", min_value=0, max_value=100, value=15)
        with col2:
            dinner_sugar = st.number_input("🌙 Dinner (g)", min_value=0, max_value=100, value=10)
            snacks_sugar = st.number_input("🍪 Snacks (g)", min_value=0, max_value=100, value=5)
        
        total_sugar = breakfast_sugar + lunch_sugar + dinner_sugar + snacks_sugar
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Sugar", f"{total_sugar}g")
        with col2:
            st.metric("Recommended", "≤ 36g (male)")
        with col3:
            status = "✅ Within Limit" if total_sugar <= 36 else "⚠️ Exceeded"
            st.metric("Status", status)

# =================== EDUCATION PAGE ===================
elif page == "📚 Education":
    st.markdown("## 📚 Educational Resources")
    st.markdown("Learn about diabetes, prevention, and healthy lifestyle management.")
    
    edu_tab1, edu_tab2, edu_tab3, edu_tab4, edu_tab5 = st.tabs([
        "🔬 What is Diabetes?", "🚨 Symptoms", "🛡️ Prevention", "🥗 Diet", "🏋️ Exercise"
    ])
    
    with edu_tab1:
        st.subheader("What is Diabetes?")
        st.markdown("""
        Diabetes is a metabolic disorder characterized by high blood sugar levels. 
        The body either doesn't produce enough insulin or can't use insulin effectively.
        
        **Types of Diabetes:**
        1. **Type 1**: Autoimmune condition — the pancreas doesn't produce insulin
        2. **Type 2**: Most common — body becomes resistant to insulin
        3. **Gestational**: Develops during pregnancy; usually resolves after birth
        
        **Global Statistics:**
        - 422 million people worldwide have diabetes
        - 1.5 million deaths directly caused by diabetes annually
        - Complications include heart disease, stroke, kidney failure, blindness
        """)
    
    with edu_tab2:
        st.subheader("Symptoms & Warning Signs")
        st.markdown("""
        **Early Warning Signs:**
        - 🥤 Increased thirst
        - 🚻 Frequent urination
        - 😴 Fatigue and weakness
        - 👁️ Blurred vision
        - 🖐️ Numbness or tingling in extremities
        - ⚖️ Unexplained weight loss
        - 🩹 Slow-healing cuts or sores
        - 🟤 Dark patches on skin (Acanthosis Nigricans)
        
        **When to See a Doctor:**
        If you experience any of these symptoms, consult a healthcare provider for testing.
        Early detection can prevent serious complications.
        """)
    
    with edu_tab3:
        st.subheader("Diabetes Prevention Methods")
        st.markdown("""
        **Lifestyle Changes:**
        1. ⚖️ **Weight Management** — Lose 5-10% of body weight if overweight
        2. 🏃 **Physical Activity** — 150 minutes of moderate exercise per week
        3. 🥗 **Healthy Diet** — Reduce refined carbs, increase fiber intake
        4. 🧘 **Stress Management** — Practice meditation, yoga, or relaxation
        5. 💤 **Sleep** — Get 7-9 hours of quality sleep daily
        6. 🚭 **Avoid Smoking** — Quit smoking to reduce risk
        7. 🍷 **Moderate Alcohol** — Limit alcohol consumption
        
        **Regular Monitoring:**
        - Get blood glucose tested annually
        - Monitor blood pressure
        - Check cholesterol levels
        - Have regular health checkups
        """)
    
    with edu_tab4:
        st.subheader("Diet Guidelines")
        st.markdown("""
        **Foods to Eat:**
        - ✅ Whole grains and fiber-rich foods
        - ✅ Lean proteins (chicken, fish, legumes)
        - ✅ Non-starchy vegetables (broccoli, spinach, peppers)
        - ✅ Healthy fats (nuts, olive oil, avocados)
        - ✅ Low-sugar fruits (berries, apples)
        
        **Foods to Avoid:**
        - ❌ Sugary drinks and sodas
        - ❌ Refined carbohydrates (white bread, pastries)
        - ❌ Processed foods high in sodium
        - ❌ Red and processed meats
        - ❌ Excessive sweets and desserts
        
        **Meal Tips:**
        - Eat smaller, frequent meals
        - Balance carbs, proteins, and fats
        - Control portion sizes
        - Stay hydrated with water
        """)
    
    with edu_tab5:
        st.subheader("Exercise Tips")
        st.markdown("""
        **Exercise Types:**
        
        1. **🏃 Cardiovascular** (150 min/week)
           - Brisk walking, jogging, cycling, swimming
           - Improves heart health and insulin sensitivity
        
        2. **🏋️ Resistance Training** (2-3 times/week)
           - Weight lifting, bodyweight exercises
           - Builds muscle mass, improves glucose metabolism
        
        3. **🧘 Flexibility & Balance** (daily)
           - Yoga, stretching, tai chi
           - Reduces stress and improves mobility
        
        **Benefits:**
        - ✅ Lowers blood sugar levels
        - ✅ Improves insulin sensitivity
        - ✅ Helps weight management
        - ✅ Reduces cardiovascular risk
        - ✅ Improves mental health
        """)

# Footer
st.divider()
st.markdown("""
<div style='text-align: center; color: #666; padding: 10px;'>
    <p>© 2026 DiaRisk AI | Advanced Diabetes Risk Prediction Platform</p>
    <p>⚕️ For educational and informational purposes only. Not a substitute for professional medical advice.</p>
</div>
""", unsafe_allow_html=True)
