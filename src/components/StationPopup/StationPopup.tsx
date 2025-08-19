// StationPopup.tsx
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import ElevatorCard from "./ElevatorCard";
import styles from "@/components/StationPopup/station-popup.module.css";
import { toWords } from "number-to-words";
import { MTA_SUBWAY_LINE_ICONS } from "@/utils/constants";
import {
  AccessibleIconWhite,
  AccessibleIconFalse,
  StationComplexDot,
} from "../icons";
import { StationPopupProps } from "@/utils/types";

const StationPopup: React.FC<StationPopupProps> = ({
  complexName,
  elevators,
  totalElevators,
  totalRamps,
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
  lastUpdated,
  isOut,
  isProblem,
}) => {
  // OOS note state
  const [showOOS, setShowOOS] = useState(false);
  const [isAnimatingOOSOpen, setIsAnimatingOOSOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  //*** adding click listeners to show and hide notes */
  const wrapperRef = useRef<HTMLSpanElement>(null);

  // Close OOS note if clicked outside button or note
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showOOS &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        handleToggleOOS(false);
        setIsPressed(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOOS]);

  // toggle for Out of Service note at top of popup
  const handleToggleOOS = (open: boolean) => {
    if (open) {
      setShowOOS(true);
    } else {
      setIsAnimatingOOSOpen(false);
      setTimeout(() => setShowOOS(false), 300);
    }
  };

  useEffect(() => {
    if (showOOS) {
      const timer = setTimeout(() => setIsAnimatingOOSOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingOOSOpen(false);
    }
  }, [showOOS]);

  // accept "true"/"false" strings or booleans
  const toBool = (v?: boolean | string | null) =>
    typeof v === "string" ? v === "true" : Boolean(v);

  function getStationComplexStatus(
    isProblemBool: boolean,
    isOutBool: boolean,
    isPlain: boolean
  ) {
    if (isOutBool && !isPlain) return styles.colorBad; // outage (red)
    if (isOutBool && isPlain) return styles.colorBadPlain; // for out color w/ no background
    if (isProblemBool && !isPlain) return styles.colorWarning; // problem (yellow)
    if (isProblemBool && isPlain) return styles.colorWarningPlain; // for out color w/ no background
    if (!isProblemBool && !isOutBool && isPlain) return styles.colorGoodPlain;
    return styles.colorGood; // good (blue)
  }

  function getADAStyle(adaVal: string) {
    if (adaVal === "0") return styles.colorBadPlain; // inaccessible
    else return styles.colorGoodPlain;
  }

  const isProblemBool = toBool(isProblem);
  const isOutBool = toBool(isOut);
  const complexStatus = getStationComplexStatus(
    isProblemBool,
    isOutBool,
    false
  );
  const complexStatusPlain = getStationComplexStatus(
    isProblemBool,
    isOutBool,
    true
  );
  const accessibilityStatus = getADAStyle(ada);

  const ComplexStatusIconComponent = StationComplexDot;
  const AccessibleIconComponent =
    ada === "0" ? AccessibleIconFalse : AccessibleIconWhite;

  const oosCount = elevators.filter(
    (e) => e.estimatedreturntoservice !== "null" && e.estimatedreturntoservice?.trim().length > 0
  ).length;

  function generateSubwayLines(routeLines?: string | null) {
    if (!routeLines) return null;
    const lines = routeLines.split(" ").filter(Boolean);
    return lines.map((line) => (
      <span
        key={line}
        title={line}
        className={`${styles.lineIcon} ${styles.lineIconLarge}`}
      >
        {MTA_SUBWAY_LINE_ICONS[line] ?? line}
      </span>
    ));
  }

  function buildEquipmentText(totalElevators, totalRamps) {
    const parts = [];
  
    if (totalElevators > 0) {
      parts.push(`${toWords(totalElevators)} ${totalElevators > 1 ? "Elevators" : "Elevator"}`);
    }
  
    if (totalRamps > 0) {
      parts.push(`${toWords(totalRamps)} ${totalRamps > 1 ? "Ramps" : "Ramp"}`);
    }
  
    if (parts.length === 0) {
      return "There are no Elevators or Ramps at";
    }
  
    const joined = parts.join(" and ");
    const verb = (totalElevators + totalRamps) > 1 ? "are" : "is";
  
    return `There ${verb} ${joined} `;
  }
  

  return (
    <div className={styles.stationPopup}>
      <div className={styles.subtitle}>
        {ada === "0" ? (
          "This station is not accessible"
        ) : (
          <>
      {buildEquipmentText(totalElevators, totalRamps)}
      at
          </>
        )}
      </div>

      {/* STATION TITLE */}
      <h3 className={styles.title}>
        {complexName}
        <span
          className={`${styles.accessibleIconWrapper} ${accessibilityStatus} ${styles.nonInteractive}`}
        >
          <AccessibleIconComponent />
        </span>

        <span className={styles.OOSToggleWrapper} ref={wrapperRef}>
          {showOOS && (
            <div
              {...({ inert: !showOOS ? "true" : undefined } as any)}
              className={`${styles.OOSNote} ${
                isAnimatingOOSOpen ? styles.OOSNoteOpen : ""
              } ${complexStatus}`}
              role="dialog"
              aria-live="polite"
            >
              <div className={styles.OOSNoteBackground} />
              <button
                onClick={() => {
                  handleToggleOOS(false);
                  setIsPressed(false);
                }}
                className={styles.OOSNoteClose}
                aria-label="Close access note"
              >
                ×
              </button>
              <div>
                {totalElevators === 0 ? (
                  "No elevators at station"
                ) : totalElevators > 0 && oosCount === totalElevators ? (
                  "All elevators out of service"
                ) : totalElevators > 0 && oosCount === 0 ? (
                  "All elevators in service"
                ) : (
                  <>
                    {oosCount} {oosCount > 1 ? "elevators" : "elevator"} out of
                    service
                  </>
                )}
              </div>
            </div>
          )}

          {totalElevators > 0 ? (
            <button
              onClick={() => {
                handleToggleOOS(true);
                setIsPressed(true);
              }}
              className={styles.OOSIconButton}
              aria-label="Show number of OOS elevators"
              type="button"
            >
              <span
                className={`${
                  styles.accessibleIconWrapper
                } ${complexStatusPlain} ${isPressed ? styles.pressed : ""}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setIsPressed(!isPressed);
                }}
              >
                <div className={styles.dotWrapper}>
                <ComplexStatusIconComponent fill="currentColor" size={25} />
                </div>
              </span>
            </button>
          ) : (
            ""
          )}
        </span>
      </h3>

      {/* STATION ROUTES */}
      <div className={styles.stationRouteWrapper}>
        {ada !== "0"
          ? generateSubwayLines(route)
          : generateSubwayLines(inaccessibleRoutes)}
      </div>

      <div className={styles.inaccessibleRoutesWrapper}>
        {ada !== "0" && inaccessibleRoutes
          ? `${inaccessibleRoutes} not accessible`
          : null}
      </div>

      <div className={styles.adaNotesWrapper}>
        {ada_notes ? (
          <>
            <AccessibleIconWhite size={18} fill="currentColor" />
            <span>{ada_notes}</span>
          </>
        ) : null}
      </div>

      <div className={styles.elevatorCard}>
        <div className={styles.header}>
          {ada !== "0" ? "street level" : null}
        </div>

        {elevators.map((elevator, idx) =>
          toBool(elevator.isStreet) ? (
            <ElevatorCard
              key={elevator.elevatorno ?? `street-${idx}`}
              elevator={elevator}
              map={map}
              stationView={stationView}
              setStationView={setStationView}
              elevatorView={elevatorView}
              setElevatorView={setElevatorView}
              setShow3DToggle={setShow3DToggle}
            />
          ) : null
        )}

        {elevators.some((e) => !toBool(e.isStreet)) && (
          <div className={styles.header}>in the station</div>
        )}

        {elevators.map((elevator, idx) =>
          !toBool(elevator.isStreet) ? (
            <ElevatorCard
              key={elevator.elevatorno ?? `in-${idx}`}
              elevator={elevator}
              map={map}
              stationView={stationView}
              setStationView={setStationView}
              elevatorView={elevatorView}
              setElevatorView={setElevatorView}
              setShow3DToggle={setShow3DToggle}
            />
          ) : null
        )}

        {lastUpdated ? (
          <div className={styles.lastUpdated}>
            Last updated:{" "}
            {typeof lastUpdated === "string"
              ? new Date(lastUpdated).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : lastUpdated instanceof Date
              ? lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default StationPopup;
