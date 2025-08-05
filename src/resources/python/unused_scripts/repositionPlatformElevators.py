# repositions platform elevators under stations

import json
import os

# Load the input elevator dataset
with open("../../custom_dataset.json", "r") as f:
    data = json.load(f)

# Load station coordinates (one directory up)
with open(os.path.join("..", "..", "accessibleStationGeometry.json"), "r") as f:
    stationCoordinates = json.load(f)

# Offset to stack elevators vertically
VERTICAL_OFFSET = 0.000100

# Direction keywords interpreted as "uptown"
UPTOWN_TERMS = [
    "uptown", "bronx-bound", "queens-bound", "northbound"
]

def is_uptown(direction):
    if not direction:
        return False
    direction = direction.strip().lower()
    return any(term in direction for term in UPTOWN_TERMS)

def sort_key(elevator):
    dir_label = elevator["properties"].get("directionLabel", "")
    return 0 if is_uptown(dir_label) else 1

def get_primary_station_id(station_id_raw):
    return str(station_id_raw).split("/")[0].strip()

# Group platform elevators by station
station_elevator_map = {}

for feature in data["features"]:
    props = feature.get("properties", {})
    is_street = props.get("isStreet", "").strip()
    station_id_raw = props.get("stationID", "")

    if not station_id_raw or is_street != "":
        continue  # Skip street elevators or invalid entries

    station_id = get_primary_station_id(station_id_raw)
    station_elevator_map.setdefault(station_id, []).append(feature)

# Reposition elevators
for station_id, elevators in station_elevator_map.items():
    if station_id not in stationCoordinates:
        print(f"⚠️ Skipping {station_id}: no stationCoordinates found.")
        continue

    base_lng = stationCoordinates[station_id][0]
    base_lat = stationCoordinates[station_id][1] - VERTICAL_OFFSET

    sorted_elevators = sorted(elevators, key=sort_key)

    for idx, elevator in enumerate(sorted_elevators):
        new_lat = base_lat - (idx * VERTICAL_OFFSET)
        elevator["geometry"]["coordinates"] = [base_lng, new_lat]

# Save updated dataset
with open("../../custom_dataset_repositioned.json", "w") as f:
    json.dump(data, f, indent=2)

print("✅ Done! Saved as 'custom_dataset_repositioned.json'")
