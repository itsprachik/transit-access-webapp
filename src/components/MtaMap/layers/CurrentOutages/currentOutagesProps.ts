const liftView = 16;
const offsetDistance = -20;

export const currentOutageProps = {
  id: "outages",
  source: "outage-data",
  type: "symbol", // Using symbol type for icon display
  layout: {
    "icon-image": [
      "case",
      ["==", ["get", "isBroken"], false], // If elevator is working
      "liftgood", // Use checkmark icon
      ["==", ["get", "isBroken"], true], // If elevator is broken
      "liftbad", // Use X icon
      "liftgood", // Default to checkmark icon in case of missing data
    ],
    
    "icon-opacity": ["step", ["zoom"], 0, liftView, 1],
    "icon-size": ["interpolate", ["linear"], ["zoom"], liftView, 0, liftView + 1, 0.8, liftView + 2, 0.9],
    "icon-anchor": "center",
    "icon-offset": [0, offsetDistance],
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
    "icon-padding": 2,
    "symbol-z-order": "source",
    "symbol-sort-key": 10,

    "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 22, 10],
    "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 0, 1.2, 17, 2],

    "text-padding": ["interpolate", ["linear"], ["zoom"], 0, 0, 15, 0, 16, 2],
    "text-offset": [1.5, 0],
  }
//  sprite:
   // "mapbox://sprites/joelaaron/clndls6cm07rp01mae34gd2oo/ehu96mappgo0oqnlwfjrnz4ta", // Sprite URL
};

export const stationOutageProps = {
  id: "stationOutages",
  source: "station-outage-data",
  type: "symbol",
  layout: {
    "icon-image": [
      "case",
      ["==", ["get", "isProblem"], false], // If elevator is working
      "liftgood", // Use checkmark icon
      ["==", ["get", "isOut"], true], // If all elevators are out
      "liftbad", // Use X icon
      ["==", ["get", "isProblem"], true], // If elevator is broken
      "warn", // Use warning icon
      "", // Default to nothing in case of missing data
    ],
    "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.7, 17, 0.9, 18, 0],
    "icon-anchor": "center",
    "icon-offset": [0, offsetDistance],
    "icon-allow-overlap": true,
    "icon-padding": 2,
    "symbol-z-order": "source",
    "symbol-sort-key": 20,

    "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 22, 10],
    "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 0, 1.2, 17, 2],

    "text-padding": ["interpolate", ["linear"], ["zoom"], 0, 0, 15, 0, 16, 2],
    "text-offset": [1.5, 0],
  }
  //sprite:
   // "mapbox://sprites/joelaaron/clndls6cm07rp01mae34gd2oo/ehu96mappgo0oqnlwfjrnz4ta", // Sprite URL
};

export const animationProps = {
  id: "outage-glow",
  type: "circle",
  source: "station-outage-data",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      10, 10, 
      17, 20, 
      18, 0,
    ],
    "circle-color": "#2bb7ce", // Bright teal glow color
    "circle-opacity": 0,
    "circle-blur": 0.6,
    "circle-translate": [0, -20],
  },
  filter: ["==", ["get", "isProblem"], false], // Only working elevators pulse
};