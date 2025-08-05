import json

# File paths
CUSTOM_DATASET_FILE = "../../custom_dataset.json"
MTA_STATIONS_FILE = "../../mta_subway_stations_all.json"
OUTPUT_FILE = "../../street_to_station_lines.geojson"

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
    # Check if the feature is a street elevator and the system is 'nyc_mta' or 'nyc_sir'
    if feature["properties"].get("isStreet") and (
        feature["properties"].get("system") in {"nyc_mta", "nyc_sir"}
    ):
        # Use stationID_near if available, otherwise fall back to stationID
        raw_station_ids = feature["properties"].get("stationID_near") or feature["properties"].get("stationID")
        title = feature["properties"].get("title")
        elevatorno = feature["properties"].get("elevatorno")

        if not raw_station_ids:
            continue

        # Handle multiple IDs separated by "/"
        station_ids = [s.strip() for s in str(raw_station_ids).split("/")]

        street_elevator_coords = feature["geometry"]["coordinates"]

        for station_id in station_ids:
            if station_id not in stations_lookup:
                continue

            station_coords = stations_lookup[station_id]
            side = "left" if street_elevator_coords[0] < station_coords[0] else "right"

            lines.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [street_elevator_coords, station_coords]
                },
                "properties": {
                    "station_id": station_id,
                    "elevator_no": elevatorno,
                    "station_name": title,
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

print(f"\n**[5] STREET ELEVATOR LINES**:\n✅ Generated {len(lines)} LineString features and saved to {OUTPUT_FILE}")
