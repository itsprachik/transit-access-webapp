import mapStyle from "@/styles/mapbox-style.json"; 
import { StyleSpecification } from "mapbox-gl";

export function setManhattanTilt() { 
  const manhattanTilt = 29;
  return manhattanTilt;
}

export function setMapCenter(): [number, number] {
  return [-73.98265318925187, 40.7583063693059];
}

export const getMtaMapOptions = (container, pitch) => {
  let mapPitch = null;
  const mapCenter = setMapCenter();
  const bearing = setManhattanTilt();

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
    minZoom: 9 // enough to see entire system
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



