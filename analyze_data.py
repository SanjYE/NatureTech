import json
from collections import defaultdict
from datetime import datetime

with open('src/data/yieldData.json', 'r') as f:
    data = json.load(f)

raw_data = data['rawData']

# Group by plant (we don't have ID in json, but we have block + row + plantType? No, user said "tagged by their plant id".
# In convert_data.py, I didn't export the ID!
# "row": str(row.get('Rownumber', 'Standard'))
# I need to export the ID to track individual plants.

print("Sample record:", raw_data[0])

# Check counts per month
month_counts = defaultdict(int)
for item in raw_data:
    d = item['date'][:7] # YYYY-MM
    month_counts[d] += 1

print("\nRecords per month:")
for m in sorted(month_counts.keys()):
    print(f"{m}: {month_counts[m]}")
