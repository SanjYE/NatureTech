import pandas as pd
import os

file_path = 'Database Schema 16Dec2025 v5 (Plants+2LayerObservations).xlsx'

try:
    xls = pd.ExcelFile(file_path)
    print("Sheet names found:")
    for sheet in xls.sheet_names:
        print(f"- {sheet}")
except Exception as e:
    print(f"Error reading excel file: {e}")
