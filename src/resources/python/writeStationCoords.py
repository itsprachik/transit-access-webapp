import json

# Input and output file paths
input_file = "../mta_subway_stations_all.json"        # subway stations, given by MTA

output_geojson = "../accessibleStationGeometry.geojson"         # filtered GeoJSON
output_json = "../accessibleStationGeometry.json"        # compact JSON format
output_js = "../../utils/accessibleStationGeometry.ts"          # JavaScript file in ../../utils

# Load the GeoJSON file
with open(input_file, "r") as f:
    data = json.load(f)

# Create filtered GeoJSON and compact JSON format
filtered_features = []
compact_data = {}

for feature in data["features"]:
    # Extract properties
    station_id = feature["properties"]["station_id"]
    ada = feature["properties"].get("ada", "0")
    ada_northbound = feature["properties"].get("ada_northbound", "0")
    ada_southbound = feature["properties"].get("ada_southbound", "0")
    coordinates = feature["geometry"]["coordinates"]

    # Filter by ADA accessibility (any direction or general ADA)
    if ada != "0" or ada_northbound != "0" or ada_southbound != "0":
        # GeoJSON format
        new_feature = {
            "type": "Feature",
            "properties": {
                "station_id": station_id
            },
            "geometry": feature["geometry"]
        }
        filtered_features.append(new_feature)

        # Compact JSON format
        compact_data[station_id] = coordinates

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
js_content = f"export const stationCoordinates: Record<string, [number, number]> = {json.dumps(compact_data, indent=2)};\n\nexport default stationCoordinates;"

with open(output_js, "w") as f:
    f.write(js_content)

# Print confirmation
print(f"\n**[2] STATION COORDINATES:**\n✅ Generated {len (filtered_features)} features and saved GEOJSON to {output_geojson}")
print(f"JSON saved to {output_json}")
print(f"JavaScript file saved to {output_js}")
