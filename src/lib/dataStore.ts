type GeoJSONFeatureCollection = { type: "FeatureCollection"; features: any[] };

const empty = (): GeoJSONFeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

let _elevators = empty();
let _complexes = empty();
let _stations = empty();
let _stationAlerts = empty();

export function initializeStore(
  elevators: GeoJSONFeatureCollection,
  complexes: GeoJSONFeatureCollection,
  stations: GeoJSONFeatureCollection,
  stationAlerts: GeoJSONFeatureCollection,
) {
  _elevators = elevators;
  _complexes = complexes;
  _stations = stations;
  _stationAlerts = stationAlerts;
}

export function getElevatorsDataset() {
  return _elevators;
}
export function getComplexesDataset() {
  return _complexes;
}
export function getStationsDataset() {
  return _stations;
}
export function getStationAlertsDataset() {
  return _stationAlerts;
}
