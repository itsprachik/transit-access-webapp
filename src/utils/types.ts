import { geometry } from "@turf/turf";
import { FeatureCollection, Feature, Point } from "geojson";

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
    isOverpass: string | undefined;
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

export interface MtaStationProperties {
  station_id: string;
  complex_id: string;
  stop_name: string;
  line: string;
  daytime_routes: string;
  division: string;
  structure: string;
  ada: string;
  ada_notes: string | null;
  ada_northbound: string;
  ada_southbound: string;
  north_direction_label: string;
  south_direction_label: string;
  gtfs_stop_id: string;
  gtfs_longitude: string;
  gtfs_latitude: string;
  cbd: string;
  borough: string;
}; 

export type MtaStationFeature = Feature<Point, MtaStationProperties>;

export type MtaStationData = FeatureCollection<Point, MtaStationProperties>;