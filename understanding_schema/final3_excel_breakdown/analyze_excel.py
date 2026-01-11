import pandas as pd
import os

file_path = r'c:\Users\sanja\Desktop\Mobile_Frontend_App\app\final3.xlsx'

try:
    # Read the Excel file
    # Reading the first few rows to get headers
    df = pd.read_excel(file_path)
    
    print("Columns found in final3.xlsx:")
    for col in df.columns:
        print(col)
        
    print("\nFirst few rows to understand data types:")
    print(df.head())

except Exception as e:
    print(f"Error reading Excel file: {e}")
