import { useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import mapboxgl from "mapbox-gl";
import { fetchOutages } from "@/api/fetchOutages";
import getElevatorOutages from "@/utils/dataUtils";

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9lbGFhcm9uIiwiYSI6ImNsbmRpaWlkbDA0ZHEya21rNnVqd2t0MDgifQ.tWei82YsyHOpERaAUq_Vuw";
const apiKey = "ASkxmeY00iaYfGsMHzoQM33a1QFLyX3V3g43xV6E"; // Replace with your actual API key

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [elOutages, setElOutages] = useState([]);


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

      // Define a source before using it to create a new layer
      map.current.on("style.load", () => {
        map.current.addSource("outage-data", {
          type: "geojson",
          data: "/elevatorOutagesDataset.geojson",
          dynamic: true,
          generateId: true,
        });

        map.current.setPaintProperty("transit-elevators", "icon-opacity", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.5,
          1,
        ]);

        // Add outage layer
        map.current.addLayer({
          id: "outages",
          // References the GeoJSON source defined above
          // and does not require a `source-layer`
          source: "outage-data",
          type: "circle",
          paint: {
            // move out to style json eventually
            "circle-translate": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              ["literal", [0, -15]],
              22,
              ["literal", [0, -15]],
            ],
            "circle-color": [
              "case",
              ["==", ["get", "isBroken"], false],
              "hsl(101, 97%, 62%)",
              ["==", ["get", "isBroken"], true],
              "hsl(0, 96%, 60%)",
              "hsl(0, 96%, 60%)",
            ],
          },
        });

        let hoveredFeatureId = null;

        // Popup for station info
        const popupHover = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        const popupClick = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          anchor: "bottom",
          className: "onclick-popup",
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
            console.log(e.features);
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
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popupClick
              .setLngLat(coordinates)
              .setHTML(
                `<strong>${title} </strong>
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
    //Comment out above interval lines of code when developing to prevent api calls just in case there is a cap for the amount of requests the MTA allows
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
