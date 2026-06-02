import os
import glob
import sys
import pandas as pd
import numpy as np
import matplotlib
# Use non-interactive backend BEFORE importing pyplot
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    confusion_matrix,
    classification_report,
)

# -------------------------
# Configuration
# -------------------------
# CSV_FILENAME = "pima-indians-diabetes.csv"  # place CSV next to this script
CSV_CANDIDATES = [
    "pima-indians-diabetes.csv",
    "pima-indians-diabetes.data.csv",
    "diabetes.csv",
    "pima.csv",
]

RANDOM_STATE = 42

# -------------------------
# Helper function
# -------------------------
def find_csv_file(script_dir):
    # Try configured candidates first
    for name in CSV_CANDIDATES:
        path = os.path.join(script_dir, name)
        if os.path.isfile(path):
            return path
    # Fallback: pick first .csv in directory
    csvs = glob.glob(os.path.join(script_dir, "*.csv"))
    if csvs:
        return csvs[0]
    return None

# -------------------------
# Main pipeline
# -------------------------
def main():
    # 1. Load dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = find_csv_file(script_dir)
    if data_path is None:
        print("Error: No CSV file found in script directory.")
        print("Place the PIMA CSV (e.g. diabetes.csv or pima-indians-diabetes.csv) in:")
        print(f"  {script_dir}")
        sys.exit(1)
    df = pd.read_csv(data_path)

    # 2. Exploratory Data Analysis
    print("=== Dataset Shape ===")
    print(df.shape)
    print("\n=== First 5 Rows ===")
    print(df.head())
    print("\n=== Missing Values (per column) ===")
    print(df.isnull().sum())
    print("\n=== Class Distribution (Outcome) ===")
    print(df['Outcome'].value_counts())
    print("\n=== Class Distribution (percentage) ===")
    print(df['Outcome'].value_counts(normalize=True) * 100)

    # Correlation heatmap
    plt.figure(figsize=(10, 8))
    sns.set(style="whitegrid")
    corr = df.corr()
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", square=True)
    plt.title("Correlation Heatmap")
    plt.tight_layout()
    plt.savefig("correlation_heatmap.png")
    plt.close()
    print("✓ Saved correlation heatmap to correlation_heatmap.png")

    # Distribution plots for important features
    features_to_plot = ['Glucose', 'BMI', 'Age']
    for feat in features_to_plot:
        plt.figure(figsize=(8, 4))
        sns.histplot(df[feat], kde=True, bins=30, color='tab:blue')
        plt.title(f"Distribution of {feat}")
        plt.xlabel(feat)
        plt.ylabel("Count")
        plt.tight_layout()
        plt.savefig(f"distribution_{feat}.png")
        plt.close()
    print("✓ Saved feature distribution plots")

    # 3. Data Preprocessing
    df_proc = df.copy()

    cols_replace_zero = ['Glucose', 'BloodPressure', 'BMI', 'Insulin']
    for col in cols_replace_zero:
        if col in df_proc.columns:
            median_val = df_proc.loc[df_proc[col] != 0, col].median()
            # Replace zeros with median
            df_proc[col] = df_proc[col].replace(0, median_val)

    # Remove SkinThickness column from features (feature deprecated)
    if 'SkinThickness' in df_proc.columns:
        df_proc = df_proc.drop(columns=['SkinThickness'])

    # Features and target
    X = df_proc.drop(columns=['Outcome'])
    y = df_proc['Outcome']

    # Apply StandardScaler to features (as requested)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split dataset into 80% training and 20% testing
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    # 4. Model Training
    models = {
        "Logistic Regression": LogisticRegression(random_state=RANDOM_STATE, max_iter=1000),
        "Random Forest": RandomForestClassifier(random_state=RANDOM_STATE, n_estimators=100),
        "Gradient Boosting": GradientBoostingClassifier(random_state=RANDOM_STATE, n_estimators=100),
    }

    trained_models = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        trained_models[name] = model
        print(f"\nTrained: {name}")

    # 5. Evaluation
    results = []
    for name, model in trained_models.items():
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        cm = confusion_matrix(y_test, y_pred)
        report = classification_report(y_test, y_pred, zero_division=0)

        print(f"\n=== Evaluation: {name} ===")
        print(f"Accuracy : {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall   : {rec:.4f}")
        print("\nConfusion Matrix:")
        print(cm)
        print("\nClassification Report:")
        print(report)

        results.append({"Model": name, "Accuracy": acc, "Precision": prec, "Recall": rec})

    # 6. Feature Importance (Random Forest)
    rf = trained_models.get("Random Forest")
    if rf is not None:
        feat_importances = rf.feature_importances_
        feature_names = X.columns.tolist()
        fi_df = pd.DataFrame({"feature": feature_names, "importance": feat_importances})
        fi_df = fi_df.sort_values(by="importance", ascending=False)

        plt.figure(figsize=(10, 6))
        sns.barplot(x="importance", y="feature", data=fi_df, palette="viridis")
        plt.title("Feature Importances (Random Forest)")
        plt.xlabel("Importance")
        plt.ylabel("Feature")
        plt.tight_layout()
        plt.savefig("feature_importance.png")
        plt.close()
        print("✓ Saved feature importance plot to feature_importance.png")
        print("\nTop features (Random Forest):")
        print(fi_df.head())

    # 7. Final summary table
    summary_df = pd.DataFrame(results).sort_values(by="Accuracy", ascending=False).reset_index(drop=True)
    print("\n=== Model Comparison (Summary) ===")
    print(summary_df)

    # 8. Save the best model and scaler
    import joblib
    best_model = trained_models["Random Forest"]
    
    model_path = os.path.join(script_dir, "model.pkl")
    scaler_path = os.path.join(script_dir, "scaler.pkl")
    
    joblib.dump(best_model, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"\n✓ Model saved to: {model_path}")
    print(f"✓ Scaler saved to: {scaler_path}")

if __name__ == "__main__":
    main()
