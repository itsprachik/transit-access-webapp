import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import { getOutageLayerFeatures, getUpcomingOutages } from "@/utils/dataUtils";
import dotenv from "dotenv";
import { createRoot } from "react-dom/client";
import ElevatorPopup, {
  OnHoverElevatorPopup,
} from "./ElevatorPopup/ElevatorPopup";
import outageGeojson from "../resources/elevatorOutagesDataset.geojson";
import mapboxStyle from "@/styles/mapbox-style.json";
let icon = true;

// Load environment variables
dotenv.config();

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    /**
     * @deprecated since version 1.0.0. Use MtaMap instead.
     */

export default function Map() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  let elevOut = [];
  const [elevatorOutages, setElevatorOutages] = useState([]);
  const [upcomingOutages, setUpcomingOutages] = useState([]);

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

  const getOutElevatorNumbers = (elOutages) => {
    const outElevatorNoArray = [];
    if (elOutages.length !== 0) {
      elOutages?.forEach((equip) => {
        if (equip.equipmenttype == "EL" && equip.isupcomingoutage == "N") {
          outElevatorNoArray.push(equip.equipment);
        }
      });
      return outElevatorNoArray;
    }
  };

  const updateOutageLayer = (data) => {
    const outageElevatorNos = getOutElevatorNumbers(data);
    const features = getOutageLayerFeatures(outageElevatorNos);
    const geojsonSource = mapRef.current?.getSource("outage-data");
    geojsonSource?.setData({
      type: "FeatureCollection",
      features: features,
    });
  };

  // Initializing your map here ensures that Mapbox GL JS will not try to render a map before React creates the element that contains the map.
  useEffect(() => {
    async function getOutages() {
      let data = await fetchOutages(apiKey);
      elevOut = data;
      setElevatorOutages(data);
      getOutElevatorNumbers(elevOut)
    }

    // Ensure mapContainer is available
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/joelaaron/clndls6cm07rp01mae34gd2oo",
        center: [-73.98365318925187, 40.7583063693059], // NYC
        zoom: 13,
      });

      // Add navigation controls
      // Zoom and bearing control
      const zoomControl = new mapboxgl.NavigationControl();
      mapRef.current.addControl(zoomControl, "bottom-left"); // Add the control to the top-right corner of the map

      // GeoLocate
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      });
      mapRef.current.addControl(geolocateControl, "bottom-right");

      // Load custom icons (checkmark and X)
      mapRef.current.on("style.load", () => {
        mapRef.current.loadImage(
          "./symbols/checkmark-icon1a.png",
          (error, image) => {
            if (error) throw error;
            mapRef.current.addImage("checkmark-icon", image);
          }
        );

        mapRef.current.loadImage("./symbols/x-icon1a.png", (error, image) => {
          if (error) throw error;
          mapRef.current.addImage("x-icon", image);
        });

        mapRef.current.addSource("outage-data", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
          dynamic: true,
          generateId: true,
        });
        if (elevOut.length > 0) {
          updateOutageLayer(elevOut)
        }

        // Add outage layer with icons based on isBroken property
        mapRef.current.addLayer({
          id: "outages",
          source: "outage-data",
          type: "symbol", // Using symbol type for icon display
          layout: {
            "icon-image": [
              "case",
              ["==", ["get", "isBroken"], false], // If elevator is working
              "liftgood", // Use checkmark icon
              ["==", ["get", "isBroken"], true], // If elevator is broken
              "liftbad", // Use X icon
              "liftgood", // Default to checkmark icon in case of missing data
            ],
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10,
              0.7,
              15,
              0.9,
              19,
              1,
            ],
            "icon-anchor": "center",
            //    "text-anchor": "right",
            "icon-offset": [0, -20],
            "icon-allow-overlap": true,
            "icon-padding": 2,
            "symbol-z-order": "auto",
            "symbol-sort-key": 1,

            "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 22, 10],
            "text-radial-offset": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              1.2,
              17,
              2,
            ],

            "text-padding": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0,
              15,
              0,
              16,
              2,
            ],
            "text-offset": [1.5, 0],
            //"icon-rotate": 0, // Ensure icons are not rotated
          },

          //   "paint": {"icon-translate": [0, -30]},
          // before: "transit-elevators" // Ensure this layer is added below the elevator layer
          sprite:
            "mapbox://sprites/joelaaron/clndls6cm07rp01mae34gd2oo/ehu96mappgo0oqnlwfjrnz4ta", // Replace with your actual sprite URL
        });

        let hoveredFeatureId = null;

        mapRef.current.on("load", function () {
          mapRef.current.setLayoutProperty(
            "transit-elevators",
            "visibility",
            "visible"
          );
        });

        mapRef.current.on("zoom", function () {
          mapRef.current.setLayoutProperty(
            "transit-elevators",
            "visibility",
            "visible"
          );
        });

        // On hover event
        mapRef.current?.on("mousemove", "transit-elevators", (e) => {
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
        });

        mapRef.current?.on("mouseleave", "transit-elevators", (e) => {
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
        });

        //  Click event to display pop-up ***
        mapRef.current?.on("click", "transit-elevators", (e) => {
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
                icon={icon}
              />
            );
            onClickPopupRef.current
              .setLngLat(coordinates)
              .setDOMContent(popupDiv)
              .addTo(mapRef.current);
          }
        });

        mapRef.current.on("load", function () {
          // Ensure transit-elevators is always on top of outage layer
          mapRef.current.moveLayer("outages", "transit-elevators");
        });
      });
    }

    // Fetch outages on component mount
    getOutages();

    // Set up an interval to fetch outages every 120 seconds.
    const intervalId = setInterval(getOutages, 120000);
    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
    // Comment out above interval lines of code when developing to prevent api calls just in case there is a cap for the amount of requests the MTA allows
  }, []);

  useEffect(() => {
    if (elevatorOutages.length > 0) {
      updateOutageLayer(elevatorOutages);
    }
  }, [elevatorOutages]);

  // list upcoming outages
  useEffect(() => {
    const upcomingOutageFeatures = getUpcomingOutages(elevatorOutages);
    setUpcomingOutages(upcomingOutageFeatures);
  }, [elevatorOutages]);

  //if (loading) return <p>Loading...</p>;
  //if (error) return <p>Error: {error}</p>;
  return (
    <div
      style={{ height: "100vh" }} // remove in-line style from here, use tailwind or make a css module
      ref={mapContainer}
      className="map-container"
    />
  );
}
