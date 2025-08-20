import json
import os
import requests

API_URL = "https://data.ny.gov/resource/39hk-dx4f.geojson"
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
STATIONS_FILE = os.path.join(THIS_DIR, "..", "..", "mta_subway_stations_all.json")

def fetch_latest_station_data():
    print(f"\n** 🚃 [0] STATIONS DATASET 🚃**\nFetching latest MTA station data...")

    response = requests.get(API_URL)
    response.raise_for_status()
    if os.path.exists(STATIONS_FILE):
        with open(STATIONS_FILE, "r", encoding="utf-8") as f:
            old_data = json.load(f)
            if isinstance(old_data, dict) and "features" in old_data:
                old_data = old_data["features"]
    else:
        old_data = []

    new_data = response.json()
    if isinstance(new_data, dict) and "features" in new_data:
        new_data = new_data["features"]


    # Convert to dict keyed by gtfs_stop_id (only unique data between stations)
    old_id = {item["properties"]["gtfs_stop_id"]: item for item in old_data}
    new_id = {item["properties"]["gtfs_stop_id"]: item for item in new_data}

    # Track differences
    added = [new for old, new in new_id.items() if old not in old_id]
    removed = [old for new, old in old_id.items() if new not in new_id]
    # Compare only properties for modifications
    modified = []
    for sid, new in new_id.items():
        if sid in old_id:
            old_props = old_id[sid]["properties"]
            new_props = new["properties"]

            changes = {}
            for key in new_props:
                old_val = old_props.get(key)
                new_val = new_props.get(key)
                if old_val != new_val:
                    changes[key] = {
                        "OLD": old_val,
                        "→ NEW": new_val
                    }

            if changes:
                modified.append({
                    "gtfs_stop_id": sid,
                    "stop_name": new_props.get("stop_name"),
                    "changes": changes
                })



    # Print diff summary
    if added or removed or modified:
        print(f"Added: {len(added)} | Removed: {len(removed)} | Modified: {len(modified)}")
        if added:
            print("\n--- Added ---")
            for item in added:
                print(item)
        if removed:
            print("\n--- Removed ---")
            for item in removed:
                print(item)
        if modified:
            print("\n--- Modified ---")
            for item in modified:
                print(item)
    else:
        print("No changes detected.")

    feature_collection = {
        "type": "FeatureCollection",
        "features": new_data
    }

    with open(STATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(feature_collection, f, indent=2)


    print(f"✅ Saved latest MTA station data to {STATIONS_FILE}")
    return new_data

fetch_latest_station_data()