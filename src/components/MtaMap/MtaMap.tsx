import React, { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import dotenv from "dotenv";
import {
  getOutElevatorData,
  updateOutageLayer,
  updateStationOutageLayer,
  updateStationComplexLayer,
} from "./layers/CurrentOutages/handlerFunctions";
import {
  outageSourceOptions,
  complexBoundarySourceOptions,
  setMapCenter,
  setManhattanTilt,
} from "./mtaMapOptions";
import {
  currentOutageProps,
  stationOutageProps,
  animationProps,
} from "./layers/CurrentOutages/currentOutagesProps";
import { stationComplexProps } from "./layers/StationComplexes/stationComplexesProps";
import { complexBoundaryProps } from "./layers/StationComplexes/complexBoundariesProps";
import {
  handleOnClick,
  handleSearchPopup,
  initializeMtaMap,
  cleanUpPopups,
} from "./handlerFunctions";
import {
  getStationOutageArray,
  dealWithMapboxIconOverlap,
  makeElevatorMap,
} from "@/utils/dataUtils";
import SearchBar from "../SearchBar/SearchBar";
import { MtaStationData } from "@/utils/types";
import rawData from "@/resources/mta_subway_stations_all.json";
const stationData = rawData as MtaStationData;

// Load environment variables
dotenv.config();

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

const MtaMap = () => {
  const mapRef = useRef(null);
  const mapContainer = useRef(null);

  // STATES: elevator outages, station outages, station view
  // have to use hybrid state and ref (ref to keep stable data, state to re-render)
  const [elevatorDataState, setElevatorDataState] = useState(null);
  const elevatorDataRef = useRef(null);
  const [elevatorRawDataState, setElevatorRawData] = useState(null);
  const elevatorRawDataRef = useRef(null);

  const [stationDataState, setStationDataState] = useState(null);
  const stationDataRef = useRef(null);

  const [stationView, setStationView] = useState<string | null>(null); // app state: enter station view
  const [elevatorView, setElevatorView] = useState<string | null>(null); // app state: enter elevator view

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastUpdatedRef = useRef<Date | null>(null);

  const [zoomLevel, setZoomLevel] = useState(13);

  const [show3DToggle, setShow3DToggle] = React.useState(false);

  // track elevator data state change
  useEffect(() => {
    elevatorDataRef.current = elevatorDataState;
  }, [elevatorDataState]);

  // track elevator raw data state change
  useEffect(() => {
    const map = mapRef.current as mapboxgl.Map;
    if (map?.isStyleLoaded() && elevatorRawDataRef.current) {
      updateOutageLayer(elevatorRawDataRef.current, map);
    }
  }, [elevatorRawDataState]);

  // track station data state change
  useEffect(() => {
    stationDataRef.current = stationDataState;
  }, [stationDataState]);

  // track zoom state change
  useEffect(() => {
    // Track zoom level
    const map = mapRef.current as mapboxgl.Map;
    if (map?.isStyleLoaded()) {
      mapRef.current.on("zoom", () => {
        const zoom = mapRef.current.getZoom();
        setZoomLevel(zoom);
      });
    }
  }, [zoomLevel]);

  function getLatestElevatorData() {
    return elevatorDataRef.current;
  }

  const onClickPopupRef = useRef(
    new mapboxgl.Popup({
      anchor: "bottom",
      className: "onclick-popup",
      closeButton: true,
      closeOnClick: true,
    })
  );

  const handleStationSearchSelect = (
    feature,
    elevatorData,
    stationView,
    setStationView,
    elevatorView,
    setElevatorView,
    show3DToggle,
    setShow3DToggle,
    lastUpdated,
  ) => {
    handleSearchPopup(
      feature,
      onClickPopupRef,
      mapRef.current,
      elevatorData,
      stationView,
      setStationView,
      elevatorView,
      setElevatorView,
      show3DToggle,
      setShow3DToggle,
      lastUpdated,
    );
  };

  useEffect(() => {
    async function getOutages() {
      const data = await fetchOutages(apiKey);
      setElevatorRawData(data);
      elevatorRawDataRef.current = data;

      const elevData = getOutElevatorData(data);
      setElevatorDataState(elevData); // triggers rerender
      elevatorDataRef.current = elevData; // stable reference for handlers

      const stationData = getStationOutageArray(data);
      setStationDataState(stationData);
      stationDataRef.current = stationData;

      makeElevatorMap(); // an easy way to reference elevators and their stations/complexes

      setLastUpdated(new Date());
      lastUpdatedRef.current = new Date();

      // Trigger layer redraws after data updates
      if (
        mapRef.current?.getSource("outage-data") &&
        elevatorRawDataRef.current
      ) {
        updateOutageLayer(elevatorRawDataRef.current, mapRef.current);
      } else if (!elevatorDataState) {
        console.warn(
          "ElevatorDataState not loaded",
          "Raw Data:",
          elevatorRawDataState
        );
      }
      if (
        mapRef.current?.getSource("station-outage-data") &&
        stationDataRef.current
      ) {
        updateStationOutageLayer(stationDataRef.current, mapRef.current);
      }
      if (
        mapRef.current?.getSource("station-complexes") &&
        stationDataRef.current
      ) {
        updateStationComplexLayer(stationDataRef.current, mapRef.current);
      }
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

      mapRef.current.addSource("station-complexes", outageSourceOptions);
      mapRef.current.addSource("outage-data", outageSourceOptions);
      mapRef.current.addSource("station-outage-data", outageSourceOptions);

      if (
        mapRef.current?.getSource("outage-data") &&
        elevatorRawDataRef.current
      ) {
        updateOutageLayer(elevatorRawDataRef.current, mapRef.current);
      }
      if (
        mapRef.current?.getSource("station-outage-data") &&
        stationDataRef.current
      ) {
        updateStationOutageLayer(stationDataRef.current, mapRef.current);
      }
      if (
        mapRef.current?.getSource("station-complexes") &&
        stationDataRef.current
      ) {
        updateStationComplexLayer(stationDataRef.current, mapRef.current);
      }

      // Add outage layer with icons based on isBroken property

      mapRef.current.addLayer(currentOutageProps);
      mapRef.current.addLayer(stationOutageProps);
      mapRef.current.addLayer(stationComplexProps);

      // Moves transit elevators layer so it's not hidden by outage layer
      mapRef.current.moveLayer("stationOutages", "transit-elevators");
      mapRef.current.moveLayer(
        "mta-subway-complexes-accessible2",
        "transit-elevators"
      );

      // Draw a translucent complex boundary
      mapRef.current.addSource(
        "active-complex-boundary",
        complexBoundarySourceOptions
      );
      mapRef.current.addLayer(complexBoundaryProps);

      mapRef.current.on("zoom", () => {
        const zoom = mapRef.current.getZoom();
        setZoomLevel(zoom);
      });


      mapRef.current?.on("click", "stationOutages", (e) => {
        e.originalEvent.cancelBubble = true; // Don't click one layer when you meant the other
        handleOnClick(
          e,
          onClickPopupRef,
          mapRef.current,
          elevatorDataRef.current,
          stationView,
          setStationView,
          elevatorView,
          setElevatorView,
          show3DToggle,
          setShow3DToggle,
          lastUpdatedRef.current,
        );
      });

      mapRef.current?.on("click", "mta-subway-stations-accessible", (e) => {
        e.originalEvent.cancelBubble = true; // Don't click one layer when you meant the other
        handleOnClick(
          e,
          onClickPopupRef,
          mapRef.current,
          getLatestElevatorData(),
          stationView,
          setStationView,
          elevatorView,
          setElevatorView,
          show3DToggle,
          setShow3DToggle,
          lastUpdatedRef.current,         
        );

        // Track zoom level
        mapRef.current.on("zoom", () => {
          const zoom = mapRef.current.getZoom();
          setZoomLevel(zoom);
        });
      });

              mapRef.current?.on("click", "mta-subway-stations-inaccessible", (e) => {
          e.originalEvent.cancelBubble = true; // Don't click one layer when you meant the other
          handleOnClick(
            e,
            onClickPopupRef,
            mapRef.current,
            getLatestElevatorData(),
            stationView,
            setStationView,
            elevatorView,
            setElevatorView,
            show3DToggle,
            setShow3DToggle,
            lastUpdatedRef.current,         
          );

        // Track zoom level
        mapRef.current.on("zoom", () => {
          const zoom = mapRef.current.getZoom();
          setZoomLevel(zoom);
        });
      });

      mapRef.current?.on("click", "mta-subway-stations-inaccessible-icon2", (e) => {
        e.originalEvent.cancelBubble = true; // Don't click one layer when you meant the other
        handleOnClick(
          e,
          onClickPopupRef,
          mapRef.current,
          getLatestElevatorData(),
          stationView,
          setStationView,
          elevatorView,
          setElevatorView,
          show3DToggle,
          setShow3DToggle,
          lastUpdatedRef.current,         
        );

      // Track zoom level
      mapRef.current.on("zoom", () => {
        const zoom = mapRef.current.getZoom();
        setZoomLevel(zoom);
      });
    });

      //  Click event to display station pop-up
      mapRef.current?.on("click", "mta-subway-complexes-accessible2", (e) => {
        const currentZoom = mapRef.current.getZoom();
        if (currentZoom > 15) {
          let confirmedClick = dealWithMapboxIconOverlap(e);
          handleOnClick(
            confirmedClick,
            onClickPopupRef,
            mapRef.current,
            getLatestElevatorData(),
            stationView,
            setStationView,
            elevatorView,
            setElevatorView,
            show3DToggle,
            setShow3DToggle,
            lastUpdatedRef.current,         
          );
        }

        // Track zoom level
        mapRef.current.on("zoom", () => {
          const zoom = mapRef.current.getZoom();
          setZoomLevel(zoom);
        });
      });
      //  Click event to display elevator pop-up
      mapRef.current?.on("click", "transit-elevators", (e) => {
      //  if (!stationView) return; // if we're not in stationView, don't talk to me

        const zoom = mapRef.current?.getZoom?.() || 0;
        if (zoom < 15) return;

        e.originalEvent.cancelBubble = true; // Don't click one layer when you meant the other
        handleOnClick(
          e,
          onClickPopupRef,
          mapRef.current,
          getLatestElevatorData(),
          stationView,
          setStationView,
          elevatorView,
          setElevatorView,
          show3DToggle,
          setShow3DToggle,
          lastUpdatedRef.current,        
        );
      });

      mapRef.current?.on("click", "outages", (e) => {
      //  if (!stationView) return; // if we're not in stationView, don't talk to me

        const zoom = mapRef.current?.getZoom?.() || 0;
        if (zoom < 15) return;
        handleOnClick(
          e,
          onClickPopupRef,
          mapRef.current,
          getLatestElevatorData(),
          stationView,
          setStationView,
          elevatorView,
          setElevatorView,
          show3DToggle,
          setShow3DToggle,
          lastUpdatedRef.current,     
        );
      });
    });

    // Set up an interval to fetch outages every 30 seconds.
    const intervalId = setInterval(getOutages, 30000);

    return () => {
      clearInterval(intervalId);
      mapRef.current.remove();
    };
  }, []);

  return (
    <>
      <SearchBar
        data={stationData}
        map={mapRef.current}
        onStationSelect={(feature) => {
          handleStationSearchSelect(
            feature,
            getLatestElevatorData(),
            stationView,
            setStationView,
            elevatorView,
            setElevatorView,
            show3DToggle,
            setShow3DToggle,
            lastUpdatedRef.current,   
          );
        }}
      />

      <div ref={mapContainer} id="map-container" className="map-container" />

      {lastUpdated && (
        <div className="last-updated">
          Last updated:{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      {zoomLevel > 13 && (
        <button
          className="map-reset-button"
          onClick={() => {
            const map = mapRef.current as mapboxgl.Map;
            if (!map) return;
            cleanUpPopups();
            const center = setMapCenter();
            const bearing = setManhattanTilt();
            setStationView(null);
            setElevatorView(null);

            map.flyTo({
              center: center,
              zoom: 13,
              pitch: 0,
              bearing: bearing,
              speed: 1.8,
              curve: 1,
            });

            if (map.getLayer("active-complex-boundary-layer")) {
              map.setLayoutProperty(
                "active-complex-boundary-layer",
                "visibility",
                "none"
              );
            }
          }}
        >
          Return to Map
        </button>
      )}
      <>
        {/* Toggle floating on top of map, outside popup */}
        {show3DToggle && elevatorView && (
          <div className="show-3d-button-wrapper">
  <Switch
    defaultChecked
    onCheckedChange={(checked) => {
      if (!mapRef.current) return;
      const visibility = checked ? "visible" : "none";
      if (mapRef.current.getLayer("building-extrusion")) {
        mapRef.current.setLayoutProperty("building-extrusion", "visibility", visibility);
      }
    }}
  />
  <span className="show-3d-button-label">Show 3D Buildings</span>
</div>

        )}
      </>
    </>
  );
};

export default MtaMap;
