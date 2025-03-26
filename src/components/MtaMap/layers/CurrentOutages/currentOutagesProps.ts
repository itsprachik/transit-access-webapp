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
    "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0, 14, 0, 15, 0.9, 19, 1],
    "icon-anchor": "center",
    "icon-offset": [0, -20],
    "icon-allow-overlap": true,
    "icon-padding": 2,
    "symbol-z-order": "auto",
    "symbol-sort-key": 1,

    "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 22, 10],
    "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 0, 1.2, 17, 2],

    "text-padding": ["interpolate", ["linear"], ["zoom"], 0, 0, 15, 0, 16, 2],
    "text-offset": [1.5, 0],
  },
  sprite:
    "mapbox://sprites/joelaaron/clndls6cm07rp01mae34gd2oo/ehu96mappgo0oqnlwfjrnz4ta", // Replace with your actual sprite URL
};

export const stationOutageProps = {
  id: "stationOutages",
  source: "station-outage-data",
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
    "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0, 14, 0, 15, 0.9, 19, 1],
    "icon-anchor": "center",
    "icon-offset": [0, -20],
    "icon-allow-overlap": true,
    "icon-padding": 2,
    "symbol-z-order": "auto",
    "symbol-sort-key": 1,

    "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 22, 10],
    "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 0, 1.2, 17, 2],

    "text-padding": ["interpolate", ["linear"], ["zoom"], 0, 0, 15, 0, 16, 2],
    "text-offset": [1.5, 0],
  },
  sprite:
    "mapbox://sprites/joelaaron/clndls6cm07rp01mae34gd2oo/ehu96mappgo0oqnlwfjrnz4ta", // Replace with your actual sprite URL
};