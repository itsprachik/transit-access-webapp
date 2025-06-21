import mapStyle from "@/styles/mapbox-style.json"; 
import { StyleSpecification } from "mapbox-gl";

export const getMtaMapOptions = (container) => {
   return ({
    container: container,
    style: mapStyle as unknown as StyleSpecification,
    center: [-73.98365318925187, 40.7583063693059] as [number, number], // NYC
    zoom: 13,
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


