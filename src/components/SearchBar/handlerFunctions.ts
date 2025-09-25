import { getAdaIcon, getLinesServedIcons } from "./SearchBar";

export const getOptions = (data) => {
  const options = [];
  const linesServed: { [key: string]: string[] } = {};
  data.features.forEach((feature) => {
    const gtfs_stop_id = feature.properties.gtfs_stop_id; // this is always unique, whereas station_id sometimes overlaps
    const parsedLine = parseLine(feature.properties.line);
    const isAccessible = feature.properties.ada !== "0";
    const lines = feature.properties.daytime_routes.split(" ");
    linesServed[gtfs_stop_id] = lines;
    const lineServedAnnouncement =
      lines.length > 0 ? `Lines served ${lines.join(", ")};` : "No lines served listed";
    options.push({
      value: feature.properties.station_id,
      stop_name: feature.properties.stop_name,
      ada: getAdaIcon(feature.properties.ada),
      line: parsedLine,
      label: `${feature.properties.stop_name}; (${feature.properties.line}; ${
        isAccessible ? " – Accessible station;" : "This is not an accessible station;"
      }– ${lineServedAnnouncement}`,
      icon: getLinesServedIcons(lines),
      linesServed: feature.properties.daytime_routes.split(" "),
    });
  });

  const defaultOptions = options.sort((a, b) =>
    a.label.localeCompare(b.label)
  );

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

