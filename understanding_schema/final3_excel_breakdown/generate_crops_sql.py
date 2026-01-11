import pandas as pd

file_path = r'c:\Users\sanja\Desktop\Mobile_Frontend_App\app\final3.xlsx'

try:
    df = pd.read_excel(file_path)
    
    # Get unique Planttype values, drop NaNs
    unique_plants = df['Planttype'].dropna().unique()
    unique_plants = sorted([str(p).strip() for p in unique_plants if str(p).strip() != ''])
    
    print("-- SQL to create the crops lookup table")
    print("CREATE TABLE crops (")
    print("    species_code VARCHAR(3) PRIMARY KEY,")
    print("    plant_type_name TEXT UNIQUE")
    print(");")
    print("\n")
    
    print("-- SQL to insert plant types")
    for i, plant in enumerate(unique_plants, 1):
        # Generate 3-digit code: 001, 002, ...
        code = f"{i:03d}"
        # Escape single quotes for SQL
        plant_sql = plant.replace("'", "''")
        print(f"INSERT INTO crops (species_code, plant_type_name) VALUES ('{code}', '{plant_sql}');")

except Exception as e:
    print(f"Error: {e}")
