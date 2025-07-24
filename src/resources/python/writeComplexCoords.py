import json

# Input and output file paths
input_file = "../mta_subway_complexes.geojson"        # complex stations, given by MTA and turned into geojson by convertComplexCSVToJSON.py

output_geojson = "../ComplexGeometry.geojson"         # filtered GeoJSON
output_json = "../ComplexGeometry.json"        # compact JSON format
output_js = "../../utils/ComplexGeometry.js"          # JavaScript file in ../../utils

# Load the GeoJSON file
with open(input_file, "r") as f:
    data = json.load(f)

# Create filtered GeoJSON and compact JSON format
filtered_features = []
compact_data = {}

for feature in data["features"]:
    # Extract properties
    complex_id = feature["properties"]["complex_id"]
    ada = feature["properties"]["ada"]
    coordinates = feature["geometry"]["coordinates"]

    # GeoJSON format
    new_feature = {
        "type": "Feature",
        "properties": {
            "complex_id": complex_id
        },
        "geometry": feature["geometry"]
    }
    filtered_features.append(new_feature)

    # Compact JSON format
    compact_data[complex_id] = coordinates

# Write the filtered GeoJSON
filtered_geojson = {
    "type": "FeatureCollection",
    "features": filtered_features
}

# Save the GeoJSON file
with open(output_geojson, "w") as f:
    json.dump(filtered_geojson, f, indent=2)

# Save the compact JSON file
with open(output_json, "w") as f:
    json.dump(compact_data, f, indent=2)

# Save the compact JSON as a JavaScript const
js_content = f"export const complexCoordinates = {json.dumps(compact_data, indent=2)};\n\nexport default complexCoordinates;"

with open(output_js, "w") as f:
    f.write(js_content)

# Print confirmation
print(f"\n**[4] COMPLEX COORDINATES:**\n✅ Generated {len (filtered_features)} features and saved GEOJSON to {output_geojson}")
print(f"JSON saved to {output_json}")
print(f"JavaScript file saved to {output_js}")
