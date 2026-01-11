import pandas as pd

file_path = 'Database Schema 16Dec2025 v5 (Plants+2LayerObservations).xlsx'
# Exclude meta sheets
exclude_sheets = ['V5_Notes', 'DB_Schema']

try:
    xls = pd.ExcelFile(file_path)
    print("--- Excel Schema Extraction ---")
    for sheet in xls.sheet_names:
        if sheet in exclude_sheets:
            continue
        
        # Read just the header
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=0)
        columns = df.columns.tolist()
        print(f"TABLE: {sheet}")
        print(f"COLUMNS: {', '.join(columns)}")
        print("-" * 20)

except Exception as e:
    print(f"Error: {e}")
