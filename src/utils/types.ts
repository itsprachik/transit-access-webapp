type ElevatorFeature = {
  type: string;
  properties: {
    isRedundant: string | undefined;
    stationAbbr: string | undefined;
    route: string | undefined;
    complexID: string | undefined;
    indiegogo: string | undefined;
    stationID: string | undefined;
    system: string | undefined;
    elevatorno: string | undefined;
    linesServed: string | undefined;
    directionLabel: string | undefined;
    title: string | undefined;
    image: string | undefined;
    alternativeRoute?: string | undefined;
    description: string | undefined;
    ada: string | undefined;
    isBroken: string | undefined;
    [key: string]: any;
  };
  geometry: {
    coordinates: [number, number] | any; // Tuple with two numbers
    type: string | undefined;
  };
  id: string | undefined;
};

type ElevatorData = {
  features: ElevatorFeature[];
};

type MtaStationFeature = {
  type: string;
  properties: {
    ada_notes: null | undefined | string;
    daytime_routes: string | undefined;
    south_direction_label: string | undefined;
    cbd: string | undefined;
    station_id: string | undefined;
    stop_name: string | undefined;
    gtfs_longitude: string | undefined;
    complex_id: string | undefined;
    borough: string | undefined;
    division: string | undefined;
    gtfs_latitude: string | undefined;
    ada_southbound: string | undefined;
    structure: string | undefined;
    gtfs_stop_id: string | undefined;
    line: string | undefined;
    ada_northbound: string | undefined;
    north_direction_label: string | undefined;
    ada: string | undefined ;
    upgrade_in_progress?: string | undefined;
    upgrade_date?: string | undefined;
    [key: string]: any;
  };
  geometry: {
    coordinates: [number, number] | any;
    type: string | undefined;
  };
  id: string | undefined;
};

type MtaStationData = {
  features: MtaStationFeature[];
};
