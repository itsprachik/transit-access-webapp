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
      "wrench-plain", // Use inverted wrench icon
      "", // Default to nothing
    ],

    "icon-size": ["interpolate", ["linear"], ["zoom"], elevatorView-2, 0.6, elevatorView-1, 0.7, elevatorView+1, 0],
    "icon-anchor": "center",
    "icon-offset": [44, 8],
    "icon-allow-overlap": false,
    "icon-rotate": -90,
    "icon-padding": 2,
    "symbol-z-order": "source",
    "symbol-sort-key": 1,
  },
  paint: {
    "icon-opacity": ["step", ["zoom"], 1, elevatorView-1, 0],

  },
  
};