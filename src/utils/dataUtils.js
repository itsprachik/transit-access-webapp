/* 
dataUtils is used to filter existing arrays and elevator data
*/

import { elevatorCoordinates } from "./elevatorOutageGeometry";
import { elevatorOutageDataset } from "../assets/elevatorOutagesDataset";

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
    if (equip.equipmenttype == "EL" && equip.isupcomingoutage == "Y") {
      let obj = {
        type: "Feature",
        id: equip.equipment,
        properties: {
          station: equip.station,
          outagedate: equip.outagedate,
          returntoservice: equip.estimatedreturntoservice,
          elevatorno: equip.equipment,
          isBroken: true,
        },
        // Check if co-ordinates exist for elevator no, if not assign null. This keeps this layer from erroring out if an elevator is returned as out by the mta but that is not currently in our map.
        geometry: elevatorCoordinates[equip.equipment]
          ? {
              coordinates: elevatorCoordinates[equip.equipment],
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
    let obj = {
      type: "Feature",
      id: elevatorNo,
      properties: {
        elevatorno: elevatorNo,
        isBroken: outElevatorNoArray.includes(elevatorNo) ? true : false,
      },
      // Check if co-ordinates exist for elevator no, if not assign null. This keeps this layer from erroring out if an elevator is returned as out by the mta but that is not currently in our map.
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
