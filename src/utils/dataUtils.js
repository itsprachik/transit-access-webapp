/* 
dataUtils is used to filter existing arrays and elevator data
*/

import mapboxgl from "mapbox-gl";
import area from "@turf/area";
import { elevatorCoordinates } from "./elevatorOutageGeometry";

import { stationCoordinates } from "./accessibleStationGeometry";
import { stationGeometry } from "./stationGeometry";
import { complexCoordinates } from "./ComplexGeometry";
import { getComplexBoundaryGeoJSON } from "@/components/MtaMap/layers/StationComplexes/complexBoundaries";
import { parse, isToday, isTomorrow, isThisWeek, format, formatDistanceToNow } from "date-fns";

import customDataset from "@/resources/custom_elevator_dataset.json";
import complexesDataset from "@/resources/generated/mta_subway_complexes.json";
import stationsDataset from "@/resources/mta_subway_stations_all.json";
import { setManhattanTilt } from "@/components/MtaMap/mtaMapOptions";
import { ROUTE_ORDER } from "./constants";

// make a map of elevator # tied to stationID and complexID
import {
  buildElevatorIndex,
  stationIDToComplexID,
} from "@/utils/elevatorIndexUtils";
let elevatorIndex = [];

// Function to highlight all upcoming outages
export function getUpcomingOutages(outageArray) {
  const upcomingOutages = [];
  outageArray?.forEach((equip) => {
    if (equip.equipmenttype === "EL" && equip.isupcomingoutage === "Y") {
      const cleanElevatorNo = equip.equipment.trim(); // Trim spaces from elevator number

      let obj = {
        type: "Feature",
        id: cleanElevatorNo,
        properties: {
          station: equip.station,
          outagedate: equip.outagedate,
          returntoservice: equip.estimatedreturntoservice,
          elevatorno: cleanElevatorNo,
          isBroken: true,
        },
        geometry: elevatorCoordinates[cleanElevatorNo]
          ? {
              coordinates: elevatorCoordinates[cleanElevatorNo],
              type: "Point",
            }
          : null,
      };
      upcomingOutages.push(obj);
    }
  });
  return upcomingOutages;
}

export function getOutageLayerFeatures(outElevatorData) {
  const features = [];

  // Use customDataset.features array
  const elevatorsArray = Array.isArray(customDataset.features)
    ? customDataset.features
    : [];

  for (const [elevatorNo, geometry] of Object.entries(elevatorCoordinates)) {
    const cleanElevatorNo = elevatorNo.trim();

    // Find match in outage data
    const match = outElevatorData.find((e) => e.elevatorNo === cleanElevatorNo);

    // Find corresponding elevator in customDataset.features, accessing properties
    const elevatorFeature = elevatorsArray.find(
      (f) => f.properties?.elevatorno?.trim() === cleanElevatorNo
    );

    // Determine isStreet value
    const isStreet =
      elevatorFeature && elevatorFeature.properties?.isStreet
        ? elevatorFeature.properties.isStreet === "true" ||
          elevatorFeature.properties.isStreet === true
        : false;

    const obj = {
      type: "Feature",
      id: cleanElevatorNo,
      properties: {
        elevatorno: cleanElevatorNo,
        isBroken: Boolean(match),
        estimatedreturntoservice: match?.estimatedReturn || null,
        isStreet: isStreet,
      },
      geometry: geometry
        ? {
            coordinates: geometry,
            type: "Point",
          }
        : null,
    };

    features.push(obj);
  }
  return features;
}

// The following functions make it easy to find an elevator attached to a given station
/* ************************************************************************** */
export function makeElevatorMap() {
  elevatorIndex = buildElevatorIndex(customDataset.features);
  return elevatorIndex;
}

export function getElevatorByNo(elevatorNo) {
  return elevatorIndex.elevatorByNo.get(elevatorNo);
}

export function getElevatorsByComplexId(complexId) {
  return elevatorIndex.elevatorByComplexId.get(complexId) || [];
}

export function getElevatorsByStationId(stationId) {
  return elevatorIndex.elevatorByStationId.get(stationId) || [];
}

export function getComplexIDByElevatorNo(elevatorNo) {
  const elevator = elevatorIndex.elevatorByNo.get(elevatorNo);
  return elevator?.properties?.complexID;
}

/* ************************************************************************** */

export function convertDate(outageDate) {
  const parsedDate = parse(outageDate, "MM/dd/yyyy hh:mm:ss a", new Date());

  if (isToday(parsedDate)) {
    return `in ${formatDistanceToNow(parsedDate)} (${format(parsedDate, "h:mmaaa")})`;
  }

  if (isTomorrow(parsedDate)) {
    return `Tomorrow at ${format(parsedDate, "h:mmaaa")}`;
  }

  if (isThisWeek(parsedDate)) {
    return `This ${format(parsedDate, "EEEE 'at' h:mmaaa")}`;
  }

  // fallback: generic relative time
  return `in ${formatDistanceToNow(parsedDate)}`;
}


// when going between stations and complexes, the complex has to inherit a concatenated version of routes and ADA
export function concatenateRoutes(stationIDs, stationsDataset) {
  const routes = new Set();

  for (const stationID of stationIDs) {
    for (const station of stationsDataset.features) {
      const props = station.properties;
      if (props?.station_id === stationID && props?.ada !== "0") {
        const routeStr = props.daytime_routes || "";
        routeStr.split(" ").forEach((r) => {
          const route = r.trim();
          if (route) routes.add(route);
        });
      }
    }
  }

  return Array.from(routes)
  .sort((a, b) => ROUTE_ORDER.indexOf(a) - ROUTE_ORDER.indexOf(b))
  .join(" ");
}

export function concatenateInaccessibleRoutes(stationIDs, stationsDataset) {
  const routes = new Set();

  for (const stationID of stationIDs) {
    for (const station of stationsDataset.features) {
      const props = station.properties;
      if (props?.station_id === stationID && props?.ada == "0") {
        const routeStr = props.daytime_routes || "";
        routeStr.split(" ").forEach((r) => {
          const route = r.trim();
          if (route) routes.add(route);
        });
      }
    }
  }

  return Array.from(routes).sort().join(" ");
}

// when going between stations and complexes, the complex has to inherit a concatenated version of routes and ADA
export function concatenateADA(stationIDs, stationsDataset) {
  const adaSet = new Set();

  for (const stationID of stationIDs) {
    const stationMatches = stationsDataset.features.filter(
      (s) => s.properties?.station_id === stationID
    );

    for (const station of stationMatches) {
      const adaValue = String(station.properties?.ada ?? "0");
      adaSet.add(adaValue);
    }
  }

  if (adaSet.size === 1) {
    return Array.from(adaSet)[0]; // all same value
  }

  return "2"; // mixed accessibility = partially accessible
}

export function getComplexOutageLayerFeatures(outStationArray) {
  const features = [];
  const stationOutageMap = new Map();

  // Map all station outages for quick lookup
  for (const station of outStationArray) {
    stationOutageMap.set(station.stationID, {
      isOut: station.isOut || false,
      isProblem: station.isProblem || false,
    });
  }

  for (const complex of complexesDataset.features) {
    const complexID = complex.properties?.complex_id;
    const stop_name = complex.properties?.stop_name || "Unknown";
    const stationIDsRaw = complex.properties?.station_ids || "";
    const stationIDs = stationIDsRaw.split("/").map((id) => id.trim());

    // Get only ADA stations in this complex. complexes dataset lists all stations in complex
    const adaStationIDs = stationIDs.filter((id) => {
      const station = stationsDataset.features.find(
        (s) => s.properties.station_id === id
      );

      return station && String(station.properties.ada) !== "0";
    });

    const totalAdaStations = adaStationIDs.length;

    const geometry = complexCoordinates[complexID];
    if (!geometry) {
      console.warn(`Missing complex geometry for complexID ${complexID}`);
      continue;
    }

    const ada = concatenateADA(stationIDs, stationsDataset);
    const route = concatenateRoutes(stationIDs, stationsDataset);

    // Count outage status only for ADA stations
    let outCount = 0;
    let hasProblemStation = false;

    for (const stationID of adaStationIDs) {
      const outage = stationOutageMap.get(stationID) || {
        isOut: false,
        isProblem: false,
      };

      if (outage.isOut) outCount++;
      if (outage.isProblem) hasProblemStation = true;
    }

    const isOut = outCount === totalAdaStations && totalAdaStations > 0;
    const isProblem = isOut || hasProblemStation || outCount > 0; // Partial ADA outage/problem

    features.push({
      type: "Feature",
      id: complexID,
      properties: {
        ada,
        route,
        stop_name,
        station_ids: stationIDsRaw,
        isProblem,
        isOut,
        complex_id: complexID,
      },
      geometry: {
        type: "Point",
        coordinates: geometry,
      },
    });
  }

  return features;
}

export function getStationOutageLayerFeatures(outStationArray) {
  const features = [];

  const stationIdToPropertiesMap = new Map();

  for (const feature of stationsDataset.features) {
    const stationIDs = String(feature.properties.station_id || "")
      .split("/")
      .map((s) => s.trim());

    for (const id of stationIDs) {
      stationIdToPropertiesMap.set(id, {
        complexID: feature.properties.complex_id,
        ada: feature.properties.ada,
      });
    }
  }

  for (const stationNo of Object.keys(stationCoordinates)) {
    const cleanStationNo = stationNo.trim();
    const baseGeometry = stationCoordinates[stationNo];

    // include complexID so later flyIn can easily reference stations and complexes
    // include ada because outage layer does not have it
    const props = stationIdToPropertiesMap.get(cleanStationNo);
    const complexID = props?.complexID;
    const ada = props?.ada;

    const geometry = baseGeometry;

    // Check to match OOS station numbers with their coordinates
    const outageData = outStationArray.find(
      (station) => station.stationID?.trim?.() === cleanStationNo
    );

    const isProblem = outageData?.isProblem || false;
    const isOut = outageData?.isOut || false;

    features.push({
      type: "Feature",
      id: cleanStationNo,
      properties: {
        ada,
        station_id: cleanStationNo,
        isProblem,
        isOut,
        complex_id: complexID || null,
      },
      geometry: {
        type: "Point",
        coordinates: geometry,
      },
    });
  }
  return features;
}

export const getStationsWithOutages = (elevatorOutages) => {
  if (!elevatorOutages || elevatorOutages.length === 0) {
    console.warn("No elevator outages available.");
    return {};
  }

  const elevatorFeatures = Array.isArray(customDataset.features)
    ? customDataset.features
    : [];

  if (!elevatorFeatures || elevatorFeatures.length === 0) {
    console.warn("customDataset is empty or invalid.");
    return {};
  }

  const stationsWithOutages = {};
  const complexMap = {};

  // Build a map keeping track of stationIDs and their complexes (in a complex, each line gets a station separated by a slash)
  elevatorFeatures.forEach((feature) => {
    const complexID = feature.properties?.complexID;
    const stationIDs = String(feature.properties?.stationID || "").split("/");

    if (complexID) {
      // add complex if it's not there yet
      if (!complexMap[complexID]) complexMap[complexID] = new Set();
      stationIDs.forEach((id) => complexMap[complexID].add(id.trim()));
    }
  });

  // Track outages. Ignore escalators and upcoming outages
  elevatorOutages.forEach((elevator) => {
    if (elevator.equipmenttype !== "EL" || elevator.isupcomingoutage !== "N")
      return;

    // find the elevator in the custom dataset
    const affectedFeature = elevatorFeatures.find(
      (f) => f.properties?.elevatorno?.trim() === elevator.equipment?.trim()
    );

    if (!affectedFeature) return;

    const complexID = affectedFeature.properties?.complexID;
    const stationIDs =
      String(affectedFeature.properties?.stationID)?.split("/") || [];
    const isStreetElevator = affectedFeature.properties?.isStreet;

    let affectedStations = [];

    // if a street elevator is OOS, it impacts the whole complex, so each station needs to know there isProblem
    if (isStreetElevator && complexID && complexMap[complexID]) {
      affectedStations = Array.from(complexMap[complexID]);
    } else {
      affectedStations = stationIDs.map((s) => s.trim());
    }

    affectedStations.forEach((stationID) => {
      if (!stationsWithOutages[stationID]) {
        stationsWithOutages[stationID] = {
          isProblem: true,
          isOut: false,
          count: 0,
        };
      }
      stationsWithOutages[stationID].count += 1;
    });
  });

  // Now determine if entire station is out
  Object.entries(stationsWithOutages).forEach(([stationID, status]) => {
    const totalElevators = elevatorFeatures.filter((f) =>
      String(f.properties?.stationID || "")
        .split("/")
        .map((s) => s.trim())
        .includes(stationID)
    ).length;

    stationsWithOutages[stationID].isOut = status.count >= totalElevators;
    delete stationsWithOutages[stationID].count;
  });

  return stationsWithOutages;
};

export const getStationOutageArray = (elevatorOutages) => {
  const stationsMap = getStationsWithOutages(elevatorOutages);

  return Object.entries(stationsMap)
    .filter(([_, data]) => data.isProblem)
    .map(([stationID, data]) => {
      const trimmedID = stationID.trim?.();

      // Find corresponding ADA info in the custom dataset
      const adaStatus = customDataset.features.find((f) =>
        String(f.properties?.stationID || "")
          .split("/")
          .map((s) => s.trim())
          .includes(trimmedID)
      )?.properties?.ada;

      return {
        stationID: trimmedID,
        ada: adaStatus ?? null, // fallback to null if not found
        ...data,
      };
    });
};

export function adjustCenter3D(map, [lng, lat], offsetPixels) {
  if (!map || typeof map.project !== "function") return [lng, lat];

  const projected = map.project([lng, lat]);

  const pitch = map.getPitch();
  // offsetPixels = 250 + pitch * 2; // e.g. at 60° → 370px

  const adjustedPoint = new mapboxgl.Point(
    projected.x,
    projected.y - offsetPixels
  );
  const unprojected = map.unproject(adjustedPoint);

  // prevent invalid coordinates (this was a problem with pitch !==0)
  if (
    !unprojected ||
    isNaN(unprojected.lng) ||
    isNaN(unprojected.lat) ||
    Math.abs(unprojected.lat) > 90 ||
    Math.abs(unprojected.lng) > 180
  ) {
    console.warn("adjustCenter3D returned invalid coordinates", unprojected);
    return [lng, lat]; // Fallback to original
  }

  return [unprojected.lng, unprojected.lat];
}

export function adjustCenter(map, [lng, lat], popupHeightPx = 300) {
  const point = map.project([lng, lat]);
  point.y -= popupHeightPx;
  return map.unproject(point);
}

export function getAverageElevatorCoordinates(datasetArray, complexID) {
  const bounds = new mapboxgl.LngLatBounds();

  let totalLng = 0;
  let totalLat = 0;
  let validCount = 0;

  datasetArray.forEach((item) => {
    const isStreet = item.properties?.isStreet;
    const itemComplexID = item.properties?.complexID;

    if (isStreet && itemComplexID === complexID) {
      const coords = item.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        const [lng, lat] = coords;
        totalLng += lng;
        totalLat += lat;
        bounds.extend([lng, lat]);
        validCount++;
      }
    }
  });

  const complexCoord = complexCoordinates[complexID];
  if (Array.isArray(complexCoord) && complexCoord.length === 2) {
    bounds.extend(complexCoord);
  }

  if (validCount === 0 && !complexCoord) {
    console.warn(
      "No valid street elevators or complex coordinate for:",
      complexID
    );
    return null;
  }

  const average =
    validCount > 0
      ? [totalLng / validCount, totalLat / validCount]
      : complexCoord;

  return { average, bounds };
}

export function getAreaOfComplex(complexID, map, showBoundary) {
  const zoomLevel = map.getZoom();
  const boundaryData = getComplexBoundaryGeoJSON(zoomLevel);
  const feature = boundaryData.features.find(
    (f) => f.properties.complexID === complexID
  );

  if (showBoundary) {
    if (feature) {
      showActiveComplexBoundary(feature, map)
    } else {
      console.warn("No boundary found for complexID", complexID);
    }
    
  }
  if (feature) {
    return area(feature); // returns area in square meters
  }

  return null;
}

export function showActiveComplexBoundary(feature, map) {
    map.getSource("active-complex-boundary").setData({
      type: "FeatureCollection",
      features: [feature],
    });

  // visual properties
  map.setLayoutProperty(
    "active-complex-boundary-layer",
    "visibility",
    "visible"
  );
  // Reset opacity to full
  map.setPaintProperty("active-complex-boundary-layer", "fill-opacity", 0.4);

  // Gradually fade out over ~3 seconds
  const fadeDuration = 3000;
  const steps = 30;
  let step = 0;

  const interval = setInterval(() => {
    step++;
    const opacity = 0.3 * (1 - step / steps);
    map.setPaintProperty(
      "active-complex-boundary-layer",
      "fill-opacity",
      opacity
    );

    if (step >= steps) {
      clearInterval(interval);
      // Optional: hide the layer after fade
      map.setLayoutProperty(
        "active-complex-boundary-layer",
        "visibility",
        "none"
      );
    }
  }, fadeDuration / steps);
}

function extendBoundsForPopup(bounds, popupDirection = "down") {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const latSpan = ne.lat - sw.lat;
  const lngSpan = ne.lng - sw.lng;

  let newSW = sw;
  let newNE = ne;

  const POPUP_OFFSET_PERCENT = 0.3;

  if (popupDirection === "down") {
    newSW = new mapboxgl.LngLat(
      sw.lng,
      sw.lat - latSpan * POPUP_OFFSET_PERCENT
    );
  } else if (popupDirection === "up") {
    newNE = new mapboxgl.LngLat(
      ne.lng,
      ne.lat + latSpan * POPUP_OFFSET_PERCENT
    );
  }

  // Stretch bounds if vertical spread is too small (e.g. for tiny lat span)
  const MIN_LAT_SPAN = 0.0004;
  if (latSpan < MIN_LAT_SPAN) {
    const padding = (MIN_LAT_SPAN - latSpan) / 2;
    newSW = new mapboxgl.LngLat(newSW.lng, newSW.lat - padding);
    newNE = new mapboxgl.LngLat(newNE.lng, newNE.lat + padding);
  }

  return new mapboxgl.LngLatBounds(newSW, newNE);
}

export function flyIn(
  map,
  complex_id,
  coordsOrBounds,
  isAccessible,
  isPopup = false,
  stationView,
  setStationView
) {
  
  const zoomBoundsDuration = 900; // speed that we fly into an accessible station
  const MID_AREA = 4000; // in meters, area at which we need to zoom in a little to comfortably see station
  const MIN_AREA = 2000; // in meters, area at which we need to zoom in even more to comfortably see station
  const MAX_LAT_SPAN = 0.002; // to accommodate the Times Square/Port Authority sprawl for small screens
  let maxZoomLevel = 17;

  if (!coordsOrBounds) {
    console.warn("flyIn: No coordinates or bounds provided.");
    return;
  }

  if (isAccessible === false) {
    // Inaccessible → simple flyTo
    if (!Array.isArray(coordsOrBounds)) {
      console.warn("flyIn: Invalid coordinate array for inaccessible station");
      return;
    }

    map.flyTo({
      center: coordsOrBounds,
      zoom: maxZoomLevel - 1,
      pitch: 0,
      bearing: setManhattanTilt(),
      speed: 1.8,
    });
    return;
  }

  if (coordsOrBounds instanceof mapboxgl.LngLatBounds) {
    const currentLatSpan =
      coordsOrBounds.getNorthEast().lat - coordsOrBounds.getSouthWest().lat;

    let adjustedBounds = coordsOrBounds;

    if (isPopup && currentLatSpan <= MAX_LAT_SPAN) {
      // extend for popup visibility and vertical spread
      adjustedBounds = extendBoundsForPopup(coordsOrBounds, "down");
    }
    const dynamicPadding =
      currentLatSpan > 0.0008
        ? { top: 100, bottom: 200, left: 0, right: 0 }
        : { top: 80, bottom: 220, left: 30, right: 30 };

    const area = getAreaOfComplex(complex_id, map, false);

    // fit bounds almost does the job, but we still need to adjust the zoom a little higher for small stations
    if (area > MIN_AREA && area < MID_AREA) { 
      maxZoomLevel += 1; 
    }

    if (area < MIN_AREA) { 
      maxZoomLevel += 2; 
    }

    map.fitBounds(adjustedBounds, {
      padding: dynamicPadding,
      offset: [0, -map.getCanvas().height * 0.01],
      maxZoom: maxZoomLevel,
      pitch: 0,
      bearing: setManhattanTilt(),
      duration: zoomBoundsDuration,
    });

    return;
  }

  console.warn("flyIn: Invalid bounds format for accessible station");
}

