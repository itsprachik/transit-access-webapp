import React, { useState, useEffect, useRef } from "react";
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
  const [showOOS, setShowOOS] = useState(false);
  const [isAnimatingOOSOpen, setIsAnimatingOOSOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const oosButtonRef = useRef<HTMLButtonElement>(null);



  const toBool = (v?: boolean | string | null) =>
    typeof v === "string" ? v === "true" : Boolean(v);

  const isAccessible = ada !== "0";
  const AccessibleIconComponent = isAccessible
    ? AccessibleIconWhite
    : AccessibleIconFalse;
  const accessibleStatusText = isAccessible
    ? "Station is accessible"
    : "Station is not accessible";

  const oosCount = elevators.filter(
    (e) =>
      e.estimatedreturntoservice !== "null" &&
      e.estimatedreturntoservice?.trim().length > 0
  ).length;

  const buildEquipmentText = (totalElevators: number, totalRamps: number) => {
    const parts = [];
    if (totalElevators > 0)
      parts.push(
        `${toWords(totalElevators)} ${
          totalElevators > 1 ? "Elevators" : "Elevator"
        }`
      );
    if (totalRamps > 0)
      parts.push(`${toWords(totalRamps)} ${totalRamps > 1 ? "Ramps" : "Ramp"}`)
    if (parts.length === 0) return "There are no Elevators or Ramps at";
    const joined = parts.join(" and ");
    const verb = totalElevators + totalRamps > 1 ? "are" : "is";
    return `There ${verb} ${joined}`;
  };

  const getStationComplexStatus = (
    isProblemBool: boolean,
    isOutBool: boolean,
    isPlain: boolean
  ) => {
    if (isOutBool && !isPlain) return styles.colorBad; // outage (red)
    if (isOutBool && isPlain) return styles.colorBadPlain; // outage plain
    if (isProblemBool && !isPlain) return styles.colorWarning; // warning (yellow)
    if (isProblemBool && isPlain) return styles.colorWarningPlain; // warning plain
    if (!isProblemBool && !isOutBool && isPlain) return styles.colorGoodPlain;
    return styles.colorGood; // good (blue)
  };

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

  const srAnnouncementRef = useRef<HTMLSpanElement>(null);

  // --- new state + builder ---
  const [announcement, setAnnouncement] = useState("");
  
  const buildAnnouncement = () => {
    const isAccessible = ada !== "0";
  
    const equipment = isAccessible
      ? `${buildEquipmentText(totalElevators, totalRamps)}.`
      : "";
  
    let oos = "";
    if (totalElevators > 0) {
      if (oosCount === 0) oos = "All elevators are in service.";
      else if (oosCount === totalElevators) oos = "All elevators are out of service.";
      else oos = `${oosCount} ${oosCount > 1 ? "elevators are" : "elevator is"} out of service.`;
    }
  
    const lines = isAccessible && route ? ` Accessible lines: ${route}.` : "";
    const adaNotes = ada_notes ? ` ${ada_notes}.` : "";
    const inac =
      inaccessibleRoutes
        ? ` Lines ${inaccessibleRoutes} not accessible.`
        : "";
  
    return isAccessible
      ? `${complexName} is an accessible station. ${equipment} ${oos}${lines}${adaNotes}${inac}`.replace(/\s+/g, " ")
      : `${complexName}${inaccessibleRoutes ? ` on line ${inaccessibleRoutes}` : ""} is not accessible.`;
  };
  
  //  focus the dialog on mount
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);
  
  //  update live region after mount and on relevant changes 
  useEffect(() => {
    const next = buildAnnouncement();
    // Clear, then set on next frame to guarantee a DOM change SRs can detect
    setAnnouncement("");
    const id = requestAnimationFrame(() => setAnnouncement(next));
    return () => cancelAnimationFrame(id);
  }, [
    complexName,
    ada,
    ada_notes,
    totalElevators,
    totalRamps,
    oosCount,
    route,
    inaccessibleRoutes,
  ]);

  const generateSubwayLines = (routeLines?: string | null) => {
    if (!routeLines) return null;
    return routeLines
      .split(" ")
      .filter(Boolean)
      .map((line) => (
        <span
          key={line}
          className={`${styles.lineIcon} ${styles.lineIconLarge}`}
          role="img"
          aria-label={`Line ${line}`}
        >
          {MTA_SUBWAY_LINE_ICONS[line] ?? line}
        </span>
      ));
  };

  // Close OOS if clicked outside
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOOS]);

  const handleToggleOOS = (open: boolean) => {
    if (open) {
      setShowOOS(true);
      setTimeout(() => setIsAnimatingOOSOpen(true), 10);
    } else {
      setIsAnimatingOOSOpen(false);
      setTimeout(() => setShowOOS(false), 300);
    }
  };

  return (
    <div
      ref={dialogRef}
      className={styles.stationPopup}
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-popup-title"
      aria-describedby="station-popup-desc"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          e.stopPropagation();
        }
      }}
    >
      {/* Equipment summary */}
      <div id="station-popup-desc" className={styles.subtitle}>
        {isAccessible
          ? `${buildEquipmentText(totalElevators, totalRamps)} at`
          : "This station is not accessible"}
      </div>

<h3 id="station-popup-title" className={styles.title}>
  {/* Station title text */}
  <span>{complexName}</span>

  {/* SCREEN READER POPUP ANNOUNCEMENT */}
  <span
  tabIndex={0}
  ref={srAnnouncementRef}
  className="sr-only"
  aria-live="polite"
