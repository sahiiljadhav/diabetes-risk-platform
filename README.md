# 🏥 DiaRisk AI - Diabetes Risk Platform

[![Live Platform](https://img.shields.io/badge/Live-Platform-blue?style=for-the-badge&logo=render)](https://diabetes-risk-platform.onrender.com)

**DiaRisk AI** is a cutting-edge, comprehensive platform designed for diabetes prevention, risk assessment, and health management. It combines advanced Machine Learning with modern AI to provide a premium user experience.

---

## ⚡ Live Deployment
Access the production environment here:  
🚀 **[https://diabetes-risk-platform.onrender.com](https://diabetes-risk-platform.onrender.com)**

---

## 🎨 Professional Interface

### 🔮 AI Risk Prediction
Enter clinical health parameters and get instant diagnostic analysis with confidence scores using our trained Random Forest model.

![Risk Prediction](working%20ss/RISK%20PREDICTION.png)

### 🤖 AI Health Assistant
A context-aware intelligent chatbot powered by Google Gemini, capable of answering health-related questions and providing guidance.

![AI Assistant](working%20ss/CHAT%20ASSISTANT1.png)

### 📸 Smart Food Scanner
Identify food items and get nutritional information instantly using advanced computer vision.

![Food Scanner](working%20ss/FOOD%20SCANNER.png)

---

## 🚀 Key Features

- **Machine Learning Diagnostics**: Real-time risk assessment using a Random Forest model.
- **Multimodal AI Assistant**: Intelligent chat for health and lifestyle guidance.
- **Computer Vision Food Scanning**: Instant nutritional breakdown from images.
- **Health Calculators**: Built-in tools for BMI and other vital metrics.
- **Educational Knowledge Base**: Curated resources on diabetes management.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express (API Gateway)
- **ML Engine**: Python, Flask, Scikit-learn, Pandas
- **AI Integration**: Google Gemini (1.5 Flash / 2.5 Flash)
- **Database**: SQLite (via Better-SQLite3)

---

## 💻 Local Setup (Quick)

1. **Clone the Repo**
2. **Setup Dependencies**: `npm install` and `pip install -r requirements.txt`
3. **Train Model**: `python diabetes_prediction.py`
4. **Run Services**: `npm start`

*For advanced configuration, see the archived documentation in the `/archive` folder.*

---

## ☁️ Cloud Deployment

### Streamlit Cloud

This repo includes a root Streamlit launcher at [streamlit_app.py](streamlit_app.py) so Cloud deploys can point to the repository root.

1. Push the repo to GitHub.
2. Open Streamlit Cloud and create a new app.
3. Select this repository and set the main file to [streamlit_app.py](streamlit_app.py).
4. Add `GEMINI_API_KEY` in Streamlit secrets.
5. Deploy.

### Local Streamlit Run

```bash
streamlit run streamlit_app.py
```

---
> [!NOTE]
> **Service Availability**: AI features (Assistant and Food Scanner) utilize the Gemini API and may occasionally fluctuate or hit quota limits during periods of high demand.

![Service Limitation](working%20ss/GEMINI%20ERROR.png)

⚕️ *Disclaimer: This platform is for educational purposes only and does not constitute medical advice.*
