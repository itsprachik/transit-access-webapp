import { getOutageLayerFeatures } from "@/utils/dataUtils";

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
