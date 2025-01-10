import json

# File paths
CUSTOM_DATASET_FILE = "../custom_dataset.json"
MTA_STATIONS_FILE = "../mta_subway_stations.geojson"
OUTPUT_FILE = "../street_to_station_lines.geojson"

# Load datasets
with open(CUSTOM_DATASET_FILE, "r") as f:
    custom_data = json.load(f)

with open(MTA_STATIONS_FILE, "r") as f:
    mta_stations = json.load(f)

# Create a lookup dictionary for stations by station_id
stations_lookup = {
    station["properties"]["station_id"]: station["geometry"]["coordinates"]
    for station in mta_stations["features"]
}

# Create a list of LineString features
lines = []

for feature in custom_data["features"]:
    # Check if the feature is a street elevator and the system is 'nyc_mta'
    if feature["properties"].get("isStreet") and feature["properties"].get("system") == "nyc_mta":
        station_id = feature["properties"].get("stationID")
        title = feature["properties"].get("title")
        elevatorno = feature["properties"].get("elevatorno")
        if station_id in stations_lookup:
            street_elevator_coords = feature["geometry"]["coordinates"]
            station_coords = stations_lookup[station_id]
            # Create a LineString feature
            lines.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [street_elevator_coords, station_coords]
                },
                "properties": {
                    "station_id": station_id,
                    "elevator_no": elevatorno,
                    "station_name": title
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
