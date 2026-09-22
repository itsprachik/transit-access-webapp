import json
import math
import os
import re
import requests

# === CONFIG ===
API_KEY = os.environ["MTA_API_KEY"]
API_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene_equipments.json"

# NY Open Data's new elevator/escalator assets has the geocode, keyed by equipment_code —
NY_OPEN_DATA_URL = "https://data.ny.gov/api/v3/views/94fv-bak7/query.json"
NY_OPEN_DATA_QUERY = (
    "SELECT equipment_code, elevator_or_escalator, georeference "
    "WHERE elevator_or_escalator = 'Elevator' "
    "LIMIT 5000"
)

# Get directory where this script is located
THIS_DIR = os.path.dirname(os.path.abspath(__file__))

# File paths
MTA_EQUIP_FILE = os.path.join(THIS_DIR, "..", "..", "generated", "mta_equipments.json")
MTA_EQUIP_GEO_FILE = os.path.join(THIS_DIR, "..", "..", "generated", "mta_equipments_geo.json")
STATIONS_FILE = os.path.join(THIS_DIR, "..", "..", "mta_subway_stations_all.json")
CUSTOM_ELEVATOR_FILE = os.path.join(THIS_DIR, "..", "..", "custom_elevator_dataset.json")

# === FETCH STEP ===
def fetch_latest_equipment():
    print(f"\n** 🛗 [1] ELEVATOR DATASET 🛗 **\nFetching latest MTA equipment data...")
    headers = {"x-api-key": API_KEY}
    response = requests.get(API_URL, headers=headers)
    response.raise_for_status()
    data = response.json()

    os.makedirs(os.path.dirname(MTA_EQUIP_FILE), exist_ok=True)
    with open(MTA_EQUIP_FILE, "w", encoding="utf-8") as f:
        f.write("// 🚨 This file is auto-generated. Do not edit manually.\n")
        json.dump(data, f, indent=2)
    print(f"Saved latest equipment data to {MTA_EQUIP_FILE}")
    return data

def fetch_elevator_geocoordinates():
    """Fetch real per-elevator coordinates from NY Open Data, keyed by equipment_code."""
    print("Fetching elevator coordinates from NY Open Data...")
    response = requests.get(NY_OPEN_DATA_URL, params={"query": NY_OPEN_DATA_QUERY})
    response.raise_for_status()
    rows = response.json()

    simplified = []
    geo_lookup = {}
    for row in rows:
        code = row.get("equipment_code", "").strip().upper()
        equip_type = row.get("elevator_or_escalator", "")
        coords = row.get("georeference", {}).get("coordinates")
        if not code or not coords or None in coords:
            continue
        simplified.append({
            "equipment_code": code,
            "elevator_or_escalator": equip_type,
            "coords": coords,
        })
        geo_lookup[code] = coords

    os.makedirs(os.path.dirname(MTA_EQUIP_GEO_FILE), exist_ok=True)
    with open(MTA_EQUIP_GEO_FILE, "w", encoding="utf-8") as f:
        f.write("// 🚨 This file is auto-generated. Do not edit manually.\n")
        json.dump(simplified, f, indent=2)

    print(f"Loaded {len(geo_lookup)} elevator coordinates from NY Open Data")
    return geo_lookup

# === LOAD MTA EQUIPMENT ===
mta_equipment_data = fetch_latest_equipment()
elevator_geo_lookup = fetch_elevator_geocoordinates()

# Load stations and existing elevators as before
with open(STATIONS_FILE, "r", encoding="utf-8") as f:
    mta_stations_data = json.load(f)

with open(CUSTOM_ELEVATOR_FILE, "r", encoding="utf-8") as f:
    elevator_data = json.load(f)


def infer_direction_label_from_desc(desc):
    """
    Infer direction label by finding words that end with 'bound',
    """
    if not desc:
        return ""
    
    match = re.search(r'\b([A-Za-z]+-?[Bb]ound)\b', desc)
    if match:
        return match.group(1)
    
    return ""

def load_complex_lookup(json_path):
    lookup = {}
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # If the JSON is a FeatureCollection (GeoJSON-style)
        for feature in data.get("features", []):
            props = feature.get("properties", {})
            complex_id = str(props.get("complex_id"))
            coords = feature.get("geometry", {}).get("coordinates")
            if complex_id and coords:
                lookup[complex_id] = (coords[0], coords[1])

    return lookup


# Track placement counts so we know how to offset each new one
complex_placement_counter = {}

# The MTA occasionally mis-geocodes an elevator. Sanity check within 500m.
# The largest distance between street elevator & complex, to date, in EL773 (Borough Hall)
GEO_SANITY_THRESHOLD_M = 500

def haversine_m(coord1, coord2):
    """Great-circle distance between two [lon, lat] points, in meters."""
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

def get_coordinates_for_elevator(equip, station_lookup, complex_lookup, is_street, geo_lookup):
    """Return coordinates for elevator: real NY Open Data coordinates when available
    and plausible, otherwise station/complex placement with offset rules."""
    # Determine base coordinates (station → complex → None)
    station_ids = str(equip.get("elevatormrn", "")).split("/")
    coords = None

    if len(station_ids) >= 1:
        sid = str(int(station_ids[0].strip()))
        if sid in station_lookup:
            coords = station_lookup[sid]["coordinates"]

    elev_no = str(equip.get("equipmentno", "")).strip().upper()
    if elev_no in geo_lookup:
        ny_coords = list(geo_lookup[elev_no])
        if not coords or None in coords or haversine_m(ny_coords, coords) <= GEO_SANITY_THRESHOLD_M:
            return ny_coords
        print(
            f"⚠️  Ignoring implausible NY Open Data coordinate for {elev_no} "
            f"({equip.get('station', '')}): {haversine_m(ny_coords, coords):.0f}m "
            f"from its station — falling back to inferred placement"
        )

    if not coords or None in coords:
        complex_id = str(equip.get("stationcomplexid", ""))
        coords = list(complex_lookup.get(complex_id, (None, None)))

    # If still no coordinates, return placeholder
    if not coords or None in coords:
        return [None, None]

    lon, lat = coords
    complex_id = str(equip.get("stationcomplexid", ""))

    # Track placement separately for street vs non-street
    counter_key = (complex_id, is_street)
    placement_count = complex_placement_counter.get(counter_key, 0)
    offset_step = 0.0001  # ~11 meters

    if is_street:
        # Alternate left/right from base coord
        if placement_count % 2 == 0:
            lon -= (placement_count // 2 + 1) * offset_step
        else:
            lon += (placement_count // 2 + 1) * offset_step
    else:
        # Stack downward for non-street
        lat -= (placement_count + 1) * offset_step

    complex_placement_counter[counter_key] = placement_count + 1
    return [lon, lat]


# Create quick lookup for stations
station_lookup = {
    str(int(station["properties"]["station_id"])): {  # normalize to no leading zeros
        "ada": station["properties"].get("ada", ""),
        "coordinates": station.get("geometry", {}).get("coordinates")
    }
    for station in mta_stations_data["features"]
}


# Create set of existing elevator numbers to avoid duplicates
existing_elevators = {feature["properties"]["elevatorno"] for feature in elevator_data["features"]}

new_features = []

# Load complex coordinates from CSV
COMPLEX_FILE = os.path.join(THIS_DIR, "..", "..", "mta_subway_complexes.json")
complex_lookup = load_complex_lookup(COMPLEX_FILE)

# Iterate through MTA equipment list
for equip in mta_equipment_data:
    if equip.get("equipmenttype") != "EL":
        continue

    elev_no = equip.get("equipmentno")
    if elev_no in existing_elevators:
        continue

    # ADA filter
    if equip.get("ADA", "").upper() != "Y":
        continue

    # Infer street flag before getting coords
    short_desc = equip.get("shortdescription", "")
    is_street = "street" in short_desc.lower()

    # Coordinates
    coords = get_coordinates_for_elevator(equip, station_lookup, complex_lookup, is_street, elevator_geo_lookup)

    # Station ID for output
    station_id = str(int(str(equip.get("elevatormrn", "")).split("/")[0].strip()))


    # Title and image
    title = equip.get("station", "").replace("/", "-").replace(" ", "-")
    image_url = f"https://wheresthedamnelevator.com/assets/images/newyork/mta/{title}_{elev_no}.jpg"

    # Infer direction label (MIGHT REQUIRE MANUAL EDITING)
    direction_label = (
        infer_direction_label_from_desc(equip.get("serving")) or
        infer_direction_label_from_desc(short_desc)
    )



    # Build description_custom
    if is_street:
        description_custom = "This elevator gets you from the street to the main station mezzanine"
    else:
        if direction_label:
            description_custom = f"This elevator gets you from the main station mezzanine to {direction_label} {equip.get('linesservedbyelevator', '')} trains"
        else:
            description_custom = f"This elevator gets you from the main station mezzanine to {equip.get('linesservedbyelevator', '')} trains"

    # Create feature
    feature = {
        "type": "Feature",
        "properties": {
            "isRedundant": str(equip.get("redundant", "")),
            "elevatorgtfsstopid": equip.get("elevatorsgtfsstopid", ""),
            "route": equip.get("trainno", ""),
            "complexID": equip.get("stationcomplexid", ""),
            "stationID": station_id,
            "system": "nyc_mta",
            "elevatorno": elev_no,
            "linesServed": equip.get("linesservedbyelevator", ""),
            "directionLabel": direction_label,
            "title": equip.get("station", ""),
            "image": image_url,
            "alternativeRoute": equip.get("alternativeroute", ""),
            "ada": station_lookup.get(station_id, {}).get("ada", ""),
            "isBroken": "",
            "isStreet": "true" if is_street else "",
            "shortdescription": short_desc,
            "description_custom": description_custom
        },
        "geometry": {
            "type": "Point",
            "coordinates": coords
        },
        "id": os.urandom(16).hex()
    }

    new_features.append(feature)


# Append new features
elevator_data["features"].extend(new_features)

# Save updated file
with open(CUSTOM_ELEVATOR_FILE, "w", encoding="utf-8") as f:
    json.dump(elevator_data, f, indent=2)

if new_features:
    print(f"✅ Added {len(new_features)} new elevators to custom_elevator_dataset:")
    for feat in new_features:
        print(f"  {feat['properties']['elevatorno']} - {feat['properties']['title']}")
else:
    print(f"\n✅ Transit Access has all accessible elevators in MTA. No new elevators were added.")

# Write diff report section
report_path = os.path.join(THIS_DIR, "..", "..", "generated", "diff_report.json")
report = {}
if os.path.exists(report_path):
    with open(report_path) as f:
        report = json.load(f)
report["elevators"] = {
    "added": [
        f"{feat['properties']['elevatorno']} - {feat['properties']['title']}"
        for feat in new_features
    ]
}
os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, "w") as f:
    json.dump(report, f, indent=2)
