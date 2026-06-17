import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import mapboxgl, { LngLat } from "mapbox-gl";
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
  getBearingByLocation,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  BIRDSEYE_CENTER,
  BIRDSEYE_CENTER_DESKTOP,
  BIRDSEYE_ZOOM,
} from "./mtaMapOptions";
import {
  currentOutageProps,
  stationOutageProps,
  stationDotProps,
  animationProps,
  dotView,
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
  pickTopFeature,
  makeElevatorMap,
  getADAPctByStation,
  getADAPctByComplex,
  getCurrentElevatorCount,
} from "@/utils/dataUtils";
import SearchBar from "../SearchBar/SearchBar";
import { MtaStationData } from "@/utils/types";
import { IoEarthSharp } from "react-icons/io5";
import AlertBanner from "../AlertBanner/AlertBanner";
import { handleAlertClose } from "../AlertBanner/handlerFunctions";
import { AlertData } from "@/types/alerts";
import LegendDrawer from "../Legend/LegendDrawer";
import { initializeStore } from "@/lib/dataStore";
import dynamic from "next/dynamic";
const NearbyStationsPopup = dynamic(
  () => import("../NearbyStations/NearbyStationsPopup"),
  { ssr: false },
);
import { applyZIndexVars } from "@/styles/zIndex";
import { FiZoomIn, FiMaximize2, FiMinimize2 } from "react-icons/fi";

// Load environment variables
dotenv.config();

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// ─── Map-center alignment constants ──────────────────────────────────────────
// Change these to move the locator dot, map padding, and center calculation
// all at once. CSS vars are written from here.
const MOBILE_POPUPSHIFT_DVH = 30; // map shift on mobile (dvh) -- lower value shifts map up
const DESKTOP_POPUPSHIFT_LEFT = 100; // map shift left on desktop (px)
const DESKTOP_POPUPSHIFT_TOP = -30; // map shift top on desktop (px)
// ─────────────────────────────────────────────────────────────────────────────

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
  const [upcomingRawData, setUpcomingRawData] = useState<any[] | null>(null);
  const [elevatorRawDataState, setElevatorRawData] = useState(null);
  const elevatorRawDataRef = useRef(null);

  const [stationDataState, setStationDataState] = useState(null);
  const stationDataRef = useRef(null);

  const [stationView, setStationView] = useState<string | null>(null); // app state: enter station view
  const [elevatorView, setElevatorView] = useState<string | null>(null); // app state: enter elevator view

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastUpdatedRef = useRef<Date | null>(null);

  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);

  const [show3DToggle, setShow3DToggle] = React.useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [stationPopupOpen, setStationPopupOpen] = useState(false);
  const [locateSignal, setLocateSignal] = useState(0);
  const [mapCenterLocation, setMapCenterLocation] = useState<
    [number, number] | null
  >(null);
  const [showCenterDot, setShowCenterDot] = useState(false);
  const [dotDrop, setDotDrop] = useState(false);
  const [nearbyPanelState, setNearbyPanelState] = useState<
    "minimized" | "collapsed" | "expanded"
  >("collapsed");
  const [nearbyPanelEl, setNearbyPanelEl] = useState<HTMLElement | null>(null);
  const nearbyMinimizedRef = useRef(false);
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const isZoomedOutRef = useRef(false);
  const preZoomOutPositionRef = useRef<{
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  } | null>(null);

  const [stationData, setStationData] = useState<MtaStationData | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<AlertData[]>([]);

  const [openStates, setOpenStates] = useState({});
  const hasAlert =
    systemAlerts?.length > 0 &&
    systemAlerts.some((_, i) => openStates[i] !== false);

  // Set elevator operational stats in a state
  const [elevatorStats, setElevatorStats] = useState({
    numOutElevators: 0,
    totalElevators: getCurrentElevatorCount(),
    pctInService: 100,
  });

  // Initialize open states when alertData changes
  // Initialize open states when systemAlerts changes
  useEffect(() => {
    if (systemAlerts && systemAlerts.length > 0) {
      const initialStates = {};
      systemAlerts.forEach((_, index) => {
        initialStates[index] = true;
      });
      setOpenStates(initialStates);
    }
  }, [systemAlerts]);

  // track elevator data state change
  useEffect(() => {
    elevatorDataRef.current = elevatorDataState;

    const numOutElevators = elevatorDataState?.length ?? 0;
    const totalElevators = getCurrentElevatorCount();
    const pctInService = Math.round(
      (1 - numOutElevators / totalElevators) * 100,
    );

    setElevatorStats({ numOutElevators, totalElevators, pctInService });
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
    }),
  );

  const onClickPopupRef = useRef(
    new mapboxgl.Popup({
      anchor: "bottom",
      className: "onclick-popup",
      closeButton: true,
      closeOnClick: true,
    }),
  );

  useEffect(() => {
    const popup = onClickPopupRef.current;
    const onOpen = () => setStationPopupOpen(true);
    const onClose = () => setStationPopupOpen(false);
    popup.on("open", onOpen);
    popup.on("close", onClose);
    return () => {
      popup.off("open", onOpen);
      popup.off("close", onClose);
    };
  }, []);

  const lastMapPositionRef = useRef<{
    center: [number, number];
    zoom: number;
    bearing: number;
  } | null>(null);

  const captureMapPosition = () => {
    const map = mapRef.current as mapboxgl.Map;
    if (!map) return;
    const { lng, lat } = map.getCenter();
    lastMapPositionRef.current = {
      center: [lng, lat],
      zoom: map.getZoom(),
      bearing: map.getBearing(),
    };
    if (isZoomedOutRef.current) {
      setIsZoomedOut(false);
      isZoomedOutRef.current = false;
    }
  };

  const handleBack = () => {
    cleanUpPopups();
    const pos = lastMapPositionRef.current;
    if (pos) {
      mapRef.current?.flyTo({
        center: pos.center,
        zoom: pos.zoom,
        bearing: pos.bearing,
        pitch: 0,
        duration: 800,
        essential: true,
      });
    }
  };

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
    lastUpdated,
    onBack?: () => void,
    walkingToleranceMiles?: number | null,
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
      lastUpdated,
      onBack,
      userLocation,
      walkingToleranceMiles,
    );
  };

  // Keep desktop nav controls aligned with the legend drawer (shifts down when alert is open)
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--nav-ctrl-top",
      hasAlert ? "109px" : "66px",
    );
  }, [hasAlert]);

  // Run before first paint so z-index vars and shift constants are set
  // before the browser lays out fixed-position elements.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--mobile-shift-dvh", `${MOBILE_POPUPSHIFT_DVH}dvh`);
    root.style.setProperty(
      "--desktop-shift-left",
      `${DESKTOP_POPUPSHIFT_LEFT}px`,
    );
    root.style.setProperty(
      "--desktop-shift-top",
      `${DESKTOP_POPUPSHIFT_TOP}px`,
    );
    applyZIndexVars();
  }, []);

  useEffect(() => {
    async function loadDatasets() {
      const [elevatorsRes, stationsRes, alertsRes] = await Promise.all([
        fetch("/api/elevators"),
        fetch("/api/stations"),
        fetch("/api/alerts"),
      ]);

      const [elevatorsGeoJSON, { complexes, stations }, alertsData] =
        await Promise.all([
          elevatorsRes.json(),
          stationsRes.json(),
          alertsRes.json(),
        ]);

      initializeStore(
        elevatorsGeoJSON,
        complexes,
        stations,
        alertsData.station,
      );
      setStationData(stations as MtaStationData);
      setSystemAlerts(alertsData.system as AlertData[]);
    }

    // Accepts an already running fetch promise so the outage request can
    // run in parallel with loadDatasets() — process the response after
    // initializeStore() has been called.
    async function getOutages(responseProm?: Promise<Response>) {
      const response = await (responseProm ?? fetch("/api/outages"));
      if (!response.ok)
        throw new Error(`Outage fetch failed: ${response.status}`);
      const data = await response.json();
      const currentData = data.filter((el) => el.isupcomingoutage === "N");
      const upcomingData = data.filter((el) => el.isupcomingoutage === "Y");
      setElevatorRawData(currentData);
      elevatorRawDataRef.current = currentData;

      const elevData = getOutElevatorData(currentData);
      const upcomingElevData = getOutElevatorData(upcomingData);

      setElevatorDataState(elevData); // triggers rerender
      setUpcomingElevatorDataState(upcomingElevData);
      setUpcomingRawData(upcomingData);
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
          elevatorRawDataState,
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
          mapRef.current,
        );
      }
    }
    // Start geolocation immediately — runs in parallel with map loading so the
    // location is resolved by the time the map loads.
    const locationPromise = setMapCenter();

    //   • outagesFetch — network request starts immediately
    //   • loadDatasets — populates the store (must complete first)
    // Then process the outage response once the store is ready.
    async function initialize() {
      const outagesFetch = fetch("/api/outages");
      await loadDatasets();
      getOutages(outagesFetch);
    }
    initialize();

    // Compute the panel-shift padding once so both setPadding and geolocate's
    // fitBoundsOptions always reference the same values.
    const isMobile = window.innerWidth < 768;
    const panelShiftPadding = isMobile
      ? {
          top: Math.max(
            0,
            Math.round(window.innerHeight * (-MOBILE_POPUPSHIFT_DVH / 100)),
          ),
          bottom: Math.max(
            0,
            Math.round(window.innerHeight * (MOBILE_POPUPSHIFT_DVH / 100)),
          ),
          left: 0,
          right: 0,
        }
      : {
          top: Math.max(0, 2 * DESKTOP_POPUPSHIFT_TOP),
          bottom: Math.max(0, -2 * DESKTOP_POPUPSHIFT_TOP),
          left: Math.max(0, 2 * DESKTOP_POPUPSHIFT_LEFT),
          right: Math.max(0, -2 * DESKTOP_POPUPSHIFT_LEFT),
        };

    //Initialize Map
    initializeMtaMap(
      mapRef,
      mapContainer,
      locationPromise,
      setUserLocation,
      () => setLocateSignal((n) => n + 1),
      panelShiftPadding,
    );

    // Read the bearing the map was constructed with (Manhattan tilt is non-zero by design)
    document.documentElement.dataset.bearingZero =
      Math.abs(mapRef.current?.getBearing() ?? 0) < 0.5 ? "true" : "false";
    mapRef.current?.on("rotate", () => {
      const b = mapRef.current.getBearing();
      document.documentElement.dataset.bearingZero =
        Math.abs(b) < 0.5 ? "true" : "false";
    });

    // Shift the map's visual center into the visible area above (mobile) or beside (desktop) the panel.
    // This makes geolocate, flyTo, and the fake-location dot all land at the same screen position.
    mapRef.current?.setPadding(panelShiftPadding);

    mapRef.current?.on("load", () => {
      mapRef.current.setLayoutProperty(
        "transit-elevators",
        "visibility",
        "visible",
      );

      // Set correct initial compass visibility based on the map's starting bearing
      document.documentElement.dataset.bearingZero =
        Math.abs(mapRef.current.getBearing()) < 0.5 ? "true" : "false";

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
          mapRef.current,
        );
      }

      // Add outage layer with icons based on isBroken property

      mapRef.current.addLayer(currentOutageProps);

      mapRef.current.addLayer(stationDotProps);

      mapRef.current.addLayer(stationOutageProps); // icons (comes in at zooms higher than dotLevel)
      mapRef.current.addLayer(stationComplexProps);
      mapRef.current.addLayer(upcomingOutageProps);

      // Moves transit elevators layer so it's not hidden by outage layer
      mapRef.current.moveLayer("stationOutages", "transit-elevators");
      mapRef.current.moveLayer(
        "mta-subway-complexes-accessible2",
        "transit-elevators",
      );
      mapRef.current.moveLayer(
        "upcoming-outages",
        "mta-subway-stations-accessible",
      );

      // Draw a translucent complex boundary
      mapRef.current.addSource(
        "active-complex-boundary",
        complexBoundarySourceOptions,
      );
      mapRef.current.addLayer(complexBoundaryProps);

      mapRef.current.on("zoom", () => {
        const zoom = mapRef.current.getZoom();
        setZoomLevel(zoom);
      });

      mapRef.current.on("click", () =>
        removeHoverPopup(onHoverPopupRef.current),
      );
      let userZoom = false;
      mapRef.current.on("zoomstart", (e) => {
        removeHoverPopup(onHoverPopupRef.current);
        if (!isZoomedOutRef.current) {
          const { lng, lat } = mapRef.current.getCenter();
          preZoomOutPositionRef.current = {
            center: [lng, lat],
            zoom: mapRef.current.getZoom(),
            bearing: mapRef.current.getBearing(),
            pitch: mapRef.current.getPitch(),
          };
          if (e.originalEvent) {
            userZoom = true;
            setShowCenterDot(true);
            setDotDrop(true);
          }
        }
      });
      mapRef.current.on("zoomend", () => {
        if (userZoom) {
          setDotDrop(false);
          userZoom = false;
        }
      });

      mapRef.current.on("pitch", () => {
        const pitch = mapRef.current.getPitch();
        setShow3DToggle(pitch !== 0);
        document.documentElement.style.setProperty(
          "--map-pitch-deg",
          `${pitch}deg`,
        );
      });

      mapRef.current.on("dragstart", () => {
        setShowCenterDot(true);
        setDotDrop(true);
      });

      mapRef.current.on("dragend", () => {
        const isMobile = window.innerWidth < 768;
        const dotPixel: [number, number] = isMobile
          ? [
              window.innerWidth / 2,
              (window.innerHeight * (1 - MOBILE_POPUPSHIFT_DVH / 100)) / 2,
            ]
          : [
              window.innerWidth / 2 + DESKTOP_POPUPSHIFT_LEFT,
              window.innerHeight / 2 + DESKTOP_POPUPSHIFT_TOP,
            ];

        // Wait for inertia to finish before bearing shift and dot drop.
        mapRef.current.once("moveend", () => {
          setDotDrop(false);
          if (
            mapRef.current.getPitch() === 0 &&
            mapRef.current.getZoom() > dotView
          ) {
            const { lng, lat } = mapRef.current.unproject(dotPixel);
            const bearing = getBearingByLocation(lng, lat);
            mapRef.current.easeTo({
              bearing,
              duration: 400,
              around: [lng, lat],
            });
            // Unproject after rotation so the padded-center pixel resolves correctly.
            mapRef.current.once("moveend", () => {
              const { lng: dLng, lat: dLat } =
                mapRef.current.unproject(dotPixel);
              setMapCenterLocation([dLng, dLat]);
            });
          } else {
            const { lng: dLng, lat: dLat } = mapRef.current.unproject(dotPixel);
            setMapCenterLocation([dLng, dLat]);
          }
        });
      });

      const priority = [
        "upcoming-outages",
        "stationDots", // low-zoom level dot layer
        "stationOutages",
        "mta-subway-stations-accessible",
        "mta-subway-complexes-accessible2",
        "transit-elevators",
        "outages",
        "mta-subway-stations-inaccessible",
      ];

      getADAPctByComplex();

      // One click listener for all interactive layers
      mapRef.current?.on("click", (e) => {
        const zoom = mapRef.current?.getZoom() ?? 0;
        let features;

        if (zoom < dotView) {
          // Give dots a slightly expanded tap area
          const buf = 6;
          const dotTap = mapRef.current?.queryRenderedFeatures(
            [
              [e.point.x - buf, e.point.y - buf],
              [e.point.x + buf, e.point.y + buf],
            ],
            { layers: ["stationDots"] },
          );
          features = dotTap?.length
            ? dotTap
            : mapRef.current?.queryRenderedFeatures(e.point, {
                layers: priority.filter((l) => l !== "stationDots"),
              });
        } else {
          // Dots are gone at zoom ≥ dotLevel; use the full priority list minus dots.
          features = mapRef.current?.queryRenderedFeatures(e.point, {
            layers: priority.filter((l) => l !== "stationDots"),
          });
        }

        const prioritizedFeature = pickTopFeature(features, priority, e.lngLat);

        if (!features || !features.length) return;

        // Augment the event object to look like a layer-specific event
        const augmentedEvent = {
          ...e,
          features: [prioritizedFeature],
        };

        const layerId = prioritizedFeature.layer.id;

        switch (layerId) {
          case "stationDots":
          case "stationOutages":
          case "mta-subway-stations-accessible":
          case "mta-subway-stations-inaccessible":
          case "mta-subway-stations-inaccessible-icon2":
            captureMapPosition();
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
              lastUpdatedRef.current,
              handleBack,
              userLocation,
            );
            break;

          case "mta-subway-complexes-accessible2":
            if (mapRef.current.getZoom() > 15) {
              captureMapPosition();
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
                lastUpdatedRef.current,
                handleBack,
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
                lastUpdatedRef.current,
                undefined,
                userLocation,
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
                true,
              );
            }
            break;

          default:
            break;
        }
      });

      // Track zoom level separately (one global listener)
      mapRef.current?.on("zoom", () => {
        const zoom = mapRef.current?.getZoom();
        setZoomLevel(zoom ?? 0);
        mapRef.current.setPaintProperty(
          "mta-subway-stations-accessible",
          "icon-opacity",
          ["step", ["zoom"], 0, dotView, 1, 15, 0],
        );
      });

      // Clear birdseye mode once any movement settles above dotView
      mapRef.current?.on("moveend", () => {
        if (isZoomedOutRef.current && mapRef.current?.getZoom() >= dotView) {
          isZoomedOutRef.current = false;
          setIsZoomedOut(false);
        }
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
            false,
          );
        });

        mapRef.current.on("mouseleave", "upcoming-outages", () => {
          hoveredFeatureId = handleMouseLeave(
            hoveredFeatureId,
            mapRef.current,
            onHoverPopupRef.current,
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

  // Clear map-center mode when the user taps the geolocate button
  useEffect(() => {
    if (locateSignal > 0) {
      setMapCenterLocation(null);
      setShowCenterDot(false);
    }
  }, [locateSignal]);

  // Drive --bottom-popup-h from actual rendered heights of both bottom popups.
  // ResizeObserver fires during CSS transitions so controls follow the panel smoothly.
  useEffect(() => {
    if (window.innerWidth >= 768) return;

    const cap = window.innerHeight * 0.4;
    const update = () => {
      const nearbyH = nearbyPanelEl?.getBoundingClientRect().height ?? 0;
      const onclickEl = document.querySelector(
        ".onclick-popup",
      ) as HTMLElement | null;
      const onclickH = onclickEl?.getBoundingClientRect().height ?? 0;
      const h = Math.min(Math.max(nearbyH, onclickH), cap);
      if (h > 0)
        document.documentElement.style.setProperty(
          "--bottom-popup-h",
          `${h}px`,
        );
    };

    const obs = new ResizeObserver(update);
    if (nearbyPanelEl) obs.observe(nearbyPanelEl);
    const onclickEl = document.querySelector(
      ".onclick-popup",
    ) as HTMLElement | null;
    if (onclickEl) obs.observe(onclickEl);

    update();
    return () => obs.disconnect();
  }, [stationPopupOpen, nearbyPanelState, nearbyPanelEl]);

  return (
    <>
      <AlertBanner
        alertData={systemAlerts}
        openStates={openStates}
        onClose={(index) => handleAlertClose(index, setOpenStates)}
      />

      <LegendDrawer
        {...elevatorStats}
        hasAlert={hasAlert}
        lastUpdated={lastUpdatedRef.current}
      />

      <SearchBar
        data={stationData}
        $hasAlert={hasAlert}
        map={mapRef.current}
        onStationSelect={(feature) => {
          captureMapPosition();
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
            lastUpdatedRef.current,
            handleBack,
          );
        }}
      />

      <div
        ref={mapContainer}
        id="map-container"
        className={`map-container${hasAlert ? " has-alert" : ""}`}
      />

      {showCenterDot && !stationPopupOpen && (
        <div
          className={`map-center-dot${dotDrop ? " floating" : ""}`}
          aria-hidden="true"
        />
      )}

      <NearbyStationsPopup
        userLocation={userLocation}
        overrideLocation={mapCenterLocation}
        elevatorData={elevatorDataState}
        stationData={stationDataState}
        upcomingElevatorData={upcomingRawData}
        stationPopupOpen={stationPopupOpen}
        locateSignal={locateSignal}
        onMinimizedChange={(v) => {
          nearbyMinimizedRef.current = v;
        }}
        onPanelStateChange={(s) => setNearbyPanelState(s)}
        onRef={(el) => setNearbyPanelEl(el)}
        onStationSelect={(feature, walkingToleranceMiles) => {
          captureMapPosition();
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
            lastUpdatedRef.current,
            handleBack,
            walkingToleranceMiles,
          );
        }}
        lastUpdated={lastUpdated}
      />

      {lastUpdated && (
        <div
          className="last-updated"
          style={{
            top: hasAlert ? "47px" : "4px",
            transition: "top 0.3s ease",
          }}
        >
          Last updated:{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      <div className="map-zoom-out">
        <button
          className="map-zoom-out-btn"
          aria-label={
            isZoomedOut
              ? "Return to previous view"
              : "Zoom out to see entire system"
          }
          title={isZoomedOut ? "Zoom back in" : "Zoom out"}
          onClick={() => {
            const map = mapRef.current as mapboxgl.Map;
            if (!map) return;

            if (isZoomedOutRef.current) {
              const pos = preZoomOutPositionRef.current;
              if (pos) {
                map.flyTo({
                  center: pos.center,
                  zoom: pos.zoom,
                  bearing: pos.bearing,
                  pitch: pos.pitch,
                  duration: 800,
                  essential: true,
                });
                map.once("moveend", () => {
                  const isMobile = window.innerWidth < 768;
                  const dotPixel: [number, number] = isMobile
                    ? [
                        window.innerWidth / 2,
                        (window.innerHeight *
                          (1 - MOBILE_POPUPSHIFT_DVH / 100)) /
                          2,
                      ]
                    : [
                        window.innerWidth / 2 + DESKTOP_POPUPSHIFT_LEFT,
                        window.innerHeight / 2 + DESKTOP_POPUPSHIFT_TOP,
                      ];
                  const { lng: dLng, lat: dLat } = map.unproject(dotPixel);
                  setMapCenterLocation([dLng, dLat]);
                });
              }
              setIsZoomedOut(false);
              isZoomedOutRef.current = false;
              return;
            }

            const { lng, lat } = map.getCenter();
            preZoomOutPositionRef.current = {
              center: [lng, lat],
              zoom: map.getZoom(),
              bearing: map.getBearing(),
              pitch: map.getPitch(),
            };

            cleanUpPopups();
            const bearing = setManhattanTilt();
            setStationView(null);
            setElevatorView(null);
            setIsZoomedOut(true);
            isZoomedOutRef.current = true;

            const isDesktop = window.innerWidth >= 768;
            map.flyTo({
              center: isDesktop ? BIRDSEYE_CENTER_DESKTOP : BIRDSEYE_CENTER,
              zoom: BIRDSEYE_ZOOM,
              pitch: 0,
              bearing: bearing,
              speed: 3.2,
              curve: 1.5,
              easing: (t: number) => Math.sin((t * Math.PI) / 2),
              padding: isDesktop
                ? {
                    top: Math.max(0, 2 * DESKTOP_POPUPSHIFT_TOP),
                    bottom: Math.max(0, -2 * DESKTOP_POPUPSHIFT_TOP),
                    left: Math.max(0, 2 * DESKTOP_POPUPSHIFT_LEFT),
                    right: 0,
                  }
                : {
                    top: 0,
                    bottom: Math.round(
                      (window.innerHeight * MOBILE_POPUPSHIFT_DVH) / 100,
                    ),
                    left: 0,
                    right: 0,
                  },
            });

            if (map.getLayer("active-complex-boundary-layer")) {
              map.setLayoutProperty(
                "active-complex-boundary-layer",
                "visibility",
                "none",
              );
            }

            map.once("moveend", () => {
              const isMobile = window.innerWidth < 768;
              const dotPixel: [number, number] = isMobile
                ? [
                    window.innerWidth / 2,
                    (window.innerHeight * (1 - MOBILE_POPUPSHIFT_DVH / 100)) /
                      2,
                  ]
                : [
                    window.innerWidth / 2 + DESKTOP_POPUPSHIFT_LEFT,
                    window.innerHeight / 2 + DESKTOP_POPUPSHIFT_TOP,
                  ];
              const { lng: dLng, lat: dLat } = map.unproject(dotPixel);
              setMapCenterLocation([dLng, dLat]);
            });
          }}
        >
          {isZoomedOut ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
        </button>
      </div>
      <>
        {/* Toggle floating on top of map, outside popup */}
        {show3DToggle && elevatorView && (
          <div
            className="show-3d-button-wrapper"
            style={{
              top: hasAlert ? "103px" : "60px",
              transition: "top 0.3s ease",
            }}
          >
            <Switch
              className="scale-75"
              defaultChecked
              onCheckedChange={(checked) => {
                if (!mapRef.current) return;
                const visibility = checked ? "visible" : "none";
                if (mapRef.current.getLayer("building-extrusion")) {
                  mapRef.current.setLayoutProperty(
                    "building-extrusion",
                    "visibility",
                    visibility,
                  );
                }
              }}
            />
            <span className="show-3d-button-label">3D Buildings</span>
          </div>
        )}
      </>
    </>
  );
};

export default MtaMap;
