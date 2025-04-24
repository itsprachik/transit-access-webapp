/* 
dataUtils is used to filter existing arrays and elevator data
*/

import { elevatorCoordinates } from "./elevatorOutageGeometry";
import { stationCoordinates } from "./accessibleStationGeometry";
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

export function getStationOutageLayerFeatures(outStationArray) {
  const features = [];
  for (const [stationNo, geometry] of Object.entries(stationCoordinates)) {
    const cleanStationNo = stationNo.trim(); // Trim spaces from station number

    const isProblem = outStationArray.some(
      (station) => station.trim() === cleanStationNo
    );

    let obj = {
      type: "Feature",
      id: cleanStationNo,
      properties: {
        station_id: cleanStationNo,
        isProblem,
      },
      geometry: geometry
        ? {
            coordinates: geometry,
            type: "Point",
          }
        : null,
    };
    features.push(obj);
  //  console.log(JSON.stringify(outStationArray, null, 2));
  }
  return features;
}

// checks to see if there is any outage in a station.
export const doesStationHaveOutage = (stationID, elevatorOutages, datasetArray) => {

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
    elevator.isupcomingoutage === "N" && elevator.equipmenttype === "EL"
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
      const isOut = doesStationHaveOutage(stationID, elevatorOutages, datasetArray);

      // Store the result in the map
      stationsWithOutages[stationID] = isOut;
    }
  });

  return stationsWithOutages;
};

export const getStationOutageArray = (elevatorOutages) => {
  const stationOut = getStationsWithOutages(elevatorOutages);
  return Object.entries(stationOut)
    .filter(([_, hasOutage]) => hasOutage)
    .map(([stationID]) => stationID);
};

// returns the average coordinates for the stations + elevators
/*export function getAverageElevatorCoords(stationID: string, datasetArray: any[]) {
  // Get elevators at the given station
  const elevatorsAtStation = datasetArray.filter(
    (item) => item.properties.stationID === stationID
  );

  if (elevatorsAtStation.length === 0) {
    console.warn(`No elevators found for station: ${stationID}`);
    return null;
  }

  // Sum coordinates
  let totalLng = 0;
  let totalLat = 0;

  elevatorsAtStation.forEach((item) => {
    const [lng, lat] = item.geometry.coordinates;
    totalLng += lng;
    totalLat += lat;
  });

  const averageLng = totalLng / elevatorsAtStation.length;
  const averageLat = totalLat / elevatorsAtStation.length;

  return [averageLng, averageLat];
}
*/


// TO DO: rewrite python script to export a function that returns the same array, instead of writing a file called accessibleStationGeometry