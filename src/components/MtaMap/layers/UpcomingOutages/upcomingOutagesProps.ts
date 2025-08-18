// naming convention: file is plural, export is singular.
// import runs into ts type problems when they're the same (unconfirmed but suspected)

import { elevatorView } from "../CurrentOutages/currentOutagesProps";
const offsetDistance = 20;

export const upcomingOutageProps = {
  id: "upcoming-outages",
  source: "upcoming-outage-data",
  filter: ["==", ["get", "reason"], "Capital Replacement"], // If it's a long-term outage
  type: "symbol", // Using symbol type for icon display
  layout: {
    "icon-image": [
      "case",
      ["==", ["get", "reason"], "Capital Replacement"], // If it's a long-term outage
      "wrench-filled", // Use inverted wrench icon
      "", // Default to nothing
    ],

    "icon-size": ["interpolate", ["linear"], ["zoom"], elevatorView-2, 0.6, elevatorView-1, 0.8, elevatorView+1, 0],
    "icon-anchor": "center",
    "icon-offset": [-23, 0],
    "icon-allow-overlap": true,
    "icon-padding": 0,
    "symbol-z-order": "source",
    "symbol-sort-key": 9,
  },
  paint: {
    "icon-opacity": ["step", ["zoom"], 1, elevatorView-1, 0],

  },
  
};