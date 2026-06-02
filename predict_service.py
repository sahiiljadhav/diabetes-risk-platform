"""
Flask backend service for diabetes prediction.
This service loads the trained ML model and provides predictions via REST API.
"""

import os
import sys
import json
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# =====================
# Initialize Model
# =====================
script_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(script_dir, "model.pkl")
SCALER_PATH = os.path.join(script_dir, "scaler.pkl")

# Check if model exists
if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
    print("ERROR: Model files not found!")
    print(f"Expected model at: {MODEL_PATH}")
    print(f"Expected scaler at: {SCALER_PATH}")
    print("\nPlease run diabetes_prediction.py first to train and save the model:")
    print("  python diabetes_prediction.py")
    sys.exit(1)

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print(f"✓ Model loaded successfully from {MODEL_PATH}")
    print(f"✓ Scaler loaded successfully from {SCALER_PATH}")
except Exception as e:
    print(f"ERROR loading model: {e}")
    sys.exit(1)

# Feature order (must match training data)
FEATURE_ORDER = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]

# =====================
# API Routes
# =====================

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Diabetes prediction service is running"})

@app.route("/predict", methods=["POST"])
def predict():
    """
    Main prediction endpoint.
    Expects JSON with the 7 required features.
    Returns prediction, probability, and risk level.
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract features in correct order
        features = []
        for feature in FEATURE_ORDER:
            if feature not in data:
                return jsonify({"error": f"Missing feature: {feature}"}), 400
            
            try:
                value = float(data[feature])
                features.append(value)
            except (ValueError, TypeError):
                return jsonify({"error": f"Invalid value for {feature}"}), 400
        
        # Convert to numpy array and reshape
        features_array = np.array(features).reshape(1, -1)
        
        # Scale features using the same scaler used during training
        features_scaled = scaler.transform(features_array)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        prediction_proba = model.predict_proba(features_scaled)[0]
        
        # Get probability for positive class (diabetic)
        probability = float(prediction_proba[1])
        
        # Determine prediction label and risk level
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
        
        # Return result
        return jsonify({
            "prediction": prediction_label,
            "probability": round(probability, 4),
            "risk_level": risk_level,
            "confidence": round(max(prediction_proba) * 100, 2),
        })
    
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route("/model-info", methods=["GET"])
def model_info():
    """Return information about the loaded model"""
    try:
        return jsonify({
            "model_type": str(type(model).__name__),
            "features": FEATURE_ORDER,
            "feature_count": len(FEATURE_ORDER),
            "status": "ready"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    PORT = 5000
    print(f"\n{'='*60}")
    print(f"Starting Diabetes Prediction Service")
    print(f"{'='*60}")
    print(f"Server running on http://localhost:{PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    print(f"Model info: http://localhost:{PORT}/model-info")
    print(f"Predictions: POST to http://localhost:{PORT}/predict")
    print(f"{'='*60}\n")
    
    app.run(host="0.0.0.0", port=PORT, debug=False)
