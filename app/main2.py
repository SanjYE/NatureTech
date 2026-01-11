import pandas as pd
import numpy as np
import math

file_path = "final.xlsx"
df = pd.read_excel(file_path)


density_lookup = {
    "bamboo": {
        "tc balcooa": {"old": 153294.4946, "new": 642.545797},
        "big bamboo": {"old": 1.193749158, "new": 1266.8842},
    },
    "fruit": {
        "lime": 560,
        "olive": 985,
        "pecan": 770,
        "plum": 720,
        "peach": 730,
        "apricot": 750,
        "pomegranate": 770,
        "berry": 560,
    },
    "other": 560
}


fixed_circumference_lookup = {
    "bamboo": {
        "tc balcooa": {"old": 0.03, "new": 0.085},
        "big bamboo": {"old": 0.14, "new": 0.165},
    }
}

avg_volume_lookup = {
    "bamboo": {
        "tc balcooa": {"old": 6.52339e-07, "new": 0.00171194},
        "big bamboo": {"old": 3.183248319, "new": 0.004262426}
    }
}

plant_density_lookup = {
    "bamboo": {
        "tc balcooa": 368,
        "big bamboo": 32
    },
    "fruit": {
        "plum": 10,
        "pecan": 10,
        "olive": 7,
        "apricot": 7,
        "lemon": 2,
        "pomegranate": 2,
        "peach": 3,
        "berry": 50
    },
    "other": 100
}


def get_multiplier(row):
    rowtype = str(row.get("Rowtype", "")).strip().lower()
    planttype = str(row.get("Planttype", "")).strip().lower()

    if rowtype == "bamboo":
        return plant_density_lookup["bamboo"].get(planttype, np.nan)
    elif rowtype == "fruit":
        return plant_density_lookup["fruit"].get(planttype, np.nan)
    else:
        return plant_density_lookup["other"]

def calculate_biomass(row, phase):  # phase = "old" or "new"
    rowtype = str(row.get("Rowtype", "")).strip().lower()
    planttype = str(row.get("Planttype", "")).strip().lower()

    if rowtype == "bamboo":
        diameter = row["oldBambooDiameteratbase"] if phase == "old" else row["newBambooShootdiameter"]
        count = row["oldBambooNumberofculms"] if phase == "old" else row["newBambooShoots"]

        if pd.notna(diameter) and pd.notna(count):
            radius_m = (diameter / 100) / 2
            query_circumference = 2 * math.pi * radius_m
        else:
            return np.nan

        density = density_lookup["bamboo"].get(planttype, {}).get(phase, np.nan)
        fixed_circ = fixed_circumference_lookup["bamboo"].get(planttype, {}).get(phase, np.nan)
        avg_vol = avg_volume_lookup["bamboo"].get(planttype, {}).get(phase, np.nan)

        if all(pd.notna([query_circumference, density, fixed_circ, avg_vol])):
            biomass = ((query_circumference * density) / fixed_circ) * avg_vol
            return biomass * count  
        else:
            return np.nan

    elif rowtype in ["fruit", "other"]:
        if phase == "new":
            return np.nan
        height = row.get("fruitHeight")
        diameter = row.get("fruitDiameter")

        if pd.notna(height) and pd.notna(diameter):
            radius_m = (diameter / 100) / 2
            height_m = height / 100
            volume = math.pi * (radius_m ** 2) * height_m

            if rowtype == "fruit":
                density = density_lookup["fruit"].get(planttype, np.nan)
            else:
                density = density_lookup["other"]

            if pd.notna(density):
                biomass = volume * density
                return biomass

        return np.nan

    else:
        return np.nan



df["oldculmbiomass"] = df.apply(lambda row: calculate_biomass(row, "old"), axis=1)
df["newculmbiomass"] = df.apply(lambda row: calculate_biomass(row, "new"), axis=1)
df["totalplantbiomass"] = df[["oldculmbiomass", "newculmbiomass"]].sum(axis=1, skipna=True)
df["perhectarebiomass"] = df.apply(lambda row: row["totalplantbiomass"] * get_multiplier(row) if pd.notna(row["totalplantbiomass"]) else np.nan, axis=1)


df.to_excel("final3.xlsx", index=False)
print("Biomass columns recalculated and updated.")
