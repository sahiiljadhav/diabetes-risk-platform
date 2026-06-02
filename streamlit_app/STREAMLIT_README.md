# 🏥 DiaRisk AI - Streamlit Version

## 📌 What's New

You now have **two ways** to run your diabetes prediction platform:

### 1. **React App** (Original)
- URL: http://localhost:3000
- Tech: React + TypeScript + Tailwind
- Features: Full-featured with professional design
- Status: ✅ Running

### 2. **Streamlit App** (New)
- URL: http://localhost:8501
- Tech: Python + Streamlit + Plotly
- Features: Same functionality, easier deployment
- Status: 🆕 Ready to deploy

---

## 🎯 Quick Start

### Run Streamlit Locally

**Option A: One-line (if services already running)**
```bash
streamlit run streamlit_app/streamlit_app.py
```

**Option B: Run all services**

Terminal 1 - ML Service:
```bash
python diabetes_prediction.py
```

Terminal 2 - Backend:
```bash
npm run dev
```

Terminal 3 - Streamlit:
```bash
streamlit run streamlit_app/streamlit_app.py
```

Then open: **http://localhost:8501**

---

## ✨ Streamlit Features

### 🔮 Risk Prediction
- Input 7 health parameters
- Get instant AI prediction
- View risk level & recommendations
- Connected to the packaged Python ML model

### 🤖 AI Health Assistant
- Chat interface with Google Gemini
- Open-ended health questions
- 24/7 availability
- Session-based conversations

### 📸 Food Scanner
- Upload food images
- Get nutrition breakdown
- Calories, protein, carbs, fat
- Dietary analysis

### 🧮 Health Calculators
- **BMI Calculator**: Calculate body mass index
- **Calorie Calculator**: TDEE calculation
- **Daily Risk**: Assess daily health risk
- **Sugar Tracker**: Monitor daily sugar intake

### 📚 Education
- What is Diabetes?
- Symptoms & Warning Signs
- Prevention Methods
- Diet Guidelines
- Exercise Tips

---

## 🚀 Deploy to Streamlit Cloud (FREE)

### Step 1: Install Streamlit
```bash
pip install -r requirements.txt
```

### Step 2: Test Locally
```bash
streamlit run streamlit_app/streamlit_app.py
```

### Step 3: Push to GitHub
```bash
git add .
git commit -m "Add Streamlit app"
git push origin main
```

### Step 4: Deploy
1. Go to https://share.streamlit.io
2. Click "New app"
3. Select your repository
4. Choose `streamlit_app/streamlit_app.py`
5. Click "Deploy!"

**That's it!** Your app will be live at:
```
https://your-username-diabetes-risk-prediction.streamlit.app
```

---

## 📂 Project Structure

```
diabetes-risk-prediction-platform/
├── streamlit_app/streamlit_app.py  # 🆕 Main Streamlit app
├── streamlit_app/streamlit_requirements.txt # Local Streamlit dependencies
├── requirements.txt                # Cloud/runtime dependencies
├── STREAMLIT_DEPLOYMENT.md        # 🆕 Detailed deployment guide
├── run_streamlit.bat              # 🆕 Quick start script
├── .streamlit/
│   └── config.toml                # 🆕 Streamlit config
├── diabetes_prediction.py         # Python ML service
├── server.ts                       # Node.js API
├── src/                           # React app
├── package.json                   # React dependencies
└── README.md                       # Original docs
```

---

## 🎨 User Interface

### Streamlit Advantages
✅ **Easy Deployment**: One-click to Streamlit Cloud
✅ **No Build Process**: Python directly to web
✅ **Automatic Updates**: Push to GitHub = deploy
✅ **Free Hosting**: Streamlit Cloud free tier
✅ **Mobile Friendly**: Responsive by default
✅ **No DevOps**: Zero infrastructure management

### React Advantages
✅ **Full Control**: Complete customization
✅ **Better Performance**: Pre-built/compiled
✅ **Professional Design**: Custom styling
✅ **Production Ready**: Industry standard
✅ **Team Friendly**: Familiar for developers

---

## 🔄 Both Apps Share

- **Backend API**: Node.js server on port 3000
- **ML Model**: Python service on port 5000
- **Database**: SQLite with same schema
- **Authentication**: Shared JWT tokens

---

## 💼 Deployment Options

### Option 1: Streamlit Cloud (Easiest) 🌟
- Cost: FREE
- Time to deploy: 5 minutes
- Link: https://share.streamlit.io
- Best for: Quick demos, portfolios

### Option 2: Heroku
- Cost: $7+/month (paid tier)
- Time to deploy: 15 minutes
- Link: https://www.heroku.com

### Option 3: AWS/Railway/DigitalOcean
- Cost: $5-50+/month
- Time to deploy: 30-60 minutes
- Best for: Production apps

### Option 4: Keep Local
- Cost: FREE
- Best for: Development, testing

---

## 📊 Comparison

| Aspect | React App | Streamlit App |
|--------|-----------|---------------|
| **Deployment** | 🔴 Complex | 🟢 1-Click |
| **Hosting** | 🟡 Manual | 🟢 Free Tier |
| **Performance** | 🟢 Excellent | 🟡 Good |
| **Customization** | 🟢 Unlimited | 🟡 Limited |
| **Learning Curve** | 🔴 Steep | 🟢 Easy |
| **Best For** | Production | Quick Launch |

---

## 🎓 Next Steps

1. **Test Streamlit Locally**
   ```bash
   streamlit run streamlit_app/streamlit_app.py
   ```

2. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Add Streamlit version"
   git push
   ```

3. **Deploy to Streamlit Cloud**
   - Go to https://share.streamlit.io
   - Sign in with GitHub
   - Click "New app"
   - Select your repo and deploy!

4. **Share Your App**
   - Get your unique URL
   - Share with friends/colleagues
   - Embedded in portfolio

---

## 🆘 Troubleshooting

### Streamlit won't start
```bash
pip install streamlit --upgrade
streamlit run streamlit_app/streamlit_app.py
```

### Backend connection error
Make sure `npm run dev` is running on port 3000

### ML service timeout
Make sure `python diabetes_prediction.py` is running on port 5000

### Secret not found error
Add API keys to `.streamlit/secrets.toml`

---

## 📞 Resources

- Streamlit Docs: https://docs.streamlit.io
- Deploy Guide: See `STREAMLIT_DEPLOYMENT.md`
- Streamlit Cloud: https://streamlit.io/cloud
- Support Forum: https://discuss.streamlit.io

---

## ✅ What's Working

✅ Risk Prediction with ML model
✅ AI Chatbot with Google Gemini
✅ Food Scanner with nutrition analysis
✅ Health Calculators (4 tools)
✅ Educational Resources (5 modules)
✅ Professional UI/UX
✅ Mobile responsive
✅ Local testing ready
✅ Cloud deployment ready

---

**You now have a fully functional Streamlit alternative to your React app! 🚀**

Choose deployment based on your needs:
- **Quick demo?** → Streamlit Cloud (5 min)
- **Production?** → Host both React + backend
- **Learning?** → Run locally

Happy deploying! 🎉
