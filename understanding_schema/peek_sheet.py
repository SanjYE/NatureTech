import pandas as pd

file_path = 'Database Schema 16Dec2025 v5 (Plants+2LayerObservations).xlsx'
sheet_name = 'organisations'

try:
    df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=5)
    print(f"--- First 5 rows of {sheet_name} ---")
    print(df.to_string())
    print("\n--- Columns ---")
    print(df.columns.tolist())
except Exception as e:
    print(f"Error: {e}")
