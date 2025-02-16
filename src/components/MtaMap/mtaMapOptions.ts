export const getMtaMapOptions = (container) => {
   return ({
    container: container,
    style: "mapbox://styles/joelaaron/clndls6cm07rp01mae34gd2oo",
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


