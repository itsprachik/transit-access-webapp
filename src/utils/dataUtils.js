import { elevatorCoordinates } from "./elevatorOutageGeometry";

// Function to filter out Escalators and Upcoming outages from the outageArray response
export default function getElevatorOutages(outageArray) {
  const features = [];
  outageArray.forEach((equip) => {
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
      features.push(obj);
    }
  });
  return features;
}
