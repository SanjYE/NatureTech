import pandas as pd

file_path = 'Database Schema 16Dec2025 v5 (Plants+2LayerObservations).xlsx'

try:
    # Inspect 'organisations' sheet to find the header
    # header=None means read the first row as data, not header
    df = pd.read_excel(file_path, sheet_name='organisations', nrows=5, header=None)
    print("--- First 5 rows of 'organisations' (header=None) ---")
    print(df)
    print("-" * 20)

except Exception as e:
    print(f"Error: {e}")
