"""Root Streamlit launcher for cloud deployment.

Streamlit Cloud can point to this file at the repository root.
It simply runs the real app located in streamlit_app/streamlit_app.py.
"""

from pathlib import Path
import runpy

APP_PATH = Path(__file__).parent / "streamlit_app" / "streamlit_app.py"

if not APP_PATH.exists():
    raise FileNotFoundError(f"Streamlit app not found at {APP_PATH}")

runpy.run_path(str(APP_PATH), run_name="__main__")
