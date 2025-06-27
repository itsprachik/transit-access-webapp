import React, { useState, useEffect, ReactElement } from "react";
import Select, { components } from "react-select";
import { MTA_SUBWAY_LINE_ICONS_SMALL } from "@/utils/constants";
import { AccessibleIconWhite } from "../icons";
import styled from "styled-components";

interface SearchBarProps {
  data: MtaStationData;
  map: mapboxgl.Map | null;
}

const getLinesServedIcons = (lines: string[]) => {
  return (
    <>
      {lines?.map((l: string | number, index: number) => (
        <span
          alt-text={l[index]}
          key={index}
          style={{ height: "4px !important", width: "4px !important" }}
        >
          {MTA_SUBWAY_LINE_ICONS_SMALL[l]}
        </span>
      ))}
    </>
  );
};

const getAdaIcon = (ada: string) => {
  return (
    <>
      {ada != "0" && (
        <span style={{ paddingLeft: "10px" }}>
          <AccessibleIconWhite />
        </span>
      )}
    </>
  );
};

const getIcons = (stationData, linesServed) => {
  stationData.forEach((station) => {
    station.icon = getLinesServedIcons(linesServed[station.station_id]);
    station.ada = getAdaIcon(station.ada);
  });

  return stationData;
};

const { Option } = components;
const CustomSelectOption = (props) => (
  <Option {...props}>
    <div style={{ display: "flex", alignItems: "center" }}>
      {props.data.label}
      {props.data.ada}
    </div>

    <div />
    {props.data.icon}
  </Option>
);

const StyledDiv = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 300px;
  z-index: 1000;
  font-family: Arial, sans-serif;
  @media (max-width: 768px) {
    max-width: 230px;
  }
`;

const SearchBar: React.FC<SearchBarProps> = ({ data, map }) => {
  const [options, setOptions] = useState<
    { label: string; value: string; icon: ReactElement }[]
  >([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  useEffect(() => {
    // Extract unique station names for the search dropdown based on tbeir complex ids
    const stationData = [];
    const linesServed: { [key: string]: string[] } = {};
    data.features.forEach((feature) => {
      const station_id = feature.properties.station_id;
      const complex_id = feature.properties.complex_id;
      const lines = feature.properties.daytime_routes.split(" ");
      stationData.push({
        station_id: feature.properties.station_id,
        stop_name: feature.properties.stop_name,
        complex_id: complex_id,
        ada: feature.properties.ada,
        line: feature.properties.line
      });
      linesServed[station_id] = lines;
    });
    const sortedStationData = stationData.sort((a, b) =>
      a.stop_name.localeCompare(b.stop_name)
    );
    const stationDataWithLinesServedIcons = getIcons(
      sortedStationData,
      linesServed
    );
    setOptions(
      stationDataWithLinesServedIcons.map((st) => ({
        label: st.stop_name,
        value: st.station_id,
        icon: st.icon,
        ada: st.ada,
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
    map.flyTo({ center, zoom: 19 });
  };

  return (
    <StyledDiv>
      <Select
        instanceId="select-box"
        options={options}
        isClearable
        components={{ Option: CustomSelectOption }}
        onChange={handleSelect}
        placeholder="Search for a station"
      />
    </StyledDiv>
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
