import React, { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import dotenv from "dotenv";
import {
  getOutElevatorData,
  updateUpcomingOutagesLayer,
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
import { upcomingOutageProps } from "./layers/UpcomingOutages/upcomingOutagesProps";
import {
  handleOnClick,
  handleMouseLeave,
  handlePopupEvent,
  handleSearchPopup,
  initializeMtaMap,
  cleanUpPopups,
  removeHoverPopup,
} from "./handlerFunctions";
import {
  getStationOutageArray,
  dealWithMapboxIconOverlap,
  makeElevatorMap,
} from "@/utils/dataUtils";
import SearchBar from "../SearchBar/SearchBar";
import { MtaStationData } from "@/utils/types";
import { IoEarthSharp } from "react-icons/io5";
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
  const [upcomingElevatorDataState, setUpcomingElevatorDataState] =
    useState(null);
  const upcomingElevatorDataRef = useRef(null);
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

  let hoveredFeatureId = null;

  // Popup for station info
  const onHoverPopupRef = useRef(
    new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
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

  const handleStationSearchSelect = (
    feature,
    elevatorData,
    upcomingElevatorData,
    stationData,
    stationView,
    setStationView,
    elevatorView,
    setElevatorView,
    show3DToggle,
    setShow3DToggle,
    lastUpdated
  ) => {
    handleSearchPopup(
      feature,
      onClickPopupRef,
      mapRef.current,
      elevatorData,
      upcomingElevatorDataRef.current,
      stationDataRef.current,
      stationView,
      setStationView,
      elevatorView,
      setElevatorView,
      show3DToggle,
      setShow3DToggle,
      lastUpdated
    );
  };

  useEffect(() => {
    async function getOutages() {
      const data = await fetchOutages(apiKey);
      const currentData = data.filter((el) => el.isupcomingoutage === "N");
      const upcomingData = data.filter((el) => el.isupcomingoutage === "Y");
      setElevatorRawData(currentData);
      elevatorRawDataRef.current = currentData;

      const elevData = getOutElevatorData(currentData);
      const upcomingElevData = getOutElevatorData(upcomingData);
      setElevatorDataState(elevData); // triggers rerender
      setUpcomingElevatorDataState(upcomingElevData);
      elevatorDataRef.current = elevData;
      upcomingElevatorDataRef.current = upcomingData;

      const stationData = getStationOutageArray(currentData);
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
      if (mapRef.current?.getSource("upcoming-outage-data")) {
        updateUpcomingOutagesLayer(
          upcomingElevatorDataRef.current,
          mapRef.current
        );
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
      mapRef.current.addSource("upcoming-outage-data", outageSourceOptions);

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

      if (mapRef.current?.getSource("upcoming-outage-data")) {
        updateUpcomingOutagesLayer(
          upcomingElevatorDataRef.current,
          mapRef.current
        );
      }

      // Add outage layer with icons based on isBroken property

      mapRef.current.addLayer(currentOutageProps);
      mapRef.current.addLayer(stationOutageProps);
      mapRef.current.addLayer(stationComplexProps);
      mapRef.current.addLayer(upcomingOutageProps);

      // Moves transit elevators layer so it's not hidden by outage layer
      mapRef.current.moveLayer("stationOutages", "transit-elevators");
      mapRef.current.moveLayer(
        "mta-subway-complexes-accessible2",
        "transit-elevators"
      );
      mapRef.current.moveLayer(
        "upcoming-outages",
        "mta-subway-stations-accessible"
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

      mapRef.current.on("click", () =>
        removeHoverPopup(onHoverPopupRef.current)
      );
      mapRef.current.on("zoomstart", () =>
        removeHoverPopup(onHoverPopupRef.current)
      );

      const priority = [
        "upcoming-outages",
        "stationOutages",
        "mta-subway-stations-accessible",
        "mta-subway-complexes-accessible2",
        "transit-elevators",
        "outages",
        "mta-subway-stations-inaccessible",
      ];

      // One click listener for all interactive layers
      mapRef.current?.on("click", (e) => {
        const features = mapRef.current?.queryRenderedFeatures(e.point, {
          layers: priority,
        });

        // choose the highest priority feature
        function pickTopFeature(features) {
          return features.sort((a, b) => {
            const aIdx = priority.indexOf(a.layer.id);
            const bIdx = priority.indexOf(b.layer.id);
            return aIdx - bIdx; // lower index = higher priority
          })[0];
        }

        const prioritizedFeature = pickTopFeature(features);

        if (!features || !features.length) return;

        // Mutate the event object to look like a layer-specific event
        const augmentedEvent = {
          ...e,
          features: [prioritizedFeature],
        };

        const layerId = prioritizedFeature.layer.id;

        switch (layerId) {
          case "stationOutages":
          case "mta-subway-stations-accessible":
          case "mta-subway-stations-inaccessible":
          case "mta-subway-stations-inaccessible-icon2":
            handleOnClick(
              augmentedEvent,
              onClickPopupRef,
              mapRef.current,
              getLatestElevatorData(),
              upcomingElevatorDataRef.current,
              stationDataRef.current,
              stationView,
              setStationView,
              elevatorView,
              setElevatorView,
              show3DToggle,
              setShow3DToggle,
              lastUpdatedRef.current
            );
            break;

          case "mta-subway-complexes-accessible2":
            if (mapRef.current.getZoom() > 15) {
              let confirmedClick = dealWithMapboxIconOverlap(augmentedEvent);
              handleOnClick(
                confirmedClick,
                onClickPopupRef,
                mapRef.current,
                getLatestElevatorData(),
                upcomingElevatorDataRef.current,
                stationDataRef.current,
                stationView,
                setStationView,
                elevatorView,
                setElevatorView,
                show3DToggle,
                setShow3DToggle,
                lastUpdatedRef.current
              );
            }
            break;

          case "transit-elevators":
          case "outages":
            if ((mapRef.current?.getZoom?.() || 0) >= 15) {
              handleOnClick(
                augmentedEvent,
                onClickPopupRef,
                mapRef.current,
                getLatestElevatorData(),
                upcomingElevatorDataRef.current,
                stationDataRef.current,
                stationView,
                setStationView,
                elevatorView,
                setElevatorView,
                show3DToggle,
                setShow3DToggle,
                lastUpdatedRef.current
              );
            }
            break;

          case "upcoming-outages":
            if (isTouch) {
              let confirmedClick = dealWithMapboxIconOverlap(augmentedEvent);
              hoveredFeatureId = handlePopupEvent(
                confirmedClick,
                hoveredFeatureId,
                mapRef.current,
                onHoverPopupRef.current,
                true
              );
            }
            break;

          default:
            break;
        }
      });

      // Track zoom level separately (one global listener)
      mapRef.current?.on("zoom", () => {
        setZoomLevel(mapRef.current?.getZoom() ?? 0);
      });

      const isTouch = navigator.maxTouchPoints > 0;

      // Hover logic remains separate for non-touch
      if (!isTouch) {
        mapRef.current.on("mousemove", "upcoming-outages", (e) => {
          hoveredFeatureId = handlePopupEvent(
            e,
            hoveredFeatureId,
            mapRef.current,
            onHoverPopupRef.current,
            false
          );
        });

        mapRef.current.on("mouseleave", "upcoming-outages", () => {
          hoveredFeatureId = handleMouseLeave(
            hoveredFeatureId,
            mapRef.current,
            onHoverPopupRef.current
          );
        });
      }
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
            upcomingElevatorDataRef.current,
            stationDataRef.current,
            stationView,
            setStationView,
            elevatorView,
            setElevatorView,
            show3DToggle,
            setShow3DToggle,
            lastUpdatedRef.current
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
          <IoEarthSharp size={20} /> Return to Map
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
                  mapRef.current.setLayoutProperty(
                    "building-extrusion",
                    "visibility",
                    visibility
                  );
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
