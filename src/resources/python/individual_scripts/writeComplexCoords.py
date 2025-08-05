import os
import json

# Get directory where this script is located
THIS_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths relative to the script's directory
input_file = os.path.join(THIS_DIR, "..", "..", "generated", "mta_subway_complexes.json")  # complex stations, given by MTA and turned into json by convertComplexCSVToJSON.py
output_geojson = os.path.join(THIS_DIR, "..", "..", "generated", "ComplexGeometry.geojson") # filtered GeoJSON
output_json = os.path.join(THIS_DIR, "..", "..", "generated", "ComplexGeometry.json") # compact JSON format
output_js = os.path.join(THIS_DIR, "..", "..", "..", "utils", "ComplexGeometry.ts") # JavaScript file in ../../../utils

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
js_content = f"export const complexCoordinates: Record<string, [number, number]> = {json.dumps(compact_data, indent=2)};\n\nexport default complexCoordinates;"

with open(output_js, "w") as f:
    f.write(js_content)

# Print confirmation
print(f"\n**[4] COMPLEX COORDINATES:**\n✅ Generated {len (filtered_features)} features and saved GEOJSON to {output_geojson}")
print(f"JSON saved to {output_json}")
print(f"JavaScript file saved to {output_js}")
