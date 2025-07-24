import csv
import json

input_csv = "../mta_subway_stations_and_complexes.csv"
output_json = "../mta_subway_complexes.geojson"

features = []

with open(input_csv, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        complex_id = row.get("Complex ID")
        is_complex = row.get("Is Complex", "").strip().lower()
        stop_name = row.get("Stop Name")
        num_stations = row.get("Number Of Stations In Complex")
        station_ids = row.get("Station IDs")
        lat = row.get("Latitude")
        lon = row.get("Longitude")
        ada = row.get("ADA")

        if not complex_id or not lat or not lon:
            continue

        try:
            lat = float(lat)
            lon = float(lon)
            num_stations_int = int(num_stations)
        except (ValueError, TypeError):
            continue

        # Reformat station IDs if multiple stations
        if num_stations_int > 1 and station_ids:
            station_ids = station_ids.replace("; ", "/")

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "complex_id": complex_id,
                "station_ids": station_ids,
                "stop_name": stop_name,
                "ada": ada,
                "num_stations_in_complex": num_stations_int
            }
        }
        features.append(feature)

# Wrap in a GeoJSON FeatureCollection
geojson = {
    "type": "FeatureCollection",
    "features": features
}

# Write to file
with open(output_json, "w") as f:
    json.dump(geojson, f, indent=2)

print(f"\n**[3] CONVERT CSV TO JSON**:\n✅ Converted {len(features)} complex entries to GeoJSON and saved to {output_json}")
