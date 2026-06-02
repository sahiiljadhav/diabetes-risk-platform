modules=['streamlit','requests','pandas','PIL','joblib','numpy','sklearn','plotly','dotenv']
import importlib
failed=[]
for m in modules:
    try:
        importlib.import_module(m)
    except Exception as e:
        failed.append((m,str(e)))
if not failed:
    print('SMOKE_IMPORT_OK')
else:
    for m,e in failed:
        print('FAIL',m,e)
