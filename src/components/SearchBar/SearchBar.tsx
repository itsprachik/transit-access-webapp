import React, { useState, useEffect, ReactElement } from "react";
import Select, { components } from "react-select";
import { MTA_SUBWAY_LINE_ICONS_SMALL } from "@/utils/constants";
import { AccessibleIconWhite } from "../icons";
import styled from "styled-components";
import { getAverageElevatorCoordinates } from "@/utils/dataUtils";
import customElevatorDataset from "@/resources/custom_elevator_dataset.json";
import { MtaStationFeature, MtaStationData } from "@/utils/types";
import { setManhattanTilt } from "../MtaMap/mtaMapOptions";
import { matchSorter } from "match-sorter";
import { getOptions } from "./handlerFunctions";
import styles from "@/components/SearchBar/searchbar.module.css";
interface SearchBarProps {
  data: MtaStationData;
  $hasAlert: boolean;
  map: mapboxgl.Map | null;
  onStationSelect?: (feature: MtaStationFeature) => void;
}

// Custom Option since we want icons and custom styling. Need a custom component to override the default label in react-select
const { Option, ClearIndicator, DropdownIndicator } = components;
const CustomSelectOption = (props) => (
  <Option {...props}>
    <div
      style={{ display: "flex", alignItems: "anchor-center" }}
      role="option"
      aria-selected={props.isSelected}
    >
      <span
        style={{
          fontSize: "14px",
          fontWeight: "600",
          color: "#00000",
          marginRight: "8px",
          whiteSpace: "nowrap",
        }}
      >
        {props.data.stop_name}
      </span>
      <span
        style={{
          fontSize: "10px",
          fontWeight: "400",
          color: "#00051580",
          whiteSpace: "nowrap",
        }}
      >
        {props.data.line}
      </span>
      <span style={{ marginLeft: "6px" }}>{props.data.ada}</span>
    </div>

    <div />
    <div style={{ display: "flex", alignItems: "center" }}>
      {props.data.icon}
    </div>
  </Option>
);

const CustomClear = (props) => {
  const focusInput = () => {
    // Use the instanceId to find the input
    const input = document.querySelector(
      '[id^="react-select-"][id$="-input"]',
    ) as HTMLInputElement;
    if (input) {
      input.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      props.clearValue();
      setTimeout(() => focusInput(), 10);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          props.clearValue();
          setTimeout(() => focusInput(), 10);
        }}
        onKeyDown={handleKeyDown}
        className={styles.reactSelectCustomClearIndicator}
        aria-label="Clear selection"
        type="button"
        tabIndex={0}
      >
        <ClearIndicator {...props} />
      </button>
    </>
  );
};

const CustomDropdownIndicator = (props) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        props.selectProps.onMenuOpen();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      aria-label={
        props.selectProps.menuIsOpen
          ? "Close station dropdown"
          : "Open station dropdown"
      }
      aria-expanded={props.selectProps.menuIsOpen}
      tabIndex={0}
      className={styles.reactSelectCustomDropdownIndicator}
    >
      <DropdownIndicator {...props} />
    </button>
  );
};

const { SingleValue } = components;

const CustomSingleValue = (props) => {
  const { data } = props;
  return (
    <SingleValue {...props}>
      <span>{data.stop_name}</span>
    </SingleValue>
  );
};

const StyledSelect = styled(Select)<{ $hasAlert?: boolean }>`
  position: absolute !important;
  top: ${(props) => (props.$hasAlert ? "68px" : "20px")};
  transition: top 0.3s ease;
  padding: 0px 5px 0px 5px;
  width: 400px;
  z-index: 1000;
  border-color:  #595959;
  font-family: -apple-system, BlinkMacSystemFont, Helvetica Neue, Helvetica,
    Arial, sans-serif;

  #react-select-select-box-placeholder {
    color: #595959; 


  // Figure out why this isnt being applied anymore, had to add to global.css
  @media (max-width: 768px)  {
        width: 100vw !important;
       
  }
`;

const SearchBar: React.FC<SearchBarProps> = ({
  data,
  map,
  $hasAlert,
  onStationSelect,
}) => {
  const [options, setOptions] = useState<
    { label: string; value: string; icon: ReactElement }[]
  >([]);
  const defaultOptions = getOptions(data);

  useEffect(() => {
    setOptions(defaultOptions);
  }, [data]);

  const handleSelect = (selected: { label: string; value: string } | null) => {
    if (!selected || !map) return;

    // Find all elevators at the selected station
    const selectedStation = data.features.filter(
      (feature) => feature.properties.station_id === selected.value,
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
        customElevatorDataset.features,
        complex_id,
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
        bearing:
          selectedStation[0].properties.borough == "M" ? setManhattanTilt() : 0,
        speed: 1.8,
      });
    }
  };

  const handleInputChange = (inputValue: string) => {
    if (!inputValue) {
      setOptions(defaultOptions);
    } else {
      setOptions(
        matchSorter(defaultOptions, inputValue, {
          keys: [(item) => item.label.replace(/-/g, " ")],
        }),
      );
    }
    return inputValue; // important so react-select updates its input
  };

  return (
    <StyledSelect
      className="searchBar"
      $hasAlert={$hasAlert}
      instanceId="select-box"
      options={options}
      aria-label="Search for a station"
      aria-describedby="station-search-help"
      isClearable
      filterOption={() => true} // disables built-in filtering, this is a fix for the lag thats introduced when custom filtering is applied
      onInputChange={handleInputChange}
      components={{
        Option: CustomSelectOption,
        SingleValue: CustomSingleValue,
        ClearIndicator: CustomClear,
        DropdownIndicator: CustomDropdownIndicator,
        IndicatorSeparator: () => null,
      }}
      onChange={handleSelect}
      placeholder="Search for a station"
    />
  );
};

export const getLinesServedIcons = (lines: string[]) => {
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

export const getAdaIcon = (ada: string) => {
  return (
    <>
      {ada != "0" && (
        <>
          <AccessibleIconWhite
            aria-hidden="true"
            aria-label="Accessible Station"
          />
        </>
      )}
    </>
  );
};

export default SearchBar;
