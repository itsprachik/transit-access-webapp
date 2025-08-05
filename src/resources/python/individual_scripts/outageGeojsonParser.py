import os
import json

# Get directory where this script is located
THIS_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths relative to the script's directory
INPUT_DATASET = os.path.join(THIS_DIR, "..", "..", "custom_elevator_dataset.json")
INPUT_OUTAGE_DATASET = os.path.join(THIS_DIR, "..", "..", "generated", "elevatorOutagesDataset.geojson")
OUTPUT_DATASET = os.path.join(THIS_DIR, "..", "..", "generated", "elevatorOutageGeometry.json")
OUTPUT_JS = os.path.join(THIS_DIR, "..", "..", "..", "utils", "elevatorOutageGeometry.ts") 

# Load the GeoJSON data from the file
with open(INPUT_DATASET) as f:
    geojson = json.load(f)

# Initialize an empty list to store the transformed data
outage_features = []

# Initialize an empty dictionary to use to map real time data with
outage_geometry_json = {}

# Iterate through each feature in the GeoJSON data
for feature in geojson['features']:
    if feature['properties']['system'] == 'nyc_mta' or 'nyc_sir':
        obj = {
            'type': feature['type'],
            'id': feature['properties']['elevatorno'],
            'properties': {
                'elevatorno': feature['properties']['elevatorno'],
                'isBroken':  False
            },
            'geometry': {
                'coordinates': feature['geometry']['coordinates'],
                'type': feature['geometry']['type']
            }
        }
        
        outage_geometry_json[feature['properties']['elevatorno']] = feature['geometry']['coordinates']
        
        outage_features.append(obj)

outage_geojson = {
    'features': outage_features,
    'type': 'FeatureCollection'

}

# Write the transformed data to a file
with open(INPUT_OUTAGE_DATASET, 'w') as f:
    json.dump(outage_geojson, f, indent=2)
    
# Write geometry json data to a file
with open(OUTPUT_DATASET, 'w') as f:
    json.dump(outage_geometry_json, f, indent=2)

# Save the compact JSON as a JavaScript const
js_content = f"export const elevatorCoordinates: Record<string, [number, number]> = {json.dumps(outage_geometry_json, indent=2)}"

with open(OUTPUT_JS, "w") as f:
    f.write(js_content)

print(f"\n**[1] ELEVATOR COORDINATES**\n✅ Generated {len(outage_features)} features and saved to {OUTPUT_DATASET}")
print(f"JavaScript file saved to {OUTPUT_JS}")