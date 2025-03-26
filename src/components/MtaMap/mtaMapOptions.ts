import mapStyle from "@/styles/mapbox-style.json"; 

export const getMtaMapOptions = (container) => {
   return ({
    container: container,
    style: mapStyle,
    center: [-73.98365318925187, 40.7583063693059], // NYC
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


