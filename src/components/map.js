import { useEffect, useRef, useState } from "react";
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
      //console.log(data)
      setElOutages(data);
    }

    // Ensure mapContainer is available
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/joelaaron/clxanrust025y01qo6u5a92oq",
        center: [-74.006, 40.7128], // NYC
        zoom: 15,
      });
      // Define a source before using it to create a new layer
      map.current.on("style.load", () => {
        map.current.addSource("outage-data", {
          type: "geojson",
          data: "/elevatorOutagesDataset.geojson",
          dynamic: true,
        });

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
