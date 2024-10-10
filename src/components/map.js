import { useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import getElevatorOutages, { getUpcomingOutages } from "@/utils/dataUtils";
//import checkmarkIcon from "@/checkmark-icon1.png";
//import xIcon from "@/x-icon1.png";

mapboxgl.accessToken = "pk.eyJ1Ijoiam9lbGFhcm9uIiwiYSI6ImNsbmRpaWlkbDA0ZHEya21rNnVqd2t0MDgifQ.tWei82YsyHOpERaAUq_Vuw";
const apiKey = "ASkxmeY00iaYfGsMHzoQM33a1QFLyX3V3g43xV6E"; // Replace with your actual API key

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [elOutages, setElOutages] = useState([]);
  const [upcomingOutages, setUpcomingOutages] = useState([]);

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
        style: "mapbox://styles/joelaaron/clndls6cm07rp01mae34gd2oo",
        center: [-74.006, 40.7128], // NYC
        zoom: 15,
      });

      // Add navigation controls
            // Zoom and bearing control
            const zoomControl = new mapboxgl.NavigationControl();
            map.current.addControl(zoomControl, 'bottom-left'); // Add the control to the top-right corner of the map

             // GeoLocate
             const geolocateControl = new mapboxgl.GeolocateControl({
              positionOptions: {
                  enableHighAccuracy: true
              },
              trackUserLocation: true,
              showUserHeading: true
          });
          map.current.addControl(geolocateControl, 'bottom-right');


      // Load custom icons (checkmark and X)
    map.current.on("style.load", () => {
      map.current.loadImage('./symbols/checkmark-icon1a.png', (error, image) => {
        if (error) throw error;
        map.current.addImage('checkmark-icon', image);
      });

      map.current.loadImage('./symbols/x-icon1a.png', (error, image) => {
        if (error) throw error;
        map.current.addImage('x-icon', image);
      });

      map.current.addSource("outage-data", {
        type: "geojson",
        data: "/elevatorOutagesDataset.geojson",
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
            "checkmark-icon", // Use checkmark icon
            ["==", ["get", "isBroken"], true], // If elevator is broken
            "x-icon", // Use X icon
            "checkmark-icon", // Default to checkmark icon in case of missing data
          ],
          "icon-size": 0.15,
          "icon-anchor": "bottom",
          "icon-offset": [0, -50],
          "icon-allow-overlap": true,
          //"icon-rotate": 0, // Ensure icons are not rotated
          
        },
      });

        let hoveredFeatureId = null;

        // Popup for station info
        const popupHover = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "onhover-popup", // hover-popup css class
        });

        const popupClick = new mapboxgl.Popup({
          
          anchor: "bottom",
          className: "onclick-popup",
          closeButton: true,
          closeOnClick: true,
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
         //   console.log(e.features);
            const feature = e.features[0];
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = feature.properties.description;
            const imageUrl = feature.properties.image;
            const title = feature.properties.title;
            const linesServed = feature.properties.linesServed;
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popupHover
              .setLngLat(coordinates)
              .setHTML(
                `<p><strong>Lines Served</strong></p>
                 <p>${linesServed}</p>`
              )
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
          popupHover.remove();
        });

        //  Click event to display pop-up ***
        map.current?.on("click", "transit-elevators", (e) => {
          if (e.features.length > 0) {
            console.log(e.features);
            const feature = e.features[0];
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = feature.properties.description;
            const imageUrl = feature.properties.image;
            const title = feature.properties.title;
            const linesServed = feature.properties.linesServed;
            const elevatorno = feature.properties.elevatorno;
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popupClick
              .setLngLat(coordinates)
              .setHTML(
                `<strong>${title} </strong>
                <p>${elevatorno}</p>
                 <img src= "${imageUrl}" alt="Image Desc" style="width:100%;"/>
                 <p>${description}</p>
                 <p><strong>Lines Served</strong></p>
                 <p>${linesServed}</p>`
              )
              .addTo(map.current);
          }
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
    let features = getElevatorOutages(elOutages);
    
    // Map onload event
    map.current.on("load", () => {
      map.current.getSource("outage-data").updateData({
        type: "FeatureCollection",
        features: features,
      });
    });
    

    // Clean up function
    // return () => {
    //   second;
    // };
  }, [elOutages]);

  // list upcoming outages
  useEffect(() => {
    const upcomingOutageFeatures = getUpcomingOutages(elOutages);
    setUpcomingOutages(upcomingOutageFeatures);
    console.log("Upcoming Elevator Outages:", upcomingOutageFeatures);
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