import React, { useState, useEffect, ReactElement } from "react";
import Select, { components } from "react-select";
import { MTA_SUBWAY_LINE_ICONS_SMALL } from "@/utils/constants";
import { AccessibleIconWhite } from "../icons";
import styled from "styled-components";
import { getAverageElevatorCoordinates } from "@/utils/dataUtils";
import customDataset from "@/resources/custom_dataset.json";
import { MtaStationFeature, MtaStationData } from "@/utils/types";

interface SearchBarProps {
  data: MtaStationData;
  map: mapboxgl.Map | null;
  onStationSelect?: (feature: MtaStationFeature) => void;
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
        <>
          <AccessibleIconWhite />
        </>
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

const parseLine =  (line: string) => {
  const l = line.split('-')
  console.log(l)
}

const { Option } = components;
const CustomSelectOption = (props) => (
  <Option {...props}>
    <div style={{ display: "flex", alignItems: "anchor-center",  }}>
      <span style={{ fontSize: "14px", fontWeight: "600", color: "#00000", marginRight: "8px" }}>
        {props.data.stop_name}
      </span>
      <span style={{ fontSize: "14px", fontWeight: "400", color: "#00051580" }}>
        {props.data.line}
      </span>
      <span style={{marginLeft: "6px"}}>
      {props.data.ada}
      </span>
    </div>

    <div />
    {props.data.icon}
  </Option>
);

const StyledSelect = styled(Select)`
  position: absolute !important;
  top: 10px;
  left: 10px;
  width: 344px;
  z-index: 1000;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  @media (max-width: 768px) {
    max-width: 270px;
  }
`;

const SearchBar: React.FC<SearchBarProps> = ({
  data,
  map,
  onStationSelect,
}) => {
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
      parseLine(feature.properties.line)
      stationData.push({
        station_id: feature.properties.station_id,
        stop_name: feature.properties.stop_name,
        complex_id: complex_id,
        ada: feature.properties.ada,
        line: feature.properties.line,
        label: feature.properties.stop_name.concat(
          " ",
          feature.properties.line
        ),
      });
      linesServed[station_id] = lines;
    });
    const sortedStationData = stationData.sort((a, b) =>
      a.label.localeCompare(b.label)
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
        stop_name: st.stop_name,
        line: st.line,
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

    // callback to allow popup without passsing RT data into search
    if (onStationSelect) {
      const selected = selectedStation[0] as any;
      selected.layer = { id: "mta-subway-stations-all" };
      onStationSelect(selectedStation[0]);
    }
    const station_id = selectedStation[0].properties.station_id;
    const complex_id = selectedStation[0].properties.complex_id;
    const isAccessible = selectedStation[0].properties.ada;

    let center: [number, number];
    let popupFlag = null;

    if (isAccessible !== "0") {
      const coords = getAverageElevatorCoordinates(
        customDataset.features,
        complex_id
      );

      if (
        coords?.bounds &&
        Array.isArray(coords.bounds) &&
        coords.bounds.length === 2 &&
        typeof coords.bounds[0] === "number" &&
        typeof coords.bounds[1] === "number"
      ) {
        center = coords.bounds.getCenter().toArray() as [number, number];
      }

      popupFlag = true;
    } else {
      center = selectedStation[0].geometry.coordinates as [number, number];
      popupFlag = true;

      map.flyTo({
        center: center,
        zoom: 15,
        pitch: 0,
        speed: 1.8,
      });
    }
  };

  return (
    // <StyledDiv>
      <StyledSelect
        instanceId="select-box"
        options={options}
        isClearable
        components={{ Option: CustomSelectOption }}
        onChange={handleSelect}
        menuIsOpen={true}
        placeholder="Search for a station"
      />
    // </StyledDiv>
  );
};

export default SearchBar;
