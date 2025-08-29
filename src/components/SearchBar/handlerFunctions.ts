import { getAdaIcon, getLinesServedIcons } from "./SearchBar";

export const getOptions = (data) => {
  const stationData = [];
  const linesServed: { [key: string]: string[] } = {};
  data.features.forEach((feature) => {
    const station_id = feature.properties.station_id;
    const gtfs_stop_id = feature.properties.gtfs_stop_id; // this is always unique, whereas station_id sometimes overlaps
    const complex_id = feature.properties.complex_id;
    const parsedLine = parseLine(feature.properties.line);
    stationData.push({
      station_id: feature.properties.station_id,
      gtfs_stop_id: gtfs_stop_id,
      stop_name: feature.properties.stop_name,
      complex_id: complex_id,
      ada: feature.properties.ada,
      line: parsedLine,
      label: feature.properties.stop_name.concat(" ", feature.properties.line),
    });
    linesServed[gtfs_stop_id] = feature.properties.daytime_routes.split(" ");
  });
  const sortedStationData = stationData.sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  const stationDataWithLinesServedIcons = getIcons(
    sortedStationData,
    linesServed
  );

  const defaultOptions = stationDataWithLinesServedIcons.map((st) => ({
    label: st.stop_name,
    value: st.station_id,
    icon: st.icon,
    ada: st.ada,
    stop_name: st.stop_name,
    line: st.line,
  }));

  return defaultOptions;
};

const parseLine = (line: string) => {
  const l = line.split("-");
  if (l.length == 1) {
    const l_slash = line.split("/");
    return l_slash[0];
  }
  return l[0];
};


const getIcons = (stationData, linesServed) => {
  stationData.forEach((station) => {
    station.icon = getLinesServedIcons(linesServed[station.gtfs_stop_id]);
    station.ada = getAdaIcon(station.ada);
  });

  return stationData;
};


