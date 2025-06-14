import React, { useState, useEffect, ReactElement } from "react";
import Select, { components } from "react-select";
import mapboxgl from "mapbox-gl";
import { IconType } from "react-icons";
import { MTA_SUBWAY_LINE_ICONS } from "@/utils/constants";

interface SearchBarProps {
  data: MtaStationData;
  map: mapboxgl.Map | null;
}

const getLinesServedIcons = (lines: string[]) => {
  return (
    <>
      {lines.map((l: string | number, index: number) => (
        <span
          alt-text={l[index]}
          key={index}
          style={{ height: "14px", width: "14px" }}
        >
          {MTA_SUBWAY_LINE_ICONS[l]}
        </span>
      ))}
    </>
  );
};

const addLinesServedIconsToStationData = (stationData, linesServed) => {
  stationData.forEach((station) => {
    station.icon = getLinesServedIcons(linesServed[station.complex_id]);
  });

  return stationData;
};

const { Option } = components;
const CustomSelectOption = (props) => (
  <Option {...props}>
    {props.data.label}
    {props.data.icon}
  </Option>
);

const SearchBar: React.FC<SearchBarProps> = ({ data, map }) => {
  const [options, setOptions] = useState<
    { label: string; value: string; icon: ReactElement }[]
  >([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  useEffect(() => {
    // Extract unique station names for the search dropdown based on tbeir complex ids
    const stationData = [];
    const linesServed: { [key: number]: string[] } = {};
    data.features.forEach((feature) => {
      const complex_id = feature.properties.complex_id;
      const lines = feature.properties.daytime_routes.split(" ");
      console.log(complex_id, lines);

      if (
        !stationData.find(
          (obj) => obj.complex_id === feature.properties.complex_id
        )
      ) {
        stationData.push({
          station_id: feature.properties.station_id,
          stop_name: feature.properties.stop_name,
          complex_id: complex_id,
        });
      }
      if (complex_id in linesServed && linesServed[complex_id]) {
        let temp = linesServed[complex_id].concat(lines);

        linesServed[complex_id] = temp;
      } else {
        linesServed[complex_id] = lines;
      }
    });
    const sortedStationData = stationData.sort((a, b) =>
      a.stop_name.localeCompare(b.stop_name)
    );
    const stationDataWithLinesServedIcons = addLinesServedIconsToStationData(
      sortedStationData,
      linesServed
    );
    setOptions(
      stationDataWithLinesServedIcons.map((st) => ({
        label: st.stop_name,
        value: st.station_id,
        icon: st.icon,
      }))
    );
  }, [data]);

  const handleSelect = (selected: { label: string; value: string } | null) => {
    if (!selected || !map) return;

    setSelectedStation(selected.value);

    // Find all elevators at the selected station
    const selectedStation = data.features.filter(
      (feature) => feature.properties.station_id === selected.value
    );
    const center: [number, number] = selectedStation[0].geometry.coordinates;

    // Move the map to the new location
    map.flyTo({ center, zoom: 17 });
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        width: 300,
        zIndex: 1000,
        fontFamily: "arial",
      }}
    >
      <Select
        options={options}
        components={{ Option: CustomSelectOption }}
        onChange={handleSelect}
        placeholder="Search for a station"
      />
    </div>
  );
};

export default SearchBar;

// averaging logic to add back in for complex ids, probably move out to utils functions
// const stationElevators = data.features.filter(
//   (feature) => feature.properties.stop_name === selected.value
// );

// if (stationElevators.length === 0) return;

// // Compute center point
// const avgCoords = stationElevators.reduce(
//   (acc, feature) => {
//     acc[0] += feature.geometry.coordinates[0];
//     acc[1] += feature.geometry.coordinates[1];
//     return acc;
//   },
//   [0, 0] as [number, number]
// );
// const center: [number, number] = [
//   avgCoords[0] / stationElevators.length,
//   avgCoords[1] / stationElevators.length,
// ];
