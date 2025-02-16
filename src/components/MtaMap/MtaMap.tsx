import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import { getOutageLayerFeatures } from "@/utils/dataUtils";
import dotenv from "dotenv";
import {
  getOutElevatorNumbers,
  updateOutageLayer,
} from "./layers/CurrentOutages/handlerFunctions";
import { getMtaMapOptions, outageSourceOptions } from "./mtaMapOptions";
import { currentOutageProps } from "./layers/CurrentOutages/currentOutagesProps";
import { createRoot } from "react-dom/client";
import ElevatorPopup, {
  OnHoverElevatorPopup,
} from "../ElevatorPopup/ElevatorPopup";

let icon = true;

// Load environment variables
dotenv.config();

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

const initializeMtaMap = (mapRef, mapContainer) => {
  const mtaMapOptions = getMtaMapOptions(mapContainer.current);
  mapRef.current = new mapboxgl.Map(mtaMapOptions);
  // Add navigation controls
  // Zoom and bearing control
  const zoomControl = new mapboxgl.NavigationControl();
  mapRef.current.addControl(zoomControl, "bottom-left");
  // GeoLocate
  const geolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true,
    showUserHeading: true,
  });
  mapRef.current.addControl(geolocateControl, "bottom-right");
};

const MtaMap = () => {
  const mapRef = useRef();
  const mapContainer = useRef();
  let elevOut = [];
  const [elevatorOutages, setElevatorOutages] = useState([]);
  let hoveredFeatureId = null;

  // Popup for station info
  const onHoverPopupRef = useRef(
    new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "onhover-popup", // hover-popup css class
    })
  );

  const onClickPopupRef = useRef(
    new mapboxgl.Popup({
      anchor: "bottom",
      className: "onclick-popup",
      closeButton: true,
      closeOnClick: true,
    })
  );

  useEffect(() => {
    async function getOutages() {
      let data = await fetchOutages(apiKey);
      elevOut = data;
      setElevatorOutages(data);
      getOutElevatorNumbers(elevOut);
    }
    // Fetch outages on component mount
    getOutages();
    //Initialize Map
    initializeMtaMap(mapRef, mapContainer);
    mapRef.current?.on("load", () => {
      mapRef.current.setLayoutProperty(
        "transit-elevators",
        "visibility",
        "visible"
      );
      mapRef.current.addSource("outage-data", outageSourceOptions);

      if (elevOut.length > 0) {
        updateOutageLayer(elevOut, mapRef);
      }
      // Add outage layer with icons based on isBroken property
      mapRef.current.addLayer(currentOutageProps);

      // On hover event
      mapRef.current?.on("mousemove", "transit-elevators", (e) => {
        hoveredFeatureId = handleMouseMove(
          e,
          hoveredFeatureId,
          mapRef,
          onHoverPopupRef
        );
      });

      mapRef.current?.on("mouseleave", "transit-elevators", (e) => {
        hoveredFeatureId = handleMouseLeave(
          hoveredFeatureId,
          mapRef,
          onHoverPopupRef
        );
      });

      //  Click event to display pop-up ***
      mapRef.current?.on("click", "transit-elevators", (e) => {
        handleOnClick(e, onClickPopupRef, mapRef);
      });
    });

    // Set up an interval to fetch outages every 120 seconds.
    const intervalId = setInterval(getOutages, 10000);

    return () => {
      clearInterval(intervalId);
      mapRef.current.remove();
    };
  }, []);

  useEffect(() => {
    if (elevatorOutages.length > 0) {
      updateOutageLayer(elevatorOutages, mapRef);
    }
  }, [elevatorOutages]);

  return (
    <div
      style={{ height: "100vh" }} // remove in-line style from here, use tailwind or make a css module
      ref={mapContainer}
      className="map-container"
    />
  );
};

export default MtaMap;

function handleOnClick(e: any, onClickPopupRef: any, mapRef: any) {
  if (e.features.length > 0) {
    const feature = e.features[0];
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = feature.properties.description;
    const imageUrl = feature.properties.image;
    const title = feature.properties.title;
    const linesServed = feature.properties.linesServed;
    const elevatorno = feature.properties.elevatorno;
    icon = true;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    const popupDiv = document.createElement("div");
    document.body.appendChild(popupDiv); // Ensure it's added to the DOM
    const root = createRoot(popupDiv);
    root.render(
      <ElevatorPopup
        title={title}
        description={description}
        imageUrl={imageUrl}
        elevatorno={elevatorno}
        linesServed={linesServed}
        icon={icon} />
    );
    onClickPopupRef.current
      .setLngLat(coordinates)
      .setDOMContent(popupDiv)
      .addTo(mapRef.current);
  }
}

function handleMouseLeave(
  hoveredFeatureId: any,
  mapRef: any,
  onHoverPopupRef: any
) {
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
  hoveredFeatureId = null;
  onHoverPopupRef.current.remove();
  return hoveredFeatureId;
}

function handleMouseMove(
  e: any,
  hoveredFeatureId: any,
  mapRef: any,
  onHoverPopupRef: any
) {
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
