// StationPopup.tsx
import React from "react";
import ElevatorCard from "./ElevatorCard";
import styles from "@/components/StationPopup/station-popup.module.css";
import { toWords } from "number-to-words";
import { MTA_SUBWAY_LINE_ICONS } from "@/utils/constants";
import { AccessibleIconWhite, AccessibleIconFalse } from "../icons";

type Elevator = {
  ada: string;
  directionLabel: string;
  elevatorno: string;
  description_custom: string;
  imageURL: string;
  linesServed: string;
  isOut: boolean;
  isStreet: string;
  estimatedReturn: string | null;
  totalElevators: number;
  coordinates: [number, number];
  isBridge: string;
};

type StationPopupProps = {
  ada;
  ada_notes;
  route;
  inaccessibleRoutes;
  complexName;
  complexID;
  elevators: Elevator[];
  totalElevators;
  map: mapboxgl.Map;
  stationView: string | null;
  setStationView: React.Dispatch<React.SetStateAction<string | null>>;
  elevatorView: string | null;
  setElevatorView: React.Dispatch<React.SetStateAction<string | null>>;
  show3DToggle;
  setShow3DToggle: React.Dispatch<React.SetStateAction<boolean>>;
  lastUpdated;
};

const StationPopup: React.FC<StationPopupProps> = ({
  complexName,
  elevators,
  totalElevators,
  map,
  ada,
  ada_notes,
  route,
  inaccessibleRoutes,
  stationView,
  setStationView,
  elevatorView,
  setElevatorView,
  show3DToggle,
  setShow3DToggle,
  lastUpdated
}) => {
  function generateSubwayLines(routeLines) {
    return routeLines.map((line, i) => (
      <span
        key={i}
        title={line}
        className={`${styles.lineIcon} ${styles.lineIconLarge}`}
      >
        {MTA_SUBWAY_LINE_ICONS[line]}
      </span>
    ));
  }

  const hasRamp = elevators.every(
    (e) => e.elevatorno.toLowerCase().includes("ra")
  );

  const lines = route?.split(" ") || [];
  const inaccessibleLines = inaccessibleRoutes?.split(" ") || [];

  return (
    <div className={styles.popup}>
      <div className={styles.subtitle}>
        {ada === "0" ? (
          "This station is not accessible"
        ) : (
          <>
            There {totalElevators > 1 ? "are" : "is"} {toWords(totalElevators)}{" "}
            {hasRamp
              ? totalElevators > 1
                ? "Ramps"
                : "Ramp"
              : totalElevators > 1
              ? "Elevators"
              : "Elevator"}{" "}
            at
          </>
        )}
      </div>

      {/* STATION TITLE */}
      <h3 className={styles.title}>
        {complexName}
        <div className={styles.accessibleIconWrapper}>
          {ada !== "0" ? (
            <>
              <AccessibleIconWhite />
            </>
          ) : (
            <>
              <AccessibleIconFalse />
            </>
          )}
        </div>
      </h3>
      {/* STATION ROUTES */}
      <div className={styles.stationRouteWrapper}>
        {ada !== "0" ? (
          <>{generateSubwayLines(lines)}</>
        ) : (
          <>{generateSubwayLines(inaccessibleLines)}</>
        )}
      </div>
      <div className={styles.inaccessibleRoutesWrapper}>
        {ada !== "0" ? (
          <>
            {inaccessibleRoutes ? <>{inaccessibleRoutes} not accessible</> : ""}
          </>
        ) : (
          ""
        )}
      </div>
      <div className={styles.adaNotesWrapper}>
        {ada_notes ? (
          <>
            <AccessibleIconWhite size={18} />
            {ada_notes}
          </>
        ) : (
          ""
        )}
      </div>
      
      <div className={styles.elevatorCard}>
        <div className={styles.header}>
        {ada!=="0" ? 'street level' : null}</div>
        {elevators.map((elevator, idx) => (
          elevator.isStreet ? (
          <ElevatorCard
            key={idx}
            elevator={elevator}
            map={map}
            stationView={stationView}
            setStationView={setStationView}
            elevatorView={elevatorView}
            setElevatorView={setElevatorView}
            setShow3DToggle={setShow3DToggle}
          />) : null
        ))}
        {elevators.some((elevator) => !elevator.isStreet) && (
          <div className={styles.header}>
            in the station
          </div>
        )}
          {elevators.map((elevator, idx) => (
          elevator.isStreet ? null : (     
          <ElevatorCard
          key={idx}
          elevator={elevator}
          map={map}
          stationView={stationView}
          setStationView={setStationView}
          elevatorView={elevatorView}
          setElevatorView={setElevatorView}
          setShow3DToggle={setShow3DToggle}
        />)
        ))}
      {lastUpdated && (
        <div className={styles.lastUpdated}>
          Last updated:{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      </div>
    </div>
  );
};

export default StationPopup;
