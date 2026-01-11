import pandas as pd
import os

file_path = 'Database Schema 16Dec2025 v5 (Plants+2LayerObservations).xlsx'
sheets_to_process = [
    'organisations',
    'profiles',
    'organisation_memberships',
    'sites',
    'site_units',
    'crops',
    'crop_cycles'
]

output_file = 'DATABASE_SCHEMA.md'

def process_sheet(sheet_name):
    try:
        # Read the sheet, assuming the header might be down a few rows
        # We'll read the first 20 rows to find the header
        df_raw = pd.read_excel(file_path, sheet_name=sheet_name, header=None, nrows=20)
        
        header_row_idx = -1
        for idx, row in df_raw.iterrows():
            # Check if 'Table Fields' or 'Field Name' is in the row values
            row_values = [str(val).strip() for val in row.values]
            if 'Table Fields' in row_values:
                header_row_idx = idx
                break
        
        if header_row_idx == -1:
            return f"## {sheet_name}\n\nCould not find header row containing 'Table Fields'.\n\n"

        # Read the dataframe again with the correct header
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=header_row_idx)
        
        # Clean up column names (strip whitespace)
        df.columns = [str(col).strip() for col in df.columns]
        
        # Filter for relevant columns if they exist
        # Based on previous peek: Key?, Table Fields, Description, Data Type, Nullable?, FK / Constraints / Notes
        relevant_cols = ['Table Fields', 'Data Type', 'Key?', 'Nullable?', 'Description', 'FK / Constraints / Notes']
        existing_cols = [col for col in relevant_cols if col in df.columns]
        
        if not existing_cols:
             return f"## {sheet_name}\n\nCould not find expected columns.\nFound: {df.columns.tolist()}\n\n"

        df_subset = df[existing_cols].copy()
        
        # Drop rows where 'Table Fields' is NaN (empty rows)
        if 'Table Fields' in df_subset.columns:
            df_subset = df_subset.dropna(subset=['Table Fields'])
        
        # Generate Markdown table
        markdown_output = f"## {sheet_name}\n\n"
        markdown_output += df_subset.to_markdown(index=False)
        markdown_output += "\n\n"
        
        return markdown_output

    except Exception as e:
        return f"## {sheet_name}\n\nError processing sheet: {e}\n\n"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("# Database Schema\n\n")
    f.write(f"Source: {file_path}\n\n")
    
    for sheet in sheets_to_process:
        print(f"Processing {sheet}...")
        content = process_sheet(sheet)
        f.write(content)

print(f"Schema documentation generated in {output_file}")
