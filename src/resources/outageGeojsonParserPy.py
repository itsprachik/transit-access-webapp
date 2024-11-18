import json

# Load the GeoJSON data from the file
with open('custom_dataset.json') as f:
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
with open('../assets/elevatorOutagesDataset.geojson', 'w') as f:
    json.dump(outage_geojson, f, indent=2)
    
# Write geometry json data to a file
with open('elevatorOutageGeometry.json', 'w') as f:
    json.dump(outage_geometry_json, f, indent=2)
