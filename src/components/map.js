import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import { getElevatorOutages, getUpcomingOutages } from "@/utils/dataUtils";
import dotenv from "dotenv";
import { createRoot } from "react-dom/client";
import ElevatorPopup, {
  OnHoverElevatorPopup,
} from "./ElevatorPopup/ElevatorPopup";
import outageGeojson from '../resources/elevatorOutagesDataset.geojson';
import mapboxStyle from '@/styles/mapbox-style.json';
let icon = true;

// Load environment variables
dotenv.config();

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [elOutages, setElOutages] = useState([]);
  const [outElevatorNos, setOutElevatorNos] = useState([]);
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

  // Initializing your map here ensures that Mapbox GL JS will not try to render a map before React creates the element that contains the map.
  useEffect(() => {
    async function getOutages() {
      let data = await fetchOutages(apiKey);
      setElOutages(data);
    }

    // Ensure mapContainer is available
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapboxStyle,
        center: [-73.98365318925187, 40.7583063693059], // NYC
        zoom: 13,
      });


      // Add navigation controls
      // Zoom and bearing control
      const zoomControl = new mapboxgl.NavigationControl();
      map.current.addControl(zoomControl, "bottom-left"); // Add the control to the top-right corner of the map

      // GeoLocate
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      });
      map.current.addControl(geolocateControl, "bottom-right");

      // Load custom icons (checkmark and X)
      map.current.on("style.load", () => {
        map.current.loadImage(
          "./symbols/checkmark-icon1a.png",
          (error, image) => {
            if (error) throw error;
            map.current.addImage("checkmark-icon", image);
          }
        );

        map.current.loadImage("./symbols/x-icon1a.png", (error, image) => {
          if (error) throw error;
          map.current.addImage("x-icon", image);
        });

         map.current.addSource("outage-data", {
          type: "geojson",
          data: outageGeojson,
          dynamic: true,
          generateId: true,
        });

        // Add outage layer with icons based on isBroken property
        map.current.addLayer({
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
                1
          ],
            "icon-anchor": "center",
        //    "text-anchor": "right",
            "icon-offset": [0, -20],
            "icon-allow-overlap": true,
            "icon-padding": 2,
            "symbol-z-order": "auto",
            "symbol-sort-key": 1,

            "text-size": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    10,
                    22,
                    10
                ],
                "text-radial-offset": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    1.2,
                    17,
                    2
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
                    2
                ],
                "text-offset": [1.5, 0],
            //"icon-rotate": 0, // Ensure icons are not rotated
          },
          
       //   "paint": {"icon-translate": [0, -30]},
         // before: "transit-elevators" // Ensure this layer is added below the elevator layer
         sprite: 'mapbox://sprites/joelaaron/clndls6cm07rp01mae34gd2oo/ehu96mappgo0oqnlwfjrnz4ta' // Replace with your actual sprite URL
        });

        let hoveredFeatureId = null;

        map.current.on('load', function() {
          map.current.setLayoutProperty('transit-elevators', 'visibility', 'visible');
        });
        
        map.current.on('zoom', function() {
          map.current.setLayoutProperty('transit-elevators', 'visibility', 'visible');
        });
        

        // On hover event
        map.current?.on("mousemove", "transit-elevators", (e) => {
          if (e.features.length > 0) {
            // Change opacity of elevator icon to indicate hover
            if (hoveredFeatureId !== null) {
              map.current.setFeatureState(
                {
                  source: "composite",
                  sourceLayer: "transit_elevators",
                  id: hoveredFeatureId,
                },
                { hover: false }
              );
            }
            hoveredFeatureId = e.features[0].id;
            map.current.setFeatureState(
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
              .addTo(map.current);
          }
        });

        map.current?.on("mouseleave", "transit-elevators", (e) => {
          if (hoveredFeatureId !== null) {
            map.current.setFeatureState(
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
        map.current?.on("click", "transit-elevators", (e) => {
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
              .addTo(map.current);
          }
        });

        map.current.on('load', function () {
          // Ensure transit-elevators is always on top of outage layer
          map.current.moveLayer("outages", "transit-elevators");
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
    let features = getElevatorOutages(elOutages, setOutElevatorNos);
    // Map onload event
    map.current.on("load", () => {
      map.current.getSource("outage-data").updateData({
        type: "FeatureCollection",
        features: features,
      });
    });

//    console.log(getElevatorOutages(elOutages, setOutElevatorNos));

    // Clean up function
    // return () => {
    //   second;
    // };
  }, [elOutages]);

  // list upcoming outages
  useEffect(() => {
    const upcomingOutageFeatures = getUpcomingOutages(elOutages);
    setUpcomingOutages(upcomingOutageFeatures);
  }, [elOutages]);

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
