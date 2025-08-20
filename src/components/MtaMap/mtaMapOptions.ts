import mapStyle from "@/styles/mapbox-style.json"; 
import { LngLatBounds, StyleSpecification } from "mapbox-gl";

export function setManhattanTilt() { 
  const manhattanTilt = 29;
  return manhattanTilt;
}

export function setMapCenter(): [number, number] {
  return [-73.98265318925187, 40.7583063693059];
}

export function setMaxBounds() : mapboxgl.LngLatBounds {
  return new LngLatBounds (
    [-74.27817742272136, 40.33201072974728], // Southwest coordinates
    [-73.74259392662758, 41.209774899555896] // Northeast coordinates
  );
}

export const getMtaMapOptions = (container, pitch) => {
  let mapPitch = null;
  const mapCenter = setMapCenter();
  const bearing = setManhattanTilt();

  const bounds = setMaxBounds();

  if (pitch > 0){ 
    mapPitch = 0;
  } else mapPitch = 0;

   return ({
    container: container,
    style: mapStyle as unknown as StyleSpecification,
    center: mapCenter, // NYC
    zoom: 13,
    bearing: bearing,
    pitch: mapPitch,
    minZoom: 9, // enough to see entire system, but no more
    maxBounds: bounds || null
   })
}

export const outageSourceOptions = {
  type: "geojson",
  data: {
    type: "FeatureCollection",
    features: [],
  },
  dynamic: true,
  generateId: true,
};

export const complexBoundarySourceOptions = {
  type: "geojson",
  data: {
    type: "FeatureCollection",
    features: [],
  },
};