/* A thoroughly annoying function to need, which solves accidentally clicking on 
hidden mapbox text instead of the icon you actually clicked on */
export function dealWithMapboxIconOverlap(e) {
  if (!e.features || e.features.length === 0) return e;

  // Filter out invisible or empty-name features
  const filteredFeatures = e.features.filter((f) => {
    const text = f.properties?.name || "";
    const opacity = f.layer?.layout?.["text-opacity"];
    return text.trim() !== "" && (opacity === undefined || opacity > 0);
  });

  // dev warning, just in case it's helpful
  if (filteredFeatures.length > 1) {
    console.warn("Multiple overlapping features detected. Picking closest.");
  }

  if (filteredFeatures.length === 0) return e;

  // Find the closest actual geometry to the click point
  const clickedFeature = filteredFeatures.reduce((closest, current) => {
    const distance = Math.hypot(
      current.geometry.coordinates[0] - e.lngLat.lng,
      current.geometry.coordinates[1] - e.lngLat.lat
    );
    if (!closest) return { feature: current, distance };
    return distance < closest.distance
      ? { feature: current, distance }
      : closest;
  }, null)?.feature;

  if (!clickedFeature) return e;

  // Return a new event-like object with only the closest feature
  return {
    ...e,
    features: [clickedFeature],
  };
}

/**
 * Flies to a subway complex, optionally orienting toward an elevator.

 */

export function lookAtElevator(
  map,
  elevatorNo,
  elevatorCoords,
  prevElevatorNo,
  setElevatorView
) {
  if (!map || typeof map.flyTo !== "function") return;

  setElevatorView(elevatorNo);

  const MAX_DISTANCE = 0.0007; // max distance an elevator can be from a complex before changing zoom/pitch
  const complexID = getComplexIDByElevatorNo(elevatorNo);
  const complexCoords = complexCoordinates[complexID];
  let baseZoom = 19;
  let pitch = 60;
  let bearing = 0;

  if (elevatorCoords) {
    const deltaLng = elevatorCoords[0] - complexCoords[0];
    const deltaLat = elevatorCoords[1] - complexCoords[1];

    if (Math.abs(deltaLng) > MAX_DISTANCE || Math.abs(deltaLat) > MAX_DISTANCE) {
      baseZoom = 17.1;
      pitch = 65;
    }

    // Calculate new target bearing
    bearing = (Math.atan2(deltaLng, deltaLat) * 180) / Math.PI;
  }

  const adjustedCenter = adjustCenter3D(
    map,
    [complexCoords[0], complexCoords[1]],
    0
  );

  // Compare current bearing to target bearing
  const currentBearing = map.getBearing();
  const bearingDiff = Math.abs(((bearing - currentBearing + 180) % 360) - 180); // Normalize to [0, 180]

  const useFly = bearingDiff > 10; // Use fly if turning more than 10 degrees

  const method = useFly ? map.flyTo : map.easeTo;

  method.call(map, {
    center: adjustedCenter,
    zoom: baseZoom,
    bearing,
    pitch,
    speed: 1.2,
    curve: 1.5,
    essential: true,
  });
}