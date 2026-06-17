// naming convention: file is plural, export is singular.
// import runs into ts type problems when they're the same (unconfirmed but suspected)

import { dotView, elevatorView } from "../CurrentOutages/currentOutagesProps";
const offsetDistance = -23;
export const longtermOutageThreshold = 7;

export const upcomingOutageProps = {
  id: "upcoming-outages",
  source: "upcoming-outage-data",
  filter: [">", ["get", "outageDurationDays"], longtermOutageThreshold], // long-term only
  type: "symbol", // Using symbol type for icon display
  layout: {
    "icon-image": [
      "case",
      [">", ["get", "outageDurationDays"], longtermOutageThreshold], // long-term
      "wrench-filled",
      "",
    ],

    "icon-size": ["interpolate", ["linear"], ["zoom"], elevatorView-2, 0.6, elevatorView-1, 0.8, elevatorView+1, 0],
    "icon-anchor": "center",
    "icon-offset": [offsetDistance, 0],
    "icon-allow-overlap": true,
    "icon-padding": 0,
    "symbol-z-order": "source",
    "symbol-sort-key": 9,
  },
  paint: {
    "icon-opacity": ["step", ["zoom"], 0, dotView, 1, elevatorView-1, 0],

  },
  
};