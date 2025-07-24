// LIBRARIES & MAPBOX
import mapboxgl from "mapbox-gl";
import { getMtaMapOptions } from "./mtaMapOptions";
import React from "react";
import { createRoot } from "react-dom/client";
import { format, parse } from "date-fns";

// DATASETS
import customDataset from "@/resources/custom_dataset.json";
import mtaStationsDataset from "@/resources/mta_subway_stations_all.json";
import mtaComplexesDataset from "@/resources/mta_subway_complexes.json";

// FUNCTIONS
import {
  getAverageElevatorCoordinates,
  flyIn,
  showActiveComplexBoundary,
  getElevatorByNo,
  getElevatorsByComplexId,
  getElevatorsByStationId,
  concatenateADA,
  concatenateRoutes,
  getAreaOfComplex,
  concatenateInaccessibleRoutes
} from "@/utils/dataUtils";
import { stationIDToComplexID } from "@/utils/elevatorIndexUtils";

// POPUPS
import ElevatorPopup, {
  OnHoverElevatorPopup,
} from "../ElevatorPopup/ElevatorPopup";
import StationComplexPopup from "../StationPopup/StationPopup";

let currentPopup: mapboxgl.Popup | null = null;
let currentPopupRoot: Root | null = null;

export function setMapPitch(pitch: any) {
  return pitch as number;
}

export const initializeMtaMap = (mapRef, mapContainer) => {
  const mapRefPitch = setMapPitch(60);
  const mtaMapOptions = getMtaMapOptions(mapContainer.current, mapRefPitch);

  mapRef.current = new mapboxgl.Map(mtaMapOptions);
  // Add navigation controls
  // Zoom and bearing control
  const zoomControl = new mapboxgl.NavigationControl({
    visualizePitch: true,
  });

  mapRef.current.dragRotate.enable();
  mapRef.current.touchZoomRotate.enable();

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

function showPopup(coordinates, mapRef, popupRef, popupDiv, root) {
  popupRef.current
    .setLngLat(coordinates)
    .setDOMContent(popupDiv)
    .addTo(mapRef);

  // Track current root and popup
  if (currentPopup) currentPopup.remove();
  if (currentPopupRoot) currentPopupRoot.unmount();

  currentPopup = popupRef.current;
  currentPopupRoot = root;
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

// Converts date into a readable format (uses date-fns)
function convertDate(outageDate) {
  // format estimatedreturntoseervice into something readable
  const parsedDate = parse(outageDate, "MM/dd/yyyy hh:mm:ss a", new Date());
  const formattedDate = format(parsedDate, "EEE MMM d, yyyy 'at' h:mmaaa");
  return formattedDate;
}
// ---------------------------------------
// 🟦 Case 1: Single Elevator Popup
// ---------------------------------------
function handleElevatorClick(root: any, feature: any, elevatorData: any) {
  const {
    description_custom,
    image,
    title,
    linesServed,
    elevatorno,
    directionLabel,
    isStreet,
  } = feature.properties;

  const outage = elevatorData.find(
    (outElevator: any) => outElevator.elevatorNo === elevatorno
  );
  // format estimatedreturntoseervice into something readable
  const rawDate = outage?.estimatedReturn;
  let formattedDate = null;
  if (rawDate) {
    formattedDate = convertDate(rawDate);
  }

  root.render(
    <ElevatorPopup
      title={title}
      description_custom={description_custom}
      imageUrl={image}
      elevatorno={elevatorno}
      linesServed={linesServed}
      estimatedreturntoservice={formattedDate}
      directionLabel={directionLabel}
      isStreet={isStreet}
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
  stationView, 
  setStationView, 
  elevatorView, 
  setElevatorView, 
  show3DToggle, 
  setShow3DToggle) {

  mapRef.setLayoutProperty("building-extrusion", "visibility", "visible");

  const { complex_id, name, ada, route } = feature.properties;


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
    if (stationIDs.length > 1) routes = station.properties.daytime_routes || "";
    const note = station.properties.ada_notes.trim();
    return `${routes} ${note}`;
  })

  .filter((entry) => entry) // remove null or empty
  .join(", ");


  const inaccessibleRoutes = concatenateInaccessibleRoutes(stationIDs, mtaStationsDataset);

  const elevatorsAtComplex = getElevatorsByComplexId(complex_id);

  const totalElevators = elevatorsAtComplex.length;

  let elevatorArray = elevatorsAtComplex.map((elevator) => {
    const elevatorno = elevator.properties.elevatorno;
    const matchedOutage = elevatorData.find(
      (out) => out.elevatorNo === elevatorno
    );

    // format estimatedreturntoseervice into something readable
    const rawDate = matchedOutage?.estimatedReturn;
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
      estimatedReturn: formattedDate || "null",
      totalElevators: totalElevators,
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
    flyIn(mapRef, complex_id, average, false, false, stationView, setStationView);
  } else {
      // Accessible → fit bounds. true for popup flag (there's a popup)
      flyIn(mapRef, complex_id, bounds, true, true, stationView, setStationView);
  }
  // Popup render
  root.render(
    <StationComplexPopup
      ada={ada}
      route={route}
      inaccessibleRoutes={inaccessibleRoutes}
      ada_notes={ada_notes}
      complexID={complex_id}
      complexName={name}
      elevators={elevatorArray}
      totalElevators={totalElevators}
      map={mapRef}
      stationView={stationView}
      setStationView={setStationView} // in-popup button to look at elevators leaves station view
      elevatorView={elevatorView}
      setElevatorView={setElevatorView}
      show3DToggle={show3DToggle}
      setShow3DToggle={setShow3DToggle}
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
    console.warn("No complex_id found or inferred from station feature:", feature);
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
  const route = concatenateRoutes(stationIDs, mtaStationsDataset);  // concatenate route info for complex
  const inaccessibleRoutes = concatenateInaccessibleRoutes(stationIDs, mtaStationsDataset);
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
  stationView: any,
  setStationView: any,
  elevatorView,
  setElevatorView,
  show3DToggle,
  setShow3DToggle
) {
  if (!feature || feature.length === 0) return;

  const station_id = feature.properties.station_id;
  const complex_id = feature.properties.complex_id;
  const coordinates = feature.geometry.coordinates.slice();

  // Avoid duplicate station setting
  setStationView((prev: any) => (prev !== station_id ? station_id : prev));

  // Fix map wrap-around
  while (Math.abs(feature.geometry.coordinates[0] - coordinates[0]) > 180) {
    coordinates[0] += feature.geometry.coordinates[1] > coordinates[0] ? 360 : -360;
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
  const inaccessibleRoutes = concatenateInaccessibleRoutes(stationIDs, mtaStationsDataset);
  const ada = concatenateADA(stationIDs, mtaStationsDataset); // add concatenated ADA info for complex
  const ada_notes = feature.properties.ada_notes;

  // Mimic the matching complex feature (and add to it)
  const complexFeature = {
    ...matchingComplex,
    properties: {
      ...matchingComplex.properties,
      route,
      ada,
      ada_notes,
      inaccessibleRoutes,
    },
    layer: { id: "mta-subway-complexes-accessible" },
  };

  handleStationComplexClick(
    root,
    complexFeature,
    mapRef,
    elevatorData,
    stationView,
    setStationView,
    elevatorView,
    setElevatorView,
    show3DToggle,
    setShow3DToggle
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
  stationView,
  setStationView,
  elevatorView,
  setElevatorView,
  show3DToggle,
  setShow3DToggle
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
    handleElevatorClick(root, feature, elevatorData);
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

    handleElevatorClick(root, elevatorFeature, elevatorData);
    showPopup(
      matchingElevator.geometry.coordinates,
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

    const complexFeature = handleStationClick(stationFeature);

    
    handleStationComplexClick(root, complexFeature, mapRef, elevatorData, stationView, setStationView, elevatorView, setElevatorView, show3DToggle, setShow3DToggle);
    showPopup(
      complexFeature.geometry.coordinates,
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
    handleStationComplexClick(root, complexFeature, mapRef, elevatorData, stationView, setStationView, elevatorView, setElevatorView, show3DToggle, setShow3DToggle);
    showPopup(coordinates, mapRef, onClickPopupRef, popupDiv, root);
  }

  if (layerId === "mta-subway-complexes-accessible2") {
    handleStationComplexClick(root, feature, mapRef, elevatorData, stationView, setStationView, elevatorView, setElevatorView, show3DToggle, setShow3DToggle);
    showPopup(coordinates, mapRef, onClickPopupRef, popupDiv, root);
  }

  return;
}

export function handleMouseLeave(
  hoveredFeatureId: any,
  mapRef: any,
  onHoverPopupRef: any
) {
  if (hoveredFeatureId !== null) {
    mapRef.setFeatureState(
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
export function handleMouseMove(
  e: any,
  hoveredFeatureId: any,
  mapRef: any,
  onHoverPopupRef: any
) {
  if (e.features.length > 0) {
    // Change opacity of elevator icon to indicate hover
    if (hoveredFeatureId !== null) {
      mapRef.setFeatureState(
        {
          source: "composite",
          sourceLayer: "transit_elevators",
          id: hoveredFeatureId,
        },
        { hover: false }
      );
    }
    hoveredFeatureId = e.features[0].id;
    mapRef.setFeatureState(
      {
        source: "composite",
        sourceLayer: "transit_elevators",
        id: hoveredFeatureId,
      },
      { hover: true }
    );

    // Display popup with image and information about the elevator
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
      .addTo(mapRef);
  }
  return hoveredFeatureId;
}
