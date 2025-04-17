import { getOutageLayerFeatures, getStationOutageLayerFeatures } from "@/utils/dataUtils";

export const getOutElevatorNumbers = (elOutages: any[]) => {
  const outElevatorNoArray = [];
  if (elOutages.length !== 0) {
    elOutages?.forEach((equip: { equipmenttype: string; isupcomingoutage: string; equipment: any; }) => {
      if (equip.equipmenttype == "EL" && equip.isupcomingoutage == "N") {
        outElevatorNoArray.push(equip.equipment);
      }
    });
    return outElevatorNoArray;
  }
};

export const updateOutageLayer = (data: any[], mapRef: { current: { getSource: (arg0: string) => any; }; }) => {
  const outageElevatorNos = getOutElevatorNumbers(data);
  const features = getOutageLayerFeatures(outageElevatorNos);
  const geojsonSource = mapRef.current?.getSource("outage-data");
  geojsonSource?.setData({
    type: "FeatureCollection",
    features: features,
  });
};


/* same functions, for stations instead of elevators */
/*
export const getOutStations = (stationOutages: any[]) => {
  const outStationArray = [];
  if (stationOutages.length !== 0) {
    stationOutages?.forEach((equip: { equipmenttype: string; isupcomingoutage: string; equipment: any; }) => {
    //  if (equip.equipmenttype == "EL" && equip.isupcomingoutage == "N") {
        outStationArray.push(equip.equipment);
  //    }
    });
    return outStationArray;
  }
};*/

export const updateStationOutageLayer = (
  stationOutageArray: string[],
  mapRef: { current: { getSource: (arg0: string) => any; }; }
) => {
  const features = getStationOutageLayerFeatures(stationOutageArray);

  const geojson = {
    type: "FeatureCollection",
    features: features,
  };

  const geojsonSource = mapRef.current?.getSource("station-outage-data");
  if (geojsonSource) {
    geojsonSource.setData(geojson);
  } else {
    console.warn("station-outage-data source not found");
  }
};
