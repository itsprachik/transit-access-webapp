/* 
dataUtils is used to filter existing arrays and elevator data
*/

import { elevatorCoordinates } from "./elevatorOutageGeometry";
import customDataset from "@/resources/custom_dataset.json"; 

// Function to filter out Escalators and Upcoming outages from the outageArray response
// export function setOutElevatorNumbers(outageArray, setOutElevatorNos) {
//   const features = [];
//   const outElevatorNoArray = [];
//   outageArray?.forEach((equip) => {
//     if (equip.equipmenttype == "EL" && equip.isupcomingoutage == "N") {
//       outElevatorNoArray.push(equip.equipment);
//     }
//     setOutElevatorNos(outElevatorNoArray);
//   });
//   // return features;
// }

// Function to highlight all upcoming outages
export function getUpcomingOutages(outageArray) {
  const upcomingOutages = [];
  outageArray?.forEach((equip) => {
    if (equip.equipmenttype === "EL" && equip.isupcomingoutage === "Y") {
      const cleanElevatorNo = equip.equipment.trim(); // Trim spaces from elevator number

      let obj = {
        type: "Feature",
        id: cleanElevatorNo,
        properties: {
          station: equip.station,
          outagedate: equip.outagedate,
          returntoservice: equip.estimatedreturntoservice,
          elevatorno: cleanElevatorNo,
          isBroken: true,
        },
        geometry: elevatorCoordinates[cleanElevatorNo]
          ? {
              coordinates: elevatorCoordinates[cleanElevatorNo],
              type: "Point",
            }
          : null,
      };
      upcomingOutages.push(obj);
    }
  });
  return upcomingOutages;
}


export function getOutageLayerFeatures(outElevatorNoArray) {
  const features = [];
  for (const [elevatorNo, geometry] of Object.entries(elevatorCoordinates)) {
    const cleanElevatorNo = elevatorNo.trim(); // Trim spaces from elevator number

    let obj = {
      type: "Feature",
      id: cleanElevatorNo,
      properties: {
        elevatorno: cleanElevatorNo,
        isBroken: outElevatorNoArray.some((el) => el.trim() === cleanElevatorNo),
      },
      geometry: geometry
        ? {
            coordinates: geometry,
            type: "Point",
          }
        : null,
    };
    features.push(obj);
  }
  return features;
}

// checks to see if there is any outage in a station.
export const doesStationHaveOutage = (stationID, elevatorOutages) => {
  if (!elevatorOutages || elevatorOutages.length === 0) {
    return false; // No outages
  }

  // Access the GeoJSON features array or default to empty array
  const datasetArray = Array.isArray(customDataset.features) 
    ? customDataset.features 
    : [];

  if (!datasetArray || datasetArray.length === 0) {
    console.warn("customDataset is empty or invalid.");
    return false;
  }

  // Find all elevator numbers at the given stationID
  const elevatorsAtStation = datasetArray
    .filter((item) => item.properties.stationID === stationID)
    .map((item) => item.properties.elevatorno);

  if (elevatorsAtStation.length === 0) {
    console.warn(`No elevators found for stationID: ${stationID}`);
    return false;
  }
  // Check if any elevator matching this stationID is out of service
  return elevatorOutages.some((elevator) =>
    elevatorsAtStation.includes(elevator.equipment.trim()) &&
    elevator.isupcomingoutage === "N"
  );
};

// returns array of all stations with outages
export const getStationsWithOutages = (elevatorOutages) => {
  if (!elevatorOutages || elevatorOutages.length === 0) {
    console.warn("No elevator outages available.");
    return {};
  }

  const datasetArray = Array.isArray(customDataset.features)
    ? customDataset.features
    : [];

  if (!datasetArray || datasetArray.length === 0) {
    console.warn("customDataset is empty or invalid.");
    return {};
  }

  const stationsWithOutages = {};

  // Loop through all stations and check for outages
  datasetArray.forEach((station) => {
    const stationID = station.properties?.stationID;

    if (stationID) {
      const isOut = doesStationHaveOutage(stationID, elevatorOutages);

      // Store the result in the map
      stationsWithOutages[stationID] = isOut;
    }
  });

  return stationsWithOutages;
};
