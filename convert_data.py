import pandas as pd
import json
import numpy as np
from datetime import datetime

def iqr_filter_remove_outliers(df, cols, multiplier=1.5):
    """
    Remove rows where any of the specified numeric columns are outside the IQR range.
    """
    clean = df.copy()
    for col in cols:
        if col not in clean.columns:
            continue
        clean[col] = pd.to_numeric(clean[col], errors="coerce")
        col_non_null = clean[col].dropna()
        if col_non_null.empty:
            continue
        q1 = col_non_null.quantile(0.25)
        q3 = col_non_null.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - multiplier * iqr
        upper = q3 + multiplier * iqr
        
        # Keep rows where col is NaN or within [lower, upper]
        mask_keep = clean[col].isna() | clean[col].between(lower, upper)
        clean = clean[mask_keep]
    return clean

def convert_to_json():
    try:
        # Load data
        df = pd.read_excel("app/final3.xlsx")
        df.columns = df.columns.str.strip()
        
        # Date parsing
        df['SubmittedOn'] = pd.to_datetime(df['SubmittedOn'], format='%d-%m-%Y %H:%M:%S', errors='coerce')
        
        # Clean Planttype
        df['Planttype'] = df['Planttype'].astype(str).str.strip().str.lower()
        
        # Clean Block Number
        df['Areablocknumber'] = df['Areablocknumber'].astype(str).str.extract(r'(\d+)')
        df['Areablocknumber'] = pd.to_numeric(df['Areablocknumber'], errors='coerce')

        # 1. Outlier Removal
        biomass_cols = ["oldculmbiomass", "newculmbiomass", "totalplantbiomass", "perhectarebiomass"]
        existing_biomass_cols = [c for c in biomass_cols if c in df.columns]
        if existing_biomass_cols:
            print(f"Removing outliers from: {existing_biomass_cols}")
            df = iqr_filter_remove_outliers(df, existing_biomass_cols)

        # 2. Cumulative Biomass Calculation
        if 'Itemnumber' in df.columns and 'totalplantbiomass' in df.columns:
            # Ensure totalplantbiomass is numeric
            df['totalplantbiomass'] = pd.to_numeric(df['totalplantbiomass'], errors='coerce').fillna(0.0)
            
            # Sort by Itemnumber and SubmittedOn
            df = df.sort_values(['Itemnumber', 'SubmittedOn'])
            
            # Compute cumulative sum per plant
            df['cumulative_biomass'] = df.groupby('Itemnumber')['totalplantbiomass'].cumsum()
            print("Calculated cumulative biomass.")

            # --- NEW: Forward Fill Logic to Fix Dips ---
            print("Applying forward fill to smooth data...")
            
            # 1. Create a monthly period for each record
            df['Month'] = df['SubmittedOn'].dt.to_period('M')
            
            # 2. Get the full range of months in the dataset
            min_month = df['Month'].min()
            max_month = df['Month'].max()
            all_months = pd.period_range(min_month, max_month, freq='M')
            
            # 3. Get all unique plants
            unique_plants = df['Itemnumber'].unique()
            
            # 4. Create a MultiIndex of (Plant, Month)
            idx = pd.MultiIndex.from_product([unique_plants, all_months], names=['Itemnumber', 'Month'])
            
            # 5. Reindex the dataframe to include all months for all plants
            # We aggregate by max in case of duplicates in same month, though unlikely
            df_filled = df.groupby(['Itemnumber', 'Month']).last().reindex(idx)
            
            # 6. Forward fill the cumulative biomass (and other static fields)
            # We group by level 0 (Itemnumber) to ensure we don't fill across different plants
            df_filled['cumulative_biomass'] = df_filled.groupby(level=0)['cumulative_biomass'].ffill().fillna(0)
            
            # Fill other static fields that might be needed
            df_filled['Planttype'] = df_filled.groupby(level=0)['Planttype'].ffill().bfill()
            df_filled['Areablocknumber'] = df_filled.groupby(level=0)['Areablocknumber'].ffill().bfill()
            
            # 7. Reset index to get back to a flat dataframe
            df_filled = df_filled.reset_index()
            
            # 8. Reconstruct the 'SubmittedOn' date (use the 1st of the month for filled records)
            # If the original record had a specific date, we lost it in the reindex/last() step, 
            # but for monthly trending, the 1st of the month is fine.
            # However, to keep original dates where possible, we could merge back. 
            # For simplicity and graph smoothness, let's use the month start.
            df_filled['SubmittedOn'] = df_filled['Month'].dt.to_timestamp()
            
            # Use this filled dataframe for the output
            df = df_filled
            print(f"Data smoothed. Row count increased to {len(df)}")
            # -------------------------------------------

        else:
            print("Warning: Missing 'Itemnumber' or 'totalplantbiomass'. Skipping cumulative calculation.")
            df['cumulative_biomass'] = 0

        # 4. Raw Data (Export all necessary fields for frontend filtering)
        raw_data = []
        for _, row in df.iterrows():
            if pd.isna(row['SubmittedOn']): continue
            
            # Handle Planttype safely
            plant_type = "Unknown"
            if not pd.isna(row['Planttype']):
                plant_type = str(row['Planttype']).title()

            raw_data.append({
                "date": row['SubmittedOn'].strftime('%Y-%m-%d'),
                "plantType": plant_type,
                "block": int(row['Areablocknumber']) if not pd.isna(row['Areablocknumber']) else 0,
                "biomass": round(row['perhectarebiomass'], 2) if not pd.isna(row.get('perhectarebiomass')) else 0,
                "cumulativeBiomass": round(row['cumulative_biomass'], 2) if not pd.isna(row.get('cumulative_biomass')) else 0,
                "row": str(row.get('Rownumber', 'Standard'))
            })

        # Filter Options
        # Re-calculate unique values from the filled dataframe
        unique_plants = df['Planttype'].dropna().unique()
        plant_types = sorted([str(p).title() for p in unique_plants])
        
        unique_blocks = df['Areablocknumber'].dropna().unique()
        blocks = sorted([int(b) for b in unique_blocks])

        output = {
            "rawData": raw_data,
            "filters": {
                "plantTypes": plant_types,
                "blocks": blocks
            }
        }

        with open('src/data/yieldData.json', 'w') as f:
            json.dump(output, f, indent=2)
            
        print("Successfully converted data to src/data/yieldData.json")

    except Exception as e:
        print(f"Error converting data: {e}")

if __name__ == "__main__":
    convert_to_json()
