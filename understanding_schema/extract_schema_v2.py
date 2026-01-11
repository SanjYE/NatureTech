import pandas as pd

file_path = 'Database Schema 16Dec2025 v5 (Plants+2LayerObservations).xlsx'
exclude_sheets = ['V5_Notes', 'DB_Schema']

try:
    xls = pd.ExcelFile(file_path)
    print("--- Excel Schema Extraction ---")
    
    schema_info = {}

    for sheet in xls.sheet_names:
        if sheet in exclude_sheets:
            continue
        
        # Read first 10 rows to find header
        df_head = pd.read_excel(file_path, sheet_name=sheet, nrows=10, header=None)
        
        header_row_idx = -1
        for idx, row in df_head.iterrows():
            # Check if 'Table Fields' is in the row values
            if 'Table Fields' in row.values:
                header_row_idx = idx
                break
        
        if header_row_idx != -1:
            # Read the actual data
            df = pd.read_excel(file_path, sheet_name=sheet, header=header_row_idx)
            # Filter out empty rows in 'Table Fields'
            if 'Table Fields' in df.columns:
                columns = df['Table Fields'].dropna().tolist()
                # Clean column names (remove whitespace)
                columns = [str(c).strip() for c in columns]
                print(f"TABLE: {sheet}")
                print(f"COLUMNS: {', '.join(columns)}")
                print("-" * 20)
                schema_info[sheet] = columns
            else:
                print(f"WARNING: 'Table Fields' column not found in sheet {sheet}")
        else:
            print(f"WARNING: Header row not found in sheet {sheet}")

except Exception as e:
    print(f"Error: {e}")
