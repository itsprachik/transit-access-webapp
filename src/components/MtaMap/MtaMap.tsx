import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import dotenv from "dotenv";
import {
  getOutElevatorNumbers,
  updateOutageLayer,
  updateStationOutageLayer,
} from "./layers/CurrentOutages/handlerFunctions";
import { outageSourceOptions } from "./mtaMapOptions";
import {
  currentOutageProps,
  stationOutageProps,
  animationProps,
} from "./layers/CurrentOutages/currentOutagesProps";
import {
  handleMouseLeave,
  handleMouseMove,
  handleOnClick,
  initializeMtaMap,
} from "./handlerFunctions";
import { getStationOutageArray } from "@/utils/dataUtils";

// Load environment variables
dotenv.config();

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

const MtaMap = () => {
  const mapRef = useRef();
  const mapContainer = useRef();
  let elevOut = [];
  let stationOut = [];
  const [elevatorOutages, setElevatorOutages] = useState([]);
  const [stationOutages, setStationOutages] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(13);
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

      stationOut = getStationOutageArray(data);
      setStationOutages(stationOut);
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
      mapRef.current.addSource("station-outage-data", outageSourceOptions);

      if (elevOut.length > 0) {
        updateOutageLayer(elevOut, mapRef);
        updateStationOutageLayer(stationOut, mapRef);
      }

      // Add outage layer with icons based on isBroken property
      mapRef.current.addLayer(currentOutageProps);
      // Moves transit elevators layer so it's not hidden by outage layer
      //  mapRef.current.moveLayer("outages", "transit-elevators");

      mapRef.current.addLayer(stationOutageProps);
      mapRef.current.moveLayer("stationOutages", "transit-elevators");

      //*********************************************************
          // glow animation on liftgood
          if (mapRef.current.getZoom() < 16 ) {
            mapRef.current.addLayer(animationProps);
          }
    
          let pulseRadius = 0;
          let pulseOpacity = 0.6;
          let isWaiting = false; // Track if we are in the pause phase
    
          function animateGlow(pauseDuration = 500) {
            // pauseDuration in milliseconds
            let lastTime = 0;
            let delayStartTime = 0;
    
            function frame(time) {
              if (!mapRef.current) return;
    
              const delta = time - lastTime;
    
              if (isWaiting) {
                // If waiting for the next animation...
                if (time - delayStartTime > pauseDuration) {
                  // Done waiting
                  pulseRadius = 0;
                  isWaiting = false;
                  lastTime = time;
                
                  // Deals with sharp reset
                  setTimeout(() => {
                    pulseOpacity = 0.8;
                  }, 200); // wait 200ms
                }            
              } else {
                // Animate the pulse normally
                if (delta > 16) {
                  // about 60fps updates
                  pulseRadius += 0.3;
                  pulseOpacity = Math.max(0, pulseOpacity - 0.01);
    
                  if (pulseOpacity <= 0) {
                    // Start waiting phase
                    isWaiting = true;
                    delayStartTime = time;
                  }
    
                  mapRef.current.setPaintProperty(
                    "outage-glow",
                    "circle-radius",
                    pulseRadius
                  );
                  mapRef.current.setPaintProperty(
                    "outage-glow",
                    "circle-opacity",
                    pulseOpacity
                  );
    
                  lastTime = time;
                }
              }
    
              requestAnimationFrame(frame);
            }
    
            requestAnimationFrame(frame);
          }
     //*********************************************************

      // Track zoom level
      mapRef.current.on("zoom", () => {
        const zoom = mapRef.current.getZoom();
        setZoomLevel(zoom);
      });

      // On hover event
      mapRef.current?.on("mousemove", "transit-elevators", (e) => {
        const currentZoom = mapRef.current.getZoom();
        if (currentZoom > 17) {
          hoveredFeatureId = handleMouseMove(
            e,
            hoveredFeatureId,
            mapRef,
            onHoverPopupRef
          );
        }
      });

      mapRef.current?.on("mouseleave", "transit-elevators", (e) => {
        const currentZoom = mapRef.current.getZoom();
        if (currentZoom > 17) {
          hoveredFeatureId = handleMouseLeave(
            hoveredFeatureId,
            mapRef,
            onHoverPopupRef
          );
        }
      });

      // zoom into station
      const zoomToFeature = (e) => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const coordinates = feature.geometry?.coordinates;

        if (!coordinates || coordinates.length !== 2) return;

        mapRef.current.flyTo({
          center: coordinates,
          zoom: 19,
          speed: 1.2,
          curve: 1,
        });
      };

      mapRef.current?.on("click", "stationOutages", zoomToFeature);
      mapRef.current?.on(
        "click",
        "mta-subway-stations-accessible",
        zoomToFeature
      );

      //  Click event to display pop-up ***
      mapRef.current?.on("click", "transit-elevators", (e) => {
        const currentZoom = mapRef.current.getZoom();
        if (currentZoom > 17) {
          handleOnClick(e, onClickPopupRef, mapRef);
        }
      });

      //*********************************************************      
      mapRef.current.once("idle", () => {
        animateGlow();
      });
      //*********************************************************
    });

    // Set up an interval to fetch outages every 120 seconds.
    const intervalId = setInterval(getOutages, 10000);

    return () => {
      clearInterval(intervalId);
      mapRef.current.remove();
    };
  }, []);

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div
        ref={mapContainer}
        className="map-container"
        style={{ width: "100%", height: "100%" }}
      />

      {zoomLevel > 16 && (
        <button
          className="map-reset-button"
          onClick={() =>
            mapRef.current?.flyTo({
              center: [-73.98365318925187, 40.7583063693059],
              zoom: 13,
              speed: 1.2,
              curve: 1,
            })
          }
        >
          Return to Map
        </button>
      )}
    </div>
  );
};

export default MtaMap;