>
  {isAccessible ? (
    <>
      {complexName} is an accessible station;{" "}
      {buildEquipmentText(totalElevators, totalRamps)};{" "}
      {totalElevators === 0 ? null : oosCount === 0 ? (
        "All elevators are in service."
      ) : oosCount === totalElevators ? (
        "All elevators are out of service."
      ) : (
        <>
          {oosCount} {oosCount > 1 ? "elevators are" : "elevator is"} out of
          service.
        </>
      )}{" "}
      Accessible lines: {route};
      <h3 id="station-popup-title" className={styles.title}>
  <span>{complexName}</span>
  <div className={styles.iconWrapper}>
    <AccessibleIconComponent />
  </div>

  {/* Visual dot + OOS button remain here */}
  {totalElevators > 0 && (
    <span
      className={styles.OOSToggleWrapper}
      ref={wrapperRef}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      {/* … your OOS button code … */}
    </span>
  )}
</h3>

{/* Screen reader announcement should be outside the heading */}
<span
  ref={srAnnouncementRef}
  className="sr-only"
  aria-live="polite"
>
  {isAccessible ? (
    <>
      {complexName} is an accessible station.{" "}
      {buildEquipmentText(totalElevators, totalRamps)}.{" "}
      {totalElevators === 0 ? null : oosCount === 0 ? (
        "All elevators are in service."
      ) : oosCount === totalElevators ? (
        "All elevators are out of service."
      ) : (
        `${oosCount} ${oosCount > 1 ? "elevators are" : "elevator is"} out of service.`
      )}{" "}
      Accessible lines: {route}.{" "}
      {ada_notes && <> {ada_notes}. </>}
      {inaccessibleRoutes && <> Line {inaccessibleRoutes} not accessible.</>}
    </>
  ) : (
    `${complexName} on line ${inaccessibleRoutes} is not accessible.`
  )}
</span>

      {inaccessibleRoutes && (
        <> ; Line {inaccessibleRoutes} not accessible.</>
      )}
    </>
  ) : (
    <>
      {complexName} on line {inaccessibleRoutes} is not accessible.
    </>
  )}

</span>

  {/* Accessibility icon */}
  <div className={`${styles.iconWrapper}`}>
    <AccessibleIconComponent />
  </div>

  {/* Visual complex dot + OOS button inline */}
  {totalElevators > 0 && (
    <span className={styles.OOSToggleWrapper} ref={wrapperRef} style={{ display: "inline-flex", alignItems: "center" }}>
      <button
        ref={oosButtonRef}
        type="button"
        className={styles.OOSIconButton}
        aria-label={`Show number of out-of-service elevators for ${complexName}`}
        aria-expanded={showOOS}
        aria-controls="oosNoteDesc"
        onClick={() => {
          handleToggleOOS(!showOOS);
          setIsPressed(!isPressed);
        }}
      >
      <span className={`${styles.iconWrapper} ${styles.complexIconWrapper} ${complexStatusPlain} ${isPressed ? styles.pressed : ""}`}>
          <StationComplexDot fill="currentColor" size={25} />
        </span>
      </button>

      {/* Visual OOS Note */}
      {showOOS && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="oosNoteTitle"
          aria-describedby="oosNoteDesc"
          className={`${styles.OOSNote} ${isAnimatingOOSOpen ? styles.OOSNoteOpen : ""} ${complexStatus}`}
        >
          <div className={styles.OOSNoteBackground} />
          <button
            onClick={() => {
              handleToggleOOS(false);
              setIsPressed(false);
              oosButtonRef.current?.focus();
            }}
            className={styles.OOSNoteClose}
            aria-label="Close out of service note"
          >
            ×
          </button>
          <div id="oosNoteTitle" className="sr-only">Elevators at Station</div>
          <div id="oosNoteDesc">
            {totalElevators === 0
              ? "No elevators at station"
              : oosCount === totalElevators
              ? "All elevators out of service"
              : oosCount === 0
              ? "All elevators in service"
              : `${oosCount} ${oosCount > 1 ? "elevators" : "elevator"} out of service`}
          </div>
        </div>
      )}
    </span>
  )}
</h3>




      {/* Subway lines */}
      <div className={styles.stationRouteWrapper}>
        {isAccessible
          ? generateSubwayLines(route)
          : generateSubwayLines(inaccessibleRoutes)}
      </div>
      {inaccessibleRoutes && ada!=="0" ? `${inaccessibleRoutes} not accessible` : ""}

      {/* ADA Notes */}
      {ada_notes && (
        <div className={styles.adaNotesWrapper}>
          <AccessibleIconWhite size={18} fill="currentColor" />
          <span>{ada_notes}</span>
        </div>
      )}

      {/* Elevators */}
      <div className={styles.elevatorCard}>
        <div className={styles.header}>
          {isAccessible ? "street level" : null}
        </div>

        {elevators
          .map((e, idx) =>
            toBool(e.isStreet) ? (
              <ElevatorCard
                key={e.elevatorno ?? `street-${idx}`}
                elevator={e}
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

        {elevators
          .map((e, idx) =>
            !toBool(e.isStreet) ? (
              <ElevatorCard
                key={e.elevatorno ?? `in-${idx}`}
                elevator={e}
                map={map}
                stationView={stationView}
                setStationView={setStationView}
                elevatorView={elevatorView}
                setElevatorView={setElevatorView}
                setShow3DToggle={setShow3DToggle}
              />
            ) : null
          )}

        {lastUpdated && (
          <div className={styles.lastUpdated}>
            Last updated:{" "}
            {new Date(lastUpdated).toLocaleTimeString([], {
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
