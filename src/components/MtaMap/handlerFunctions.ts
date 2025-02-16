import React from "react";
import { createRoot } from "react-dom/client";
import { OnHoverElevatorPopup } from "../ElevatorPopup/ElevatorPopup";


export function handleMouseMove(e: any, hoveredFeatureId: any, mapRef: any, onHoverPopupRef: any) {
  if (e.features.length > 0) {
    // Change opacity of elevator icon to indicate hover
    if (hoveredFeatureId !== null) {
      mapRef.current.setFeatureState(
        {
          source: "composite",
          sourceLayer: "transit_elevators",
          id: hoveredFeatureId,
        },
        { hover: false }
      );
    }
    hoveredFeatureId = e.features[0].id;
    mapRef.current.setFeatureState(
      {
        source: "composite",
        sourceLayer: "transit_elevators",
        id: hoveredFeatureId,
      },
      { hover: true }
    );

    // Display popup with image and information about the station
    const feature = e.features[0];
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = feature.properties.description;
    const imageUrl = feature.properties.image;
    const title = feature.properties.title;
    const linesServed = feature.properties.linesServed;
    const lines = linesServed.split("/");
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDiv = document.createElement("div");
    document.body.appendChild(popupDiv); // Ensure it's added to the DOM
    const root = createRoot(popupDiv);
    root.render(<OnHoverElevatorPopup linesServed={linesServed} />);
    onHoverPopupRef.current
      .setLngLat(coordinates)
      .setDOMContent(popupDiv)
      .addTo(mapRef.current);
  }
  return hoveredFeatureId;
}
