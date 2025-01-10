import json

# file paths
INPUT_DATASET = "../custom_dataset.json"
INPUT_OUTAGE_DATASET = '../../resources/elevatorOutagesDataset.geojson'
OUTPUT_DATASET = '../elevatorOutageGeometry.json'

# Load the GeoJSON data from the file
with open(INPUT_DATASET) as f:
    geojson = json.load(f)

# Initialize an empty list to store the transformed data
outage_features = []

# Initialize an empty dictionary to use to map real time data with
outage_geometry_json = {}

# Iterate through each feature in the GeoJSON data
for feature in geojson['features']:
    if feature['properties']['system'] == 'nyc_mta':
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

print(f"Generated {len(outage_features)} features and saved to {OUTPUT_DATASET}")