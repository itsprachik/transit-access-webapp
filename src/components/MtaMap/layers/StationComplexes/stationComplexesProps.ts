// naming convention: file is plural, export is singular.
// import runs into ts type problems when they're the same (unconfirmed but suspected)

export const stationComplexProps = {
  id: "mta-subway-complexes-accessible2",
  source: "station-complexes",
  type: "symbol",
  filter: ["match", ["get", "ada"], ["2", "1"], true, false],
  layout: {
    "text-size": 12,
    "text-radial-offset": 1.5,
    "text-allow-overlap": true,
    "symbol-sort-key": 10,
    "symbol-z-order": "auto",
    "text-variable-anchor": ["bottom", "right", "top", "left"],
    "icon-image": [
      "case",
      ["==", ["get", "isProblem"], false], // If elevator is working
      "border-dot-13-blue", // Use blue dot
      ["==", ["get", "isOut"], true], // If all elevators are out
      "border-dot-13-red", // Use red dot
      ["==", ["get", "isProblem"], true], // If elevator is broken
      "border-dot-13-yellow", // Use yellow dot
      "border-dot-13", // Default in case of missing data
    ],
"text-font": ["Montserrat Bold", "Arial Unicode MS Regular"],
        "icon-allow-overlap": true,
        "icon-size": [
          "step",
          ["zoom"],
          0.5,
          10,
          0.5,
          11,
          0.6,
          12,
          0.6,
          14,
          0.7,
          15,
          1.5,
          16,
          2.2,
          17,
          3
        ],
        "text-anchor": ["step", ["zoom"], "left", 17, "top"],
        "text-field": ["to-string", ["get", "name"]]
      },
      "paint": {
        "text-halo-color": "#ffffff",
        "text-halo-width": 50,
        "text-halo-blur": 50,
        "text-translate": [
          "step",
          ["zoom"],
          ["literal", [0, 0]],
          17,
          ["literal", [0, 5]]
        ],
        "text-opacity": ["step", ["zoom"], 0, 15, 1],
        "icon-opacity": ["step", ["zoom"], 0, 15, 1]
      },
  //sprite:
   // "mapbox://sprites/joelaaron/clndls6cm07rp01mae34gd2oo/ehu96mappgo0oqnlwfjrnz4ta", // Sprite URL
};