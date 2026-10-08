import json
import os

# === CONFIG ===
# This script exists because the MTA's data feed is slow to sync once a new station
# becomes accessible. Specifically, assets and elevators are updated before stations
# & complexes.

# While it's updating, we need to show a "please be patient" station_alert on the
# affected complex.
#
# A complex gets the station_alert if one of its elevators is ADA (the
# equipment feed's own determination that this elevator makes the station
# accessible). Some stations have elevators that intentionally don't make the station
# ADA-accessible (e.g. 42 St-Bryant Park), and those must never get this alert.

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
STATIONS_FILE = os.path.join(THIS_DIR, "..", "..", "mta_subway_stations_all.json")
COMPLEXES_FILE = os.path.join(THIS_DIR, "..", "..", "mta_subway_complexes.json")
ELEVATOR_FILE = os.path.join(THIS_DIR, "..", "..", "custom_elevator_dataset.json")
ALERTS_FILE = os.path.join(THIS_DIR, "..", "..", "station_alerts.json")

ALERT_TEXT = (
    "This station was just made accessible. Station ADA flags may come after "
    "elevators are put into the system. Please be patient while data updates."
)


def main():
    print("\n** ♿️ [1a] ACCESSIBILITY DATA SYNC PATCH ♿️ **\nChecking for out-of-date station ADA flags...")

    with open(STATIONS_FILE, "r", encoding="utf-8") as f:
        stations_data = json.load(f)
    with open(COMPLEXES_FILE, "r", encoding="utf-8") as f:
        complexes_data = json.load(f)
    with open(ELEVATOR_FILE, "r", encoding="utf-8") as f:
        elevator_data = json.load(f)
    with open(ALERTS_FILE, "r", encoding="utf-8") as f:
        alerts_data = json.load(f)

    station_ada = {
        s["properties"]["station_id"]: str(s["properties"].get("ada", "0"))
        for s in stations_data["features"]
    }
    complex_names = {
        c["properties"]["complex_id"]: c["properties"].get("stop_name", "")
        for c in complexes_data["features"]
    }

    # "1" (full) > "2" (partial, e.g. one direction only) > "0" (none) — a
    # data sync issue is flagged when the elevator implies MORE accessibility than the
    # station's own ada currently reflects
    ADA_RANK = {"0": 0, "2": 1, "1": 2}

    # Complexes with an elevator whose own ada ("1" or "2") outranks the ada of
    # the station it actually serves.
    mismatched_complexes = set()
    for feat in elevator_data["features"]:
        props = feat["properties"]
        elevator_ada = str(props.get("ada", ""))
        if elevator_ada not in ADA_RANK or ADA_RANK[elevator_ada] == 0:
            continue
        complex_id = str(props.get("complexID", "")).strip()
        if not complex_id:
            continue
        station_ids = [s.strip() for s in str(props.get("stationID", "")).split("/") if s.strip()]
        if any(
            ADA_RANK[elevator_ada] > ADA_RANK.get(station_ada.get(sid, "0"), 0)
            for sid in station_ids
        ):
            mismatched_complexes.add(complex_id)

    existing_features = alerts_data.get("features", [])

    # Drop alerts whose data sync issue has resolved.
    kept_features = []
    removed = []
    for feat in existing_features:
        props = feat.get("properties", {})
        if props.get("auto") and props.get("complex_id") not in mismatched_complexes:
            removed.append(props.get("complex_id"))
            continue
        kept_features.append(feat)

    # Add alerts for newly-mismatched complexes that don't already have one
    already_alerted = {feat["properties"].get("complex_id") for feat in kept_features}
    added = []
    for complex_id in sorted(mismatched_complexes):
        if complex_id in already_alerted:
            continue
        kept_features.append({
            "type": "Feature",
            "properties": {
                "complex_id": complex_id,
                "stop_name": complex_names.get(complex_id, ""),
                "alert": ALERT_TEXT,
                "auto": True,
            },
        })
        added.append(complex_id)

    alerts_data["features"] = kept_features

    with open(ALERTS_FILE, "w", encoding="utf-8") as f:
        json.dump(alerts_data, f, indent=2)

    if added:
        print(f"Added data sync alert for {len(added)} complex(es): {', '.join(added)}")
    if removed:
        print(f"Removed data sync alert for {len(removed)} complex(es): {', '.join(removed)}")
    if not added and not removed:
        print("No accessibility data sync alert changes needed.")


if __name__ == "__main__":
    main()
