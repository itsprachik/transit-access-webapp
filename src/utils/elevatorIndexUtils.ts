// utils/elevatorIndexUtils.ts
// use these maps to quickly reference elevators by number, complex, or station. makes lookup O(1)

type ElevatorFeature = {
    properties: {
      elevatorno?: string;
      stationID?: string;
      complexID?: string;
    };
  };
  
  type ElevatorIndex = {
    elevatorByNo: Map<string, any>;
    elevatorByStationId: Map<string, any[]>;
    elevatorByComplexId: Map<string, any[]>;
  };

  
  // Global map to quickly get complexID from a stationID (across all features)
  export const stationIDToComplexID = new Map<string, string>();
  
  export function buildElevatorIndex(features: ElevatorFeature[]): ElevatorIndex {
    const elevatorByNo = new Map<string, any>();
    const elevatorByStationId = new Map<string, any[]>();
    const elevatorByComplexId = new Map<string, any[]>();
  
    features.forEach((f) => {
      const elevatorNo = f.properties.elevatorno;
      const stationIDs = (f.properties.stationID || "")
        .split("/")
        .map((id) => id.trim());
      const complexID = f.properties.complexID;
  
      if (elevatorNo) elevatorByNo.set(elevatorNo, f);
  
      // multiple elevators per station
      stationIDs.forEach((id) => {
        if (!elevatorByStationId.has(id)) {
          elevatorByStationId.set(id, []);
        }
        elevatorByStationId.get(id)?.push(f);
  
        // Add to stationID → complexID map
        if (complexID) {
          stationIDToComplexID.set(id, complexID);
        }
      });
  
      // multiple elevators per complex
      if (complexID) {
        if (!elevatorByComplexId.has(complexID)) {
          elevatorByComplexId.set(complexID, []);
        }
        elevatorByComplexId.get(complexID)?.push(f);
      }
    });
  
    return {
      elevatorByNo,
      elevatorByStationId,
      elevatorByComplexId,
    };
  }
  