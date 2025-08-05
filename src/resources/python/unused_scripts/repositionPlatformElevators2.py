# repositions platform elevators under complexes

import json
import os

# Load the input elevator dataset
with open("../../custom_dataset.json", "r") as f:
    data = json.load(f)

# Load complex coordinates GeoJSON
with open("../../mta_subway_complexes.geojson", "r") as f:
    complex_geojson = json.load(f)

# Convert to lookup dictionary
complex_lookup = {
    feature["properties"]["complex_id"]: feature
    for feature in complex_geojson["features"]
}

# Offset to stack elevators vertically
VERTICAL_OFFSET = 0.000100

UPTOWN_TERMS = ["uptown", "bronx-bound", "queens-bound", "northbound"]

def is_uptown(direction):
    if not direction:
        return False
    direction = direction.strip().lower()
    return any(term in direction for term in UPTOWN_TERMS)

def sort_key(elevator):
    dir_label = elevator["properties"].get("directionLabel", "")
    return 0 if is_uptown(dir_label) else 1

def get_primary_complex_id(complex_id_raw):
    return str(complex_id_raw).split("/")[0].strip()

# Group platform elevators by complex
complex_elevator_map = {}

for feature in data["features"]:
    props = feature.get("properties", {})
    is_street = props.get("isStreet", "").strip()
    complex_id_raw = props.get("complexID", "")

    if not complex_id_raw or is_street != "":
        continue  # skip if street elevator or missing

    complex_id = get_primary_complex_id(complex_id_raw)
    complex_elevator_map.setdefault(complex_id, []).append(feature)

# Reposition elevators
for complex_id, elevators in complex_elevator_map.items():
    if complex_id not in complex_lookup:
        print(f"⚠️ Skipping {complex_id}: no complexCoordinates found.")
        continue

    coords = complex_lookup[complex_id]["geometry"]["coordinates"]
    base_lng = coords[0]
    base_lat = coords[1] - 2 * VERTICAL_OFFSET

    sorted_elevators = sorted(elevators, key=sort_key)

    for idx, elevator in enumerate(sorted_elevators):
        new_lat = base_lat - (idx * VERTICAL_OFFSET)
        elevator["geometry"]["coordinates"] = [base_lng, new_lat]

# Save updated dataset
with open("../../custom_dataset_repositioned.json", "w") as f:
    json.dump(data, f, indent=2)

print("✅ Done! Saved as 'custom_dataset_repositioned.json'")
