// LIBRARIES & MAPBOX
import mapboxgl from "mapbox-gl";
import { getMtaMapOptions } from "./mtaMapOptions";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { createFocusTrap } from "focus-trap";

// DATASETS
import customDataset from "@/resources/custom_elevator_dataset.json";
import mtaStationsDataset from "@/resources/mta_subway_stations_all.json";
import mtaComplexesDataset from "@/resources/generated/mta_subway_complexes.json";

// FUNCTIONS
import {
  convertDate,
  getAverageElevatorCoordinates,
  flyIn,
  getElevatorByNo,
  getElevatorsByComplexId,
  getElevatorsByStationId,
  concatenateADA,
  concatenateRoutes,
  getAreaOfComplex,
  concatenateInaccessibleRoutes,
  getStationOutageLayerFeatures,
  getComplexOutageLayerFeatures,
  convertDateDistance,
  easyToReadDate,
} from "@/utils/dataUtils";
import { stationIDToComplexID } from "@/utils/elevatorIndexUtils";

// POPUPS
import ElevatorPopup, {
  OnHoverElevatorPopup,
} from "../ElevatorPopup/ElevatorPopup";
import StationComplexPopup from "../StationPopup/StationPopup";
import { formatDate } from "date-fns";

let currentPopup: mapboxgl.Popup | null = null;
let currentPopupRoot: Root | null = null;

export function setMapPitch(pitch: any) {
  return pitch as number;
}

export const initializeMtaMap = (mapRef, mapContainer) => {
  const mapRefPitch = setMapPitch(0);
  const mtaMapOptions = getMtaMapOptions(mapContainer.current, mapRefPitch);

  mapRef.current = new mapboxgl.Map(mtaMapOptions);
  // Add navigation controls
  // Zoom and bearing control
  const zoomControl = new mapboxgl.NavigationControl({
    visualizePitch: true,
    showZoom: false,
  });

  mapRef.current.dragRotate.enable();
  mapRef.current.touchZoomRotate.enable();

  mapRef.current.addControl(zoomControl, "bottom-right");

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

let lastFocusedElementBeforePopup: HTMLElement | null = null;

export function showPopup(
  coordinates: mapboxgl.LngLatLike,
  mapRef: mapboxgl.Map,
  popupRef: React.RefObject<mapboxgl.Popup>,
  popupDiv: HTMLElement,
  root: { unmount: () => void }
) {
  // Store what had focus before opening
  lastFocusedElementBeforePopup =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  // Make popup accessible
  popupDiv.setAttribute("role", "dialog");
  popupDiv.setAttribute("aria-modal", "true");
  popupDiv.tabIndex = -1; // Make the container focusable

  // Add popup to map
  if (!popupRef.current) return;
  popupRef.current.setLngLat(coordinates).setDOMContent(popupDiv).addTo(mapRef);

  // Remove previous popup
  if (currentPopup) currentPopup.remove();
  if (currentPopupRoot) currentPopupRoot.unmount();

  currentPopup = popupRef.current;
  currentPopupRoot = root;

  // Focus trap setup
  const focusableSelectors =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusableEls: HTMLElement[] = Array.from(
    popupDiv.querySelectorAll<HTMLElement>(focusableSelectors)
  );

  function trapFocus(e: KeyboardEvent) {
    if (e.key !== "Tab") return;

    // Only include elements that can be focused
    const focusable = focusableEls.filter(
      (el) => !("disabled" in el && (el as HTMLButtonElement).disabled)
    );
    if (!focusable.length) return;

    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  }

  popupDiv.addEventListener("keydown", trapFocus);

  // Move focus into popup
  if (focusableEls.length) {
    focusableEls[0].focus();
  } else {
    popupDiv.focus();
  }

  // Cleanup function when popup closes
  function cleanup() {
    popupDiv.removeEventListener("keydown", trapFocus);
    if (lastFocusedElementBeforePopup) lastFocusedElementBeforePopup.focus();
  }

  // Listen for close event from Mapbox popup
  popupRef.current.on("close", cleanup);
}

export function cleanUpPopups() {
  // clean up any old popups
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
  if (currentPopupRoot) {
    currentPopupRoot.unmount();
    currentPopupRoot = null;
  }
}

function addDynamicProperties(complexFeature, stationData) {
  const outageInfo = getComplexOutageLayerFeatures(stationData); // includes the isOut, isProblem properties
  const match = outageInfo.find(
    (f) => f.properties.complex_id === complexFeature.properties.complex_id
  );
  if (match) {
    complexFeature.properties.isOut = match.properties.isOut;
    complexFeature.properties.isProblem = match.properties.isProblem;
  }
  return complexFeature;
}
// ---------------------------------------
// 🟦 Case 1: Single Elevator Popup
// ---------------------------------------
function handleElevatorClick(
  root: any,
  feature: any,
  elevatorData: any,
  upcomingElevatorData: any,
  lastUpdated: any
) {
  const {
    ada,
    description_custom,
    image,
    title,
    linesServed,
    elevatorno,
    directionLabel,
    isStreet,
  } = feature.properties;

  const popupKey = lastUpdated?.toISOString() || ""; // triggers re-render of the popup

  const outage = elevatorData.find(
    (outElevator: any) => outElevator.elevatorNo === elevatorno
  );
  // format estimatedreturntoservice into something readable
  const rawDate = outage?.estimatedreturntoservice;
  let formattedDate = null;
  if (rawDate) {
    formattedDate = convertDate(rawDate);
  }

  const upcomingOutage = upcomingElevatorData?.find(
    (el) => el.equipment === elevatorno
  );

  const filteredOutage = Array.isArray(upcomingOutage)
    ? upcomingOutage.map((o) => ({
        reason: o.reason,
        outageDate: o.outagedate,
        estimatedreturntoservice: o.estimatedreturntoservice?.trim() || null,
        outageDuration: o.outageDuration || null,
      }))
    : upcomingOutage
    ? [
        {
          reason: upcomingOutage.reason,
          outageDate: upcomingOutage.outagedate,
          estimatedreturntoservice:
            upcomingOutage.estimatedreturntoservice?.trim() || null,
          outageDuration: upcomingOutage.outageDuration || null,
        },
      ]
    : [];

  root.render(
    <ElevatorPopup
      ada={ada}
      key={popupKey}
      title={title}
      description_custom={description_custom}
      imageURL={image}
      elevatorno={elevatorno}
      linesServed={linesServed}
      estimatedreturntoservice={formattedDate}
      directionLabel={directionLabel}
      isStreet={isStreet}
      lastUpdated={lastUpdated}
      isUpcomingOutage={filteredOutage}
    />
  );
}

// ---------------------------------------
// 🟫 Case 2: Station Complex Popup
// ---------------------------------------
function handleStationComplexClick(
  root,
  feature,
  mapRef,
  elevatorData,
  upcomingElevatorData,
  stationView,
  setStationView,
  elevatorView,
  setElevatorView,
  show3DToggle,
  setShow3DToggle,
  lastUpdated
) {
  mapRef.setLayoutProperty("building-extrusion", "visibility", "visible");

  const { complex_id, stop_name, ada, route, isOut, isProblem } =
    feature.properties;

  const stationIDsRaw = feature.properties.station_ids;
  const stationIDs = stationIDsRaw.split("/").map((id: string) => id.trim());

  // custom ada note based off of all the station ada notes
  const ada_notes = stationIDs
    .map((stationID) => {
      const station = mtaStationsDataset.features.find(
        (f: any) => f.properties.station_id === stationID
      );
      if (!station || !station.properties.ada_notes) return null;
      let routes = "";
      if (stationIDs.length > 1)
        routes = station.properties.daytime_routes || "";
      const note = station.properties.ada_notes.trim();
      return `${routes} ${note}`;
    })

    .filter((entry) => entry) // remove null or empty
    .join(", ");

  const inaccessibleRoutes = concatenateInaccessibleRoutes(
    stationIDs,
    mtaStationsDataset
  );

  const elevatorsAtComplex = getElevatorsByComplexId(complex_id);

  let totalElevators = 0;
  let totalRamps = 0;

  elevatorsAtComplex.forEach((el) => {
    const num = String(el?.properties?.elevatorno || "").toLowerCase();

    if (num.startsWith("ra")) {
      totalRamps++;
    } else {
      totalElevators++;
    }
  });

  let elevatorArray = elevatorsAtComplex.map((elevator) => {
    const elevatorno = elevator.properties.elevatorno;
    const matchedOutage = elevatorData.find(
      (out) => out.elevatorNo === elevatorno
    );

    const upcomingOutage = upcomingElevatorData?.find(
      (el) => el.equipment === elevatorno
    );

    const filteredOutage = upcomingOutage
      ? {
          reason: upcomingOutage.reason,
          outageDate: convertDate(upcomingOutage?.outagedate),
          estimatedreturntoservice:
            convertDate(upcomingOutage.estimatedreturntoservice?.trim()) ||
            null,
          outageDuration:
            convertDateDistance(
              upcomingOutage?.outagedate,
              upcomingOutage?.estimatedreturntoservice
            ) || "null",
        }
      : null;

    // format estimatedreturntoseervice into something readable
    const rawDate = matchedOutage?.estimatedreturntoservice;
    let formattedDate = null;
    if (rawDate) {
      formattedDate = convertDate(rawDate);
    }

    return {
      ...elevator.properties,
      ...elevator.geometry,
      directionLabel: elevator.properties.directionLabel,
      isStreet: elevator.properties.isStreet,
      imageURL: elevator.properties.image,
      isOut: Boolean(matchedOutage),
      estimatedreturntoservice: formattedDate || "null",
      totalElevators: totalElevators,
      totalRamps: totalRamps,
      isUpcomingOutage: filteredOutage || [],
    };
  });

  // Sort: street → uptown → downtown
  elevatorArray = elevatorArray.sort((a, b) => {
    const directionOrder = (el) => {
      const dir = el?.directionLabel?.toLowerCase() || "";
      if (el?.isStreet === "true" || el?.isStreet === true) return 0;
      if (
        dir.includes("uptown") ||
        dir.includes("northbound") ||
        dir.includes("queens") ||
        dir.includes("bronx") ||
        dir.includes("woodlawn")
      )
        return 1;
      if (
        dir.includes("downtown") ||
        dir.includes("southbound") ||
        dir.includes("brooklyn") ||
        dir.includes("manhattan")
      )
        return 2;
      return 3;
    };
    return directionOrder(a) - directionOrder(b);
  });

  // Accessible:
  const { average, bounds } = getAverageElevatorCoordinates(
    customDataset.features,
    complex_id
  ); // returns { average, bounds }

  // flyIn expects either coords or bounds depending on accessibility (coords for inaccessible, bounds for elevators)
  if (ada === "0") {
    // Inaccessible → flyTo the adjustedCenter point. false for popupFlag (there's no popup)
    flyIn(
      mapRef,
      stationIDs,
      complex_id,
      average,
      false,
      false,
      stationView,
      setStationView
    );
  } else {
    // Accessible → fit bounds. true for popup flag (there's a popup)
    flyIn(
      mapRef,
      stationIDs,
      complex_id,
      bounds,
      true,
      true,
      stationView,
      setStationView
    );
  }
  // Popup render
  root.render(
    <StationComplexPopup
      ada={ada}
      route={route}
      inaccessibleRoutes={inaccessibleRoutes}
      ada_notes={ada_notes} // station ADA notes
      complexID={complex_id}
      complexName={stop_name}
      elevators={elevatorArray}
      totalElevators={totalElevators}
      totalRamps={totalRamps}
      map={mapRef}
      stationView={stationView}
      setStationView={setStationView} // in-popup button to look at elevators leaves station view
      elevatorView={elevatorView}
      setElevatorView={setElevatorView}
      show3DToggle={show3DToggle}
      setShow3DToggle={setShow3DToggle}
      lastUpdated={lastUpdated}
      isOut={isOut}
      isProblem={isProblem}
    />
  );

  getAreaOfComplex(complex_id, mapRef, true); // true shows the complex boundary highlight, false does not
}

// ---------------------------------------
// 🟩 Case 3: Station Click (triggers Station Complex Click)
// ---------------------------------------
function handleStationClick(feature: any) {
  let { complex_id } = feature.properties;

  // Fallback: Try to find complex_id if missing
  if (!complex_id && feature.properties.station_id) {
    const possibleIDs = feature.properties.station_id
      .split("/")
      .map((id: string) => id.trim());

    const foundComplexID = possibleIDs
      .map((id: string) => stationIDToComplexID.get(id))
      .find((cid) => cid !== undefined);

    complex_id = foundComplexID;
  }

  if (!complex_id) {
    console.warn(
      "No complex_id found or inferred from station feature:",
      feature
    );
    return;
  }

  const matchingComplex = mtaComplexesDataset.features.find(
    (f: any) => f.properties?.complex_id === complex_id
  );

  if (!matchingComplex) {
    console.warn("No matching complex found for complex_id:", complex_id);
    return;
  }

  const stationIDsRaw = matchingComplex.properties.station_ids || "";
  const stationIDs = stationIDsRaw.split("/").map((id: string) => id.trim());
  const route = concatenateRoutes(stationIDs, mtaStationsDataset); // concatenate route info for complex
  const inaccessibleRoutes = concatenateInaccessibleRoutes(
    stationIDs,
    mtaStationsDataset
  );
  const ada = concatenateADA(stationIDs, mtaStationsDataset); // concatenate ADA info for complex
  const ada_notes = feature.properties.ada_notes;

  // Mimic the matching complex feature (and add to it)
  const complexFeature = {
    ...matchingComplex,
    properties: {
      ...matchingComplex.properties,
      route, // add concatenated route of all stations at complex
      ada, // add concatenated ADA info
      ada_notes,
      inaccessibleRoutes,
    },
    layer: { id: "mta-subway-complexes-accessible" },
  };

  return complexFeature;
}

export function handleSearchPopup(
  feature: any,
  onClickPopupRef: any,
  mapRef,
  elevatorData: any,
  upcomingElevatorData: any,
  stationData: any,
  stationView: any,
  setStationView: any,
  elevatorView,
  setElevatorView,
  show3DToggle,
  setShow3DToggle,
  lastUpdated
) {
  if (!feature || feature.length === 0) return;

  const station_id = feature.properties.station_id;
  const complex_id = feature.properties.complex_id;
  const coordinates = feature.geometry.coordinates.slice();

  // Avoid duplicate station setting
  setStationView((prev: any) => (prev !== station_id ? station_id : prev));

  // Fix map wrap-around
  while (Math.abs(feature.geometry.coordinates[0] - coordinates[0]) > 180) {
    coordinates[0] +=
      feature.geometry.coordinates[1] > coordinates[0] ? 360 : -360;
  }

  cleanUpPopups();
  const popupDiv = document.createElement("div");
  document.body.appendChild(popupDiv);
  const root = createRoot(popupDiv);

  const matchingComplex = mtaComplexesDataset.features.find(
    (f: any) => f.properties?.complex_id === complex_id
  );

  if (!matchingComplex) {
    console.warn("No matching complex found for complex_id:", complex_id);
    return;
  }

  const stationIDsRaw = matchingComplex.properties.station_ids || "";
  const stationIDs = stationIDsRaw.split("/").map((id: string) => id.trim());
  const route = concatenateRoutes(stationIDs, mtaStationsDataset); // add concatenated route info for complex
  const inaccessibleRoutes = concatenateInaccessibleRoutes(
    stationIDs,
    mtaStationsDataset
  );
  const ada = concatenateADA(stationIDs, mtaStationsDataset); // add concatenated ADA info for complex
  const ada_notes = feature.properties.ada_notes;

  const complexFeature = handleStationClick(feature);
  const dynamicComplexFeature = addDynamicProperties(
    complexFeature,
    stationData
  );

  handleStationComplexClick(
    root,
    dynamicComplexFeature,
    mapRef,
    elevatorData,
    upcomingElevatorData,
    stationView,
    setStationView,
    elevatorView,
    setElevatorView,
    show3DToggle,
    setShow3DToggle,
    lastUpdated
  );

  showPopup(coordinates, mapRef, onClickPopupRef, popupDiv, root);
}

//---------------------------------------
// Handler function for all clicks on map
// ---------------------------------------
export function handleOnClick(
  e: any,
  onClickPopupRef: any,
  mapRef: any,
  elevatorData: any,
  upcomingElevatorData: any,
  stationData: any,
  stationView,
  setStationView,
  elevatorView,
  setElevatorView,
  show3DToggle,
  setShow3DToggle,
  lastUpdated
) {
  if (!e.features || e.features.length === 0) return;

  const feature = e.features[0];
  const layerId = feature.layer.id;
  const coordinates = feature.geometry.coordinates.slice();

  // Fix for map wrap
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  cleanUpPopups();
  const popupDiv = document.createElement("div");
  document.body.appendChild(popupDiv);
  const root = createRoot(popupDiv);

  // If it's an elevator, show one elevator popup
  if (layerId === "transit-elevators") {
    handleElevatorClick(
      root,
      feature,
      elevatorData,
      upcomingElevatorData,
      lastUpdated
    );
    showPopup(coordinates, mapRef, onClickPopupRef, popupDiv, root);
  }

  // if it's the elevator outage symbol that was clicked, also show the elevator popup (makes it all more clickable)
  if (layerId === "outages") {
    const outageElevatorNo = feature.properties.elevatorno;

    // Try to find the matching elevator feature from customDataset
    const matchingElevator = customDataset.features.find(
      (f: any) =>
        f.properties.elevatorno?.toLowerCase() ===
        outageElevatorNo?.toLowerCase()
    );

    if (!matchingElevator) {
      console.warn(
        "No matching elevator found for",
        outageElevatorNo,
        "in dataset"
      );
      return;
    }

    // simulate a click on the transit-elevators layer
    const elevatorFeature = {
      ...matchingElevator,
      layer: { id: "transit-elevators" },
    };

    handleElevatorClick(
      root,
      elevatorFeature,
      elevatorData,
      upcomingElevatorData,
      lastUpdated
    );
    showPopup(
      matchingElevator.geometry.coordinates as [number, number],
      mapRef,
      onClickPopupRef,
      popupDiv,
      root
    );
  }

  // if it's the station-outage symbol that was clicked, also show the station popup (makes it all more clickable)
  if (layerId === "stationOutages") {
    const station_id = feature.properties.station_id;

    setStationView((prev) => {
      if (prev !== station_id) {
        return station_id;
      }
      return prev; // no change
    });

    // Try to find the matching elevator feature from mtaStationsDataset
    const matchingStation = mtaStationsDataset.features.find(
      (f: any) => f.properties.station_id === station_id
    );

    if (!matchingStation) {
      console.warn(
        "No matching station found for",
        matchingStation,
        "in MTA dataset"
      );
      return;
    }

    // simulate a click on the stations, which simulates a click on the complexes layer
    const stationFeature = {
      ...matchingStation,
      layer: { id: "mta-subway-stations-accessible" },
    };

    const complexFeature = handleStationClick(feature);
    const dynamicComplexFeature = addDynamicProperties(
      complexFeature,
      stationData
    );

    handleStationComplexClick(
      root,
      dynamicComplexFeature,
      mapRef,
      elevatorData,
      upcomingElevatorData,
      stationView,
      setStationView,
      elevatorView,
      setElevatorView,
      show3DToggle,
      setShow3DToggle,
      lastUpdated
    );
    showPopup(
      complexFeature.geometry.coordinates as [number, number],
      mapRef,
      onClickPopupRef,
      popupDiv,
      root
    );
  }

  // if it's the station layer that was clicked, simulate a complex being clicked
  if (layerId === "mta-subway-stations-accessible") {
    const station_id = feature.properties.station_id;
    setStationView((prev) => {
      if (prev !== station_id) {
        return station_id;
      }
      return prev; // no change
    });

    const complexFeature = handleStationClick(feature);
    const dynamicComplexFeature = addDynamicProperties(
      complexFeature,
      stationData
    );
    handleStationComplexClick(
      root,
      dynamicComplexFeature,
      mapRef,
      elevatorData,
      upcomingElevatorData,
      stationView,
      setStationView,
      elevatorView,
      setElevatorView,
      show3DToggle,
      setShow3DToggle,
      lastUpdated
    );
    showPopup(coordinates, mapRef, onClickPopupRef, popupDiv, root);
  }

  if (layerId === "mta-subway-complexes-accessible2") {
    handleStationComplexClick(
      root,
      feature,
      mapRef,
      elevatorData,
      upcomingElevatorData,
      stationView,
      setStationView,
      elevatorView,
      setElevatorView,
      show3DToggle,
      setShow3DToggle,
      lastUpdated
    );
    showPopup(coordinates, mapRef, onClickPopupRef, popupDiv, root);
  }

  if (
    layerId === "mta-subway-stations-inaccessible" ||
    layerId === "mta-subway-stations-inaccessible-icon2"
  ) {
    const complexFeature = handleStationClick(feature);
    const dynamicComplexFeature = addDynamicProperties(
      complexFeature,
      stationData
    );
    handleStationComplexClick(
      root,
      dynamicComplexFeature,
      mapRef,
      elevatorData,
      upcomingElevatorData,
      stationView,
      setStationView,
      elevatorView,
      setElevatorView,
      show3DToggle,
      setShow3DToggle,
      lastUpdated
    );
    showPopup(coordinates, mapRef, onClickPopupRef, popupDiv, root);
  }

  return;
}

// HOVER POPUP STUFF

export function removeHoverPopup(onHoverPopupRef: any) {
  if (onHoverPopupRef) {
    onHoverPopupRef.remove();
    if (onHoverPopupRef.hasOwnProperty("current")) {
      onHoverPopupRef.current = null;
    }
  }
}

let popupTimeout: NodeJS.Timeout | null = null;

export function handleMouseLeave(
  hoveredFeatureId: any,
  mapRef: any,
  onHoverPopupRef: any
) {
  if (hoveredFeatureId !== null) {
    mapRef.setFeatureState(
      {
        source: "upcoming-outage-data",
        id: hoveredFeatureId,
      },
      { hover: false }
    );
  }
  hoveredFeatureId = null;

  // Clear any previous timers
  if (popupTimeout) {
    clearTimeout(popupTimeout);
  }

  // Delay removal a little
  popupTimeout = setTimeout(() => {
    removeHoverPopup(onHoverPopupRef);
  }, 50);

  return hoveredFeatureId;
}

export function handlePopupEvent(
  e: any,
  hoveredFeatureId: any,
  mapRef: any,
  onHoverPopupRef: any,
  isClick: boolean = false
) {
  if (popupTimeout) {
    clearTimeout(popupTimeout);
    popupTimeout = null;
  }

  if (e.features.length > 0) {
    if (hoveredFeatureId !== null) {
      mapRef.setFeatureState(
        { source: "upcoming-outage-data", id: hoveredFeatureId },
        { hover: false }
      );
    }

    hoveredFeatureId = e.features[0].layer.id;

    mapRef.setFeatureState(
      { source: "upcoming-outage-data", id: hoveredFeatureId },
      { hover: true }
    );

    const props = e.features[0].properties;
    const matchingElevatorFeature = getElevatorByNo(props.elevatorno);
    const coordinates = e.features[0].geometry.coordinates.slice();

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDiv = document.createElement("div");
    const root = createRoot(popupDiv);
    root.render(
      <OnHoverElevatorPopup
        date={easyToReadDate(props.outageDate)}
        reason={props.reason}
        isStreet={matchingElevatorFeature.properties.isStreet}
        station={matchingElevatorFeature.properties.title}
      />
    );

    const showPopup = () => {
      onHoverPopupRef
        .setLngLat(coordinates)
        .setDOMContent(popupDiv)
        .addTo(mapRef);
    };

    if (isClick) {
      showPopup(); // immediate on tap
    } else {
      popupTimeout = setTimeout(showPopup, 50); // slight delay on hover
    }
  }

  return hoveredFeatureId;
}
