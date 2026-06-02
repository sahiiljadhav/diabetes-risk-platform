# 🎯 Streamlit Deployment Guide

## Overview

Your DiaRisk AI platform now has a **Streamlit version** that runs alongside your React app. This provides an alternative interface that's easier to deploy and manage.

### What You Have:
- **React App** (Port 3000): Current full-featured interface
- **Streamlit App**: Cloud-friendly standalone interface
- **ML Model**: Loaded directly by Streamlit from `model.pkl` and `scaler.pkl`

---

## 🚀 Local Testing

### 1. Install Streamlit Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start All Services
You only need Streamlit for the UI. If `model.pkl` and `scaler.pkl` are missing, run `python diabetes_prediction.py` once to generate them.

**Streamlit App (Port 8501):**
```bash
streamlit run streamlit_app.py
```

### 3. Access Local App
- **Streamlit**: http://localhost:8501

---

## ☁️ Deploy to Streamlit Cloud (Free Tier)

### Prerequisites:
- GitHub account (to host your code)
- Streamlit Cloud account (free at https://streamlit.io/cloud)

### Step 1: Prepare Your Repository for Cloud

Add requirements file to root (already done):
```bash
# .streamlit/config.toml
# streamlit_app.py
# requirements.txt
```

### Step 2: Confirm Model Files

Make sure these files are committed or generated before deployment:

- `model.pkl`
- `scaler.pkl`

If you need to regenerate them, run:
```bash
python diabetes_prediction.py
```

### Step 3: Push to GitHub

1. Initialize GitHub repo in your project directory:
```bash
git init
git add .
git commit -m "Add Streamlit app"
git remote add origin https://github.com/yourusername/diabetes-risk-prediction.git
git push -u origin main
```

2. Create `.gitignore`:
```
__pycache__/
*.py[cod]
*$py.class
.env
*.db
node_modules/
dist/
.DS_Store
```

### Step 4: Deploy on Streamlit Cloud

1. Go to https://share.streamlit.io
2. Click **"New app"**
3. Select your GitHub repository
4. Choose branch: `main`
5. Set file path: `streamlit_app.py`
6. Click **"Deploy!"**
### Step 5: Environment Variables (if using cloud backend)

Create `secrets.toml` in `.streamlit/`:

```toml
GEMINI_API_KEY = "your-gemini-api-key"
```

---

## 📊 Feature Comparison

| Feature | React App | Streamlit App |
|---------|-----------|---------------|
| Full Control | ✅ | ⚠️ Limited |
| Deployment | Manual | One-Click |
| Customization | 🔴 High | 🟡 Medium |
| Performance | Fast | Good |
| Hosting Cost | Manual | Free Tier |
| Best For | Production | Quick Demos |

---

## 🔗 URLs After Deployment

- **Streamlit Cloud**: `https://your-username-diabetes-app.streamlit.app`
- **Your Domain**: Can be added to Streamlit Cloud Pro
- **React App**: Your hosted version (separate deployment needed)

---

## 💡 Tips for Success

1. **Test Locally First**: Always verify locally before pushing to cloud
2. **Use Environment Variables**: Keep secrets out of code
3. **Monitor Logs**: Streamlit Cloud shows real-time logs
4. **Auto-Deploy**: Streamlit auto-deploys on git push to main
5. **Cache Results**: Use `@st.cache_data` for expensive operations
6. **Handle Errors**: Add try-catch for API failures

---

## 🆘 Troubleshooting

### Backend Not Connecting
```
Error: Connection error - http://localhost:3000
```
**Solution**: Make sure Node.js server is running on port 3000

### ML Service Timeout
```
Error: timeout at http://localhost:5000/predict
```
**Solution**: Start Python diabetes_prediction.py service

### Module Import Error
```
ModuleNotFoundError: No module named 'streamlit'
```
**Solution**: 
```bash
pip install -r requirements.txt
```

### Too Large Files
Streamlit Cloud has upload limits:
- Images: Keep under 100MB
- Sessions: Keep under 500MB
- Use caching to reduce memory

---

## 🎨 Future Enhancements

- [ ] Add user authentication
- [ ] Store predictions in cloud database
- [ ] Create mobile-responsive layout
- [ ] Add more visualization charts
- [ ] Implement real food database API
- [ ] Add social sharing features
- [ ] Create admin dashboard

---

## 📞 Support

For Streamlit help: https://docs.streamlit.io
For deployment issues: https://discuss.streamlit.io

Happy deploying! 🚀
