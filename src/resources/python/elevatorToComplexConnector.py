import json

# File paths
CUSTOM_DATASET_FILE = "../custom_dataset.json"
MTA_STATIONS_FILE = "../mta_subway_complexes.geojson"
OUTPUT_FILE = "../street_to_complex_lines.geojson"

# Load datasets
with open(CUSTOM_DATASET_FILE, "r") as f:
    custom_data = json.load(f)

with open(MTA_STATIONS_FILE, "r") as f:
    mta_stations = json.load(f)

# Create a lookup dictionary for complexes by complex_id
station_complex_lookup = {
    station_complex["properties"]["complex_id"]: station_complex["geometry"]["coordinates"]
    for station_complex in mta_stations["features"]
}

# Create a list of LineString features
lines = []

for feature in custom_data["features"]:
    # Check if the feature is a street elevator and the system is 'nyc_mta' or 'nyc_sir'
    if feature["properties"].get("isStreet") and (
        feature["properties"].get("system") == "nyc_mta" or feature["properties"].get("system") == "nyc_sir"
    ):
        complex_id = feature["properties"].get("complexID")
        title = feature["properties"].get("title")
        elevatorno = feature["properties"].get("elevatorno")
        ada = feature["properties"].get("ada")

        if complex_id in station_complex_lookup:
            street_elevator_coords = feature["geometry"]["coordinates"]
            complex_coords = station_complex_lookup[complex_id]

            # Determine side
            side = "left" if street_elevator_coords[0] < complex_coords[0] else "right"

            # Create a LineString feature
            lines.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [street_elevator_coords, complex_coords]
                },
                "properties": {
                    "complex_id": complex_id,
                    "elevator_no": elevatorno,
                    "station_name": title,
                    "ada": ada,
                    "side": side
                }
            })

# Create the output GeoJSON structure
output_geojson = {
    "type": "FeatureCollection",
    "features": lines
}

# Write to output file
with open(OUTPUT_FILE, "w") as f:
    json.dump(output_geojson, f, indent=2)

print(f"Generated {len(lines)} LineString features and saved to {OUTPUT_FILE}")