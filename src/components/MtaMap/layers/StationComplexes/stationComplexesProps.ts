// naming convention: file is plural, export is singular.
// import runs into ts type problems when they're the same (unconfirmed but suspected)

export const stationComplexProps = {
  id: "mta-subway-complexes-accessible2",
  source: "station-complexes",
  type: "symbol",
  filter: ["match", ["get", "ada"], ["2", "1"], true, false],
  layout: {
    "text-optional": true,
    "text-size": 10,
    "text-radial-offset": 1,
    "text-allow-overlap": true,
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
"text-font": ["Montserrat SemiBold", "Arial Unicode MS Regular"],
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
          15,
          0.7,
          16,
          1.5
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
        "text-opacity": ["step", ["zoom"], 0, 16, 1],
        "icon-opacity": ["step", ["zoom"], 0, 16, 1]
      },
  //sprite:
   // "mapbox://sprites/joelaaron/clndls6cm07rp01mae34gd2oo/ehu96mappgo0oqnlwfjrnz4ta", // Sprite URL
};