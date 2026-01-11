import pandas as pd
import numpy as np

file_path = r'c:\Users\sanja\Desktop\Mobile_Frontend_App\app\final3.xlsx'

def get_sql_type(dtype):
    if pd.api.types.is_integer_dtype(dtype):
        return 'INTEGER'
    elif pd.api.types.is_float_dtype(dtype):
        return 'DECIMAL(10, 2)'
    elif pd.api.types.is_bool_dtype(dtype):
        return 'BOOLEAN'
    elif pd.api.types.is_datetime64_any_dtype(dtype):
        return 'TIMESTAMP'
    else:
        return 'TEXT'

try:
    df = pd.read_excel(file_path)
    
    # Clean column names: lowercase
    df.columns = [c.strip() for c in df.columns]
    
    # Generate CREATE TABLE
    create_table_sql = "CREATE TABLE observations (\n"
    create_table_sql += "    observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n"
    create_table_sql += "    site_id UUID REFERENCES sites(site_id),\n" # Foreign Key
    
    for col in df.columns:
        sql_type = get_sql_type(df[col].dtype)
        # Handle specific known fields for better types
        if 'GPS' in col and ('Latitude' in col or 'Longitude' in col):
            sql_type = 'DECIMAL(9, 6)'
        elif 'Id' == col: # The Excel ID
            sql_type = 'INTEGER' 
        
        # Quote column name if it matches reserved words or has mixed case (though we are just printing it)
        # For simplicity, we'll use the column name as is, but maybe quoted if needed. 
        # Postgres folds to lower case unquoted. Let's keep them as is but assume they will be lowercased by PG.
        create_table_sql += f"    \"{col}\" {sql_type},\n"
    
    create_table_sql = create_table_sql.rstrip(",\n") + "\n);"
    
    print("-- SQL to create the table")
    print(create_table_sql)
    print("\n\n")
    
    # Generate INSERT statements for first 5 rows
    print("-- SQL to insert first 5 rows (Replace 'YOUR_SITE_ID_HERE' with an actual site_id UUID)")
    
    for idx, row in df.head(5).iterrows():
        cols = ['site_id'] + [f'"{c}"' for c in df.columns]
        vals = ["'YOUR_SITE_ID_HERE'"] # Placeholder for site_id
        
        for col in df.columns:
            val = row[col]
            if pd.isna(val):
                vals.append("NULL")
            elif isinstance(val, (int, float, np.number)):
                vals.append(str(val))
            else:
                # Escape single quotes in text
                val_str = str(val).replace("'", "''")
                vals.append(f"'{val_str}'")
        
        cols_str = ", ".join(cols)
        vals_str = ", ".join(vals)
        print(f"INSERT INTO observations ({cols_str}) VALUES ({vals_str});")

except Exception as e:
    print(f"Error: {e}")
