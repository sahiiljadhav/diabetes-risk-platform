import os
import joblib
print('MODEL_EXISTS', os.path.exists('model.pkl'), os.path.exists('scaler.pkl'))
try:
    m = joblib.load('model.pkl')
    s = joblib.load('scaler.pkl')
    print('MODEL_LOAD_OK')
except Exception as e:
    print('MODEL_LOAD_FAIL', e)
