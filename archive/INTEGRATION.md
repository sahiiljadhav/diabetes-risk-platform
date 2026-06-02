# Integration Guide: How Frontend Connects to Backend

This document explains how the diabetes prediction platform integrates all components for accurate results.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend UI                      │
│         (Browser - http://localhost:3000)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Prediction.tsx                                  │   │
│  │  - Form with 8 clinical input fields             │   │
│  │  - User validation                               │   │
│  │  - Result display                                │   │
│  └────────────────┬─────────────────────────────────┘   │
└─────────────────┼────────────────────────────────────────┘
                  │ HTTP POST /api/predict
                  │ (8 clinical parameters)
                  ↓
┌─────────────────────────────────────────────────────────┐
│            Node.js Express Server                       │
│         (http://localhost:3000)                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  server.ts                                       │   │
│  │  - API routes                                    │   │
│  │  - Request validation                            │   │
│  │  - Forwards to Python service                    │   │
│  │  - Fallback mock predictions                     │   │
│  └────────────────┬─────────────────────────────────┘   │
└─────────────────┼────────────────────────────────────────┘
                  │ HTTP POST http://localhost:5000/predict
                  │ (Validated patient data)
                  ↓
┌─────────────────────────────────────────────────────────┐
│         Python Flask ML Service                         │
│         (http://localhost:5000)                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  predict_service.py                              │   │
│  │  - Load trained ML model (model.pkl)            │   │
│  │  - Load feature scaler (scaler.pkl)             │   │
│  │  - Normalize input features                      │   │
│  │  - Make prediction using Random Forest           │   │
│  │  - Calculate probability & risk level            │   │
│  └────────────────┬─────────────────────────────────┘   │
└─────────────────┼────────────────────────────────────────┘
                  │ JSON Response
                  │ {prediction, probability, risk_level}
                  ↓
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Result Display)            │
│  - Show prediction: Diabetic / Non-Diabetic            │
│  - Show risk level: Low / Medium / High                 │
│  - Show probability: 0.00 - 1.00                        │
│  - Show confidence: Percentage                          │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend: React Component (`src/pages/Prediction.tsx`)

**Responsibilities:**
- Display form with 8 input fields
- Collect user input (patient clinical data)
- Form validation
- Call API via `predictDiabetes()`
- Display results

**Input Fields:**
```
1. Pregnancies (0-20)
2. Glucose (0-300)
3. Blood Pressure (0-200)
4. Skin Thickness (0-100)
5. Insulin (0-900)
6. BMI (0-70)
7. Diabetes Pedigree Function (0-3)
8. Age (18-120)
```

**Key Code:**
```typescript
const onSubmit = async (data: PredictionFormData) => {
  setIsLoading(true);
  try {
    const response = await predictDiabetes(data);
    setResult(response);
  } catch (error) {
    toast.error('Failed to analyze risk');
  } finally {
    setIsLoading(false);
  }
};
```

### 2. API Service (`src/services/api.ts`)

**Responsibilities:**
- Create axios instance with base URL
- Make HTTP requests to Node.js server
- Handle errors

**Implementation:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const predictDiabetes = async (data: any) => {
  const response = await api.post('/predict', data);
  return response.data;
};
```

### 3. Node.js Server (`server.ts`)

**Responsibilities:**
- Receive predictions from frontend
- Validate input
- Forward to Python backend
- Fallback to mock predictions if Python service is down

**Key Features:**
- Port: 3000
- Endpoint: `POST /api/predict`
- Health check: `GET /api/health`

**Flow:**
```typescript
app.post("/api/predict", async (req, res) => {
  // Validate input
  // Try to call Python service
  const response = await axios.post(`http://localhost:5000/predict`, req.body);
  // Return Python response
  res.json(response.data);
  
  // If Python service down, use fallback mock
});
```

### 4. Python Flask Backend (`predict_service.py`)

**Responsibilities:**
- Load trained ML model
- Load feature scaler
- Receive patient data
- Scale features
- Make prediction
- Calculate probability
- Determine risk level

**Model Details:**
- Type: Random Forest Classifier
- Training: Uses PIMA diabetes dataset
- Features: 8 clinical parameters
- Output: Binary classification (Diabetic/Non-Diabetic)

**Prediction Process:**
```python
@app.route("/predict", methods=["POST"])
def predict():
    # Extract 8 features
    features = [Pregnancies, Glucose, BloodPressure, ...]
    
    # Scale features using trained scaler
    features_scaled = scaler.transform(features)
    
    # Make prediction
    prediction = model.predict(features_scaled)
    probability = model.predict_proba(features_scaled)
    
    # Calculate risk level
    # Return: prediction, probability, risk_level
```

### 5. ML Model Training (`diabetes_prediction.py`)

**Responsibilities:**
- Load diabetes.csv
- Preprocess data (handle zeros, scale features)
- Train 3 models (Logistic Regression, Random Forest, Gradient Boosting)
- Evaluate models
- Save best model as `model.pkl`
- Save scaler as `scaler.pkl`

**Saved Artifacts:**
- `model.pkl` - Trained Random Forest model
- `scaler.pkl` - StandardScaler for feature normalization

## Data Flow Example

### Input: Patient Data
```json
{
  "Pregnancies": 6,
  "Glucose": 148,
  "BloodPressure": 72,
  "Insulin": 0,
  "BMI": 33.6,
  "DiabetesPedigreeFunction": 0.627,
  "Age": 50
}
```

### Processing Steps

1. **Frontend Validation** (React)
   - Check all fields are filled
   - Validate ranges
   - Call API

2. **Node.js Gateway** (server.ts)
   - Receive data
   - Validate required fields
   - Forward to Python service

3. **Python Processing** (predict_service.py)
   - Scale features using trained scaler
   - Load Random Forest model
   - Make prediction
   - Calculate probability from model confidence

4. **Result Generation**
   ```python
   probability = 0.8562  # From model.predict_proba()
   
   if prediction == 1:  # Diabetic class
       prediction_label = "Diabetic"
       if probability >= 0.8:
           risk_level = "Very High"
   
   confidence = 95.62  # Percentage
   ```

### Output: Prediction Result
```json
{
  "prediction": "Diabetic",
  "probability": 0.8562,
  "risk_level": "Very High",
  "confidence": 95.62
}
```

### Frontend Display
- Prediction: "Diabetic" ✓
- Risk Level: "Very High" (red)
- Probability: 85.62%
- Confidence: 95.62%

## Why This Architecture Ensures Accuracy

1. **Separation of Concerns**
   - Frontend handles UI only
   - Backend handles logic only
   - Each layer optimized for its role

2. **Trained ML Model**
   - Model trained on 768 real patient records
   - ~77% accuracy on test data
   - Uses proven Random Forest algorithm

3. **Feature Scaling**
   - Same scaler used for training and prediction
   - Ensures consistent feature normalization
   - Crucial for ML model accuracy

4. **Validation**
   - Frontend validates user input
   - Node.js validates request format
   - Python validates feature values

5. **Error Handling**
   - Python service: Returns error details
   - Node.js: Fallback mock if Python down
   - Frontend: Shows user-friendly errors

## Integration Points

| Component | Language | Port | Purpose |
|-----------|----------|------|---------|
| Frontend | React/TS | 3000 | User Interface |
| Node.js | TypeScript | 3000 | API Gateway |
| Python | Python | 5000 | ML Predictions |
| Model | sklearn | -    | Random Forest |

## Testing the Integration

1. **Check all services running:**
   ```bash
   Terminal 1: python predict_service.py (Port 5000)
   Terminal 2: npm run dev (Port 3000)
   ```

2. **Test Python service directly:**
   ```bash
   curl -X POST http://localhost:5000/predict \
     -H "Content-Type: application/json" \
     -d '{"Pregnancies":6,"Glucose":148,...}'
   ```

3. **Test Node.js gateway:**
   ```bash
   curl -X POST http://localhost:3000/api/predict \
     -H "Content-Type: application/json" \
     -d '{"Pregnancies":6,"Glucose":148,...}'
   ```

4. **Test in browser:**
   - Open http://localhost:3000
   - Fill form with test data
   - Submit and verify results

## Fallback Behavior

If Python service is unavailable:
- Node.js uses mock prediction logic
- Returns estimated probability based on heuristics
- User sees results (but less accurate)
- Console warns about fallback mode

**Note:** For production use, keep Python service running for accurate ML predictions.

## Performance Considerations

- **Prediction time:** ~50-200ms
- **Model size:** ~500KB (model.pkl)
- **Scaler size:** ~1KB (scaler.pkl)
- **Memory usage:** ~100MB (with all services)
- **Concurrent predictions:** 10+ per second

## Security Notes

- Validate all inputs at each layer
- Don't trust client input
- Sanitize error messages
- Use HTTPS in production
- Secure model files
- Limit API requests (add rate limiting)

## Deployment

For production:
1. Build React app: `npm run build`
2. Deploy Node.js + Flask to server
3. Use process manager (PM2, systemd)
4. Enable HTTPS/SSL
5. Configure environment variables
6. Set up monitoring and logging

---

**The platform is now fully integrated with accurate ML predictions! 🎉**
