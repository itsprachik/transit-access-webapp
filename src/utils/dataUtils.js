/* 
dataUtils is used to filter existing arrays and elevator data
*/

import { elevatorCoordinates } from "./elevatorOutageGeometry";

// Function to filter out Escalators and Upcoming outages from the outageArray response
export function getElevatorOutages(outageArray, setOutElevatorNos) {
  const features = [];
  const outElevatorNoArray = [];
  outageArray?.forEach((equip) => {
    if (equip.equipmenttype == "EL" && equip.isupcomingoutage == "N") {
      let obj = {
        type: "Feature",
        id: equip.equipment,
        properties: {
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
      outElevatorNoArray.push(equip.equipment);
      features.push(obj);
    } 
    setOutElevatorNos(outElevatorNoArray)
  }
);
  return features;
}

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