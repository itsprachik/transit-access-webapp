import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import dotenv from "dotenv";
import {
  getOutElevatorNumbers,
  updateOutageLayer,
} from "./layers/CurrentOutages/handlerFunctions";
import { outageSourceOptions } from "./mtaMapOptions";
import { currentOutageProps } from "./layers/CurrentOutages/currentOutagesProps";
import { handleMouseLeave, handleMouseMove, handleOnClick, initializeMtaMap } from "./handlerFunctions";
import { doesStationHaveOutage, getStationsWithOutages } from "@/utils/dataUtils";

// Load environment variables
dotenv.config();

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

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
      mapRef.current.moveLayer("outages", "transit-elevators");

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
      const stationsWithOutages = getStationsWithOutages(elevatorOutages);
  
      // Draw a warning sign for stations with ANY elevator outage
      Object.entries(stationsWithOutages).forEach(([stationID, hasOutage]) => {
        if (hasOutage) {
          console.log(`⚠️ Station ${stationID} has an outage`); //temp
          // TODO: Add layer with outage symbol on map
        }
      });
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


