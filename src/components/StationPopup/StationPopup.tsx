import React, { useState, useEffect, useRef } from "react";
import ElevatorCard from "./ElevatorCard";
import styles from "@/components/StationPopup/station-popup.module.css";
import {
  AccessibleIconWhite,
  AccessibleIconFalse,
  StationComplexDot,
  ElevatorIcon,
  Ramp,
  LiftBad,
  LiftGood,
  WarnIcon,
} from "../icons";
import { StationPopupProps } from "@/utils/types";
import { generateSubwayLines } from "@/utils/dataUtils";

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
  complexAlert
}) => {
  const [showOOS, setShowOOS] = useState(false);
  const [isAnimatingOOSOpen, setIsAnimatingOOSOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const oosButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const contentAreaRef = useRef<HTMLDivElement>(null);
  const headerAreaRef = useRef<HTMLDivElement>(null);

  // popup expansion states
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Touch handling for swipe down
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // flyButtonState
  const [activeFlyButton, setActiveFlyButton] = useState<string | null>(null);

  const isMobile = navigator.maxTouchPoints > 0;

  const toBool = (v?: boolean | string | null) =>
    typeof v === "string" ? v === "true" : Boolean(v);

  const isAccessible = ada !== "0";

  // COMMENTED OUT FOR TESTING (do we need this to focus sr? likely not)
  // Focus management for modal
  // useEffect(() => {
  //   if (dialogRef.current) {
  //     dialogRef.current.focus();
  //   }
  // }, []);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);

    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isDownSwipe = distance < -minSwipeDistance;
    const isUpSwipe = distance > minSwipeDistance;

    if (isUpSwipe && !isExpanded) {
      setIsExpanded(true);
      setActiveFlyButton(null);
    }

    // Only collapse on downward swipe if we're expanded
    if (isDownSwipe && isExpanded) {
      setIsExpanded(false);
      setIsScrolled(false);
      if (activeFlyButton) setActiveFlyButton(null);
    }
  };

  const onTouchEnd = () => {

    const wasSwipeOrDrag = touchEnd !== null && Math.abs(touchStart - touchEnd) > 10; // e.g., 10px
  
    if (!wasSwipeOrDrag && touchStart !== null) {
      // This was a tap - toggle the expanded state
      setIsExpanded(!isExpanded);
      if (!isExpanded) setActiveFlyButton(null);
    }
    // Clean up touch tracking
    setTouchStart(null);
    setTouchEnd(null);
  };

  // SCROLL USE EFFECT
  useEffect(() => {
    const contentArea = contentAreaRef.current;
    if (!contentArea) return;

    const checkContentOverflow = () => {
      const hasOverflow = contentArea.scrollHeight > contentArea.clientHeight;

      if (!hasOverflow) {
        if (isExpanded) {
          if (isScrolled) {
            setIsScrolled(false);
          }
        }
        return;
      }

      const scrollTop = contentArea.scrollTop;

      // Use different thresholds to prevent oscillation
      const shouldCollapse = scrollTop > 45; // Higher threshold to collapse
      const shouldExpand = scrollTop < 15; // Lower threshold to expand

      if (shouldCollapse && !isScrolled) {
        setTimeout(() => {
          setIsScrolled(true);
        }, 10);
      } else if (shouldExpand && isScrolled) {
        setTimeout(() => setIsScrolled(false), 10);
      }
      // Do nothing in the middle zone (15-35px) to prevent oscillation
    };

    checkContentOverflow();

    const resizeObserver = new ResizeObserver(checkContentOverflow);
    resizeObserver.observe(contentArea);

    contentArea.addEventListener("scroll", checkContentOverflow);

    return () => {
      resizeObserver.disconnect();
      contentArea.removeEventListener("scroll", checkContentOverflow);
    };
  }, [isScrolled, isExpanded, activeFlyButton]);

  useEffect(() => {
    if (activeFlyButton) {
      setIsExpanded(false);
      setIsScrolled(false);
    }
  }, [activeFlyButton]);

  const AccessibleIconComponent = (fill?: string, size?: number) => {
    const Icon = isAccessible ? AccessibleIconWhite : AccessibleIconFalse;

    return <Icon fill={fill} size={size} aria-hidden="true" />;
  };

  const oosCount = elevators.filter(
    (e) =>
      e.estimatedreturntoservice !== "null" &&
      e.estimatedreturntoservice?.trim().length > 0
  ).length;

  // Helper functions for accessibility announcements
  const getAccessibilityStatus = () => {
    if (ada === "0") return "This station is not A.D.A. accessible";
    if (ada === "2") return "This station is partially accessible";
    return "This station is fully accessible";
  };

  const getElevatorStatusText = () => {
    if (totalElevators === 0) return "No elevators at this station";
    if (oosCount === totalElevators)
      return `All ${totalElevators} elevators are out of service`;
    if (oosCount === 0) return `All ${totalElevators} elevators are in service`;
    return `${oosCount} of ${totalElevators} elevators are out of service`;
  };

  const getSubwayLinesText = (lines: string) => {
    return lines.split(" ").filter(Boolean).join(", ");
  };

  const buildEquipmentText = (totalElevators: number, totalRamps: number) => {
    if (totalElevators === 0 && totalRamps === 0)
      return "No elevators or ramps";

    const srParts = [];
    const visualParts = [];

    if (totalElevators > 0) {
      srParts.push(
        `${totalElevators} ${totalElevators > 1 ? "elevators" : "elevator"}`
      );

      visualParts.push(
        <span
          key="elevators"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          aria-hidden="true"
        >
          <ElevatorIcon size={15} />
          {totalElevators} {totalElevators > 1 ? "elevators" : "elevator"}
        </span>
      );
    }

    if (totalRamps > 0) {
      srParts.push(`${totalRamps} ${totalRamps > 1 ? "ramps" : "ramp"}`);

      visualParts.push(
        <span
          key="ramps"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.25rem",
          }}
          aria-hidden="true"
        >
          <Ramp size={15} />
          {totalRamps} {totalRamps > 1 ? "ramps" : "ramp"}
        </span>
      );
    }

    return (
      <>
        <span className="sr-only">{srParts.join(" and ")} at station</span>
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {visualParts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < visualParts.length - 1 && " "}
            </React.Fragment>
          ))}
          {" at station"}
        </div>
      </>
    );
  };

  const getStationComplexStatus = (
    isProblemBool: boolean,
    isOutBool: boolean,
    isPlain: boolean,
    totalElevators?: number
  ) => {
    if (totalElevators === 0) return styles.colorNeutral;
    if (isOutBool && !isPlain) return styles.colorBad; // outage (red)
    if (isOutBool && isPlain) return styles.colorBadPlain; // outage plain
    if (isProblemBool && !isPlain) return styles.colorWarning; // warning (yellow)
    if (isProblemBool && isPlain) return styles.colorWarningPlain; // warning plain
    if (!isProblemBool && !isOutBool && isPlain) return styles.colorGoodPlain;
    return styles.colorGood; // good (blue)
  };

  const getADAStatus = (ada: string, isPlain?: boolean) => {
    if (isPlain === true) {
      if (ada === "0") return styles.colorBadPlain;
      else return styles.colorGoodPlain;
    }
    if (ada === "0") return styles.colorBad;
    return styles.colorGood;
  };

  const isProblemBool = toBool(isProblem);
  const isOutBool = toBool(isOut);

  const complexStatus = getStationComplexStatus(
    isProblemBool,
    isOutBool,
    false, // light yellow background, dark yellow text
    totalElevators
  );
  const adaStatus = getADAStatus(ada);
  const adaStatusPlain = getADAStatus(ada, true);
  const adaColor = ada === "0" ? "#c80000" : "#055765";
  const complexStatusPlain = getStationComplexStatus(
    isProblemBool,
    isOutBool,
    true // bright yellow color, no background
  );

  // Close OOS if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showOOS &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        handleToggleOOS(false);
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
    <section
      ref={dialogRef}
      id="station-popup"
      className={`${styles.stationPopup} ${isExpanded ? styles.expanded : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-popup-title"
      aria-describedby="station-summary"
      tabIndex={-1}
    >
      <div
        className={`${styles.popupHeader} ${isScrolled ? styles.scrolled : ""}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* announcement for future sr version, don't delete yet */}
        {/* <div id="station-summary" className="sr-only">
        {getAccessibilityStatus()}. {getElevatorStatusText()}.
        {route && ` Subway lines: ${getSubwayLinesText(route)}.`}
      </div> */}
        {isMobile && (
          <div aria-hidden="true" className="flex justify-center p-2">
            <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        <h1
          id="station-popup-title"
          className={`${styles.title} ${isMobile ? "" : styles.desktop} ${
            isScrolled ? styles.scrolled : ""
          }`}
        >
          {/* Station title text */}
          {complexName}

          {/* Accessibility icon - now properly labeled */}
          <div
            className={`${styles.iconWrapper} ${adaStatus}`}
            aria-hidden="true"
          >
            {AccessibleIconComponent(adaColor, isScrolled ? 16 : 24)}
          </div>
          <span className="sr-only">
            {isAccessible
              ? "station is accessible"
              : "station is not A.D.A. accessible"}
          </span>
        </h1>
      </div>
      <div ref={contentAreaRef} className={styles.popupContent}>
        <section id="station-info">
          {/* Accessible Subway lines */}
          <h2 className={`${styles.stationRouteWrapper}`}>
            {isAccessible
              ? generateSubwayLines(route, "big", ada, true, styles) // true/false indicates isTitle
              : generateSubwayLines(
                  inaccessibleRoutes,
                  "big",
                  ada,
                  true,
                  styles
                )}
          </h2>

          {/* Inaccessible lines section */}
          {inaccessibleRoutes && ada !== "0" && (
            <h2 className={`${styles.stationRouteWrapper}`}>
              {inaccessibleRoutes ? (
                <>
                  {generateSubwayLines(
                    inaccessibleRoutes,
                    "small",
                    "0",
                    true,
                    styles
                  )}{" "}
                  {/* // true/false indicates isTitle */}
                  <div className={styles.adaNotesWrapper} aria-hidden="true">
                    <span>
                      not<span aria-hidden="true"> ADA </span>
                      <span className="sr-only">A.D.A.</span>
                      accessible
                    </span>
                    <AccessibleIconFalse size={15} fill="#111111" />
                  </div>
                </>
              ) : (
                ""
              )}
            </h2>
          )}
          {complexAlert.length > 0 && (
  <div className={styles.alertHeader}>
    <div>{complexAlert.length>1 ? `Alerts:`: `Alert:`}</div>
    <div className={styles.alert}>
      {complexAlert.map((alert: string, index: number) => (
        <div key={index} aria-label={`Station alert: ${alert}`}>
          {alert}
        </div>
      ))}
    </div>
  </div>
)}

          {/* ADA Notes */}
          {ada_notes && (
            <div
              className={`${styles.adaNotesWrapper}`}
              aria-label={`Station accessibility notes: Accessible ${ada_notes}`}
            >
              <span aria-hidden="true">
                <AccessibleIconWhite size={18} fill="currentColor" />
              </span>
              <span aria-hidden="true">{ada_notes}</span>
            </div>
          )}
        </section>

        {/* Equipment summary */}
        <section className={`${styles.equipmentWrapper}`}>
          {ada === "0" && (
            <div className={`${styles.equipmentRowOneWrapper} ${adaStatus}`}>
              This station is not ADA accessible
            </div>
          )}
          <div className={styles.equipmentRowTwoWrapper}>
            {totalElevators > 0 && (
              <div className={`${styles.equipmentStatus} ${complexStatus}`}>
                {totalElevators === 0 && totalRamps === 0 ? (
                  <span>No elevators at station</span>
                ) : oosCount === totalElevators ? (
                  <>
                    <span aria-hidden="true">
                      <LiftBad size={20} />
                    </span>
                    <span>All elevators out of service</span>
                  </>
                ) : oosCount === 0 ? (
                  <>
                    <span aria-hidden="true">
                      <LiftGood size={20} />
                    </span>
                    <span>All elevators in service</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">
                      <LiftBad size={20} aria-hidden="true" />
                    </span>
                    <span>
                      {oosCount} {oosCount > 1 ? "elevators" : "elevator"} out
                      of service
                    </span>
                  </>
                )}
              </div>
            )}
            <div className={`${styles.equipmentCount} ${styles.colorNeutral}`}>
              {totalElevators > 0 || totalRamps > 0 ? (
                <>{buildEquipmentText(totalElevators, totalRamps)}</>
              ) : (
                "No elevators or ramps"
              )}
            </div>
          </div>
        </section>

        <section
          className={styles.elevatorCard}
          id="elevators-at-station"
          role="region"
          aria-label="Elevator details"
        >
          {elevators.some((e) => toBool(e.isStreet)) && (
            <>
              {/* Street level elevators */}
              <h2 className="sr-only">Street Level Elevators</h2>
              <h2 aria-hidden="true" className={`${styles.header}`}>
                Street Level
              </h2>
            </>
          )}

          {elevators
            .filter((e) => toBool(e.isStreet))
            .sort((a, b) => {
              // Out of service elevators first (true > false)
              return (toBool(b.isOut) ? 1 : 0) - (toBool(a.isOut) ? 1 : 0);
            })
            .map((e, idx) => (
              <div
                key={e.elevatorno ?? `st-${idx}`}
                className={`${styles.cardWrapperStreet} ${
                  e.isOut
                    ? `${styles.colorBadFaint} ${
                        e.isRedundant == "0" ? styles.colorBadPlain : ""
                      }`
                    : ""
                }`}
              >
                <ElevatorCard
                  elevator={e}
                  map={map}
                  stationView={stationView}
                  setStationView={setStationView}
                  elevatorView={elevatorView}
                  setElevatorView={setElevatorView}
                  setShow3DToggle={setShow3DToggle}
                  activeFlyButton={activeFlyButton}
                  setActiveFlyButton={setActiveFlyButton}
                />
              </div>
            ))}

          {elevators.some((e) => !toBool(e.isStreet)) && (
            <>
              <h2 className="sr-only">Elevators in the Station</h2>
              <h2 aria-hidden="true" className={`${styles.header}`}>
                In the Station
              </h2>
            </>
          )}
          {/* In-station elevators */}
          {elevators
            .filter((e) => !toBool(e.isStreet))
            .sort((a, b) => {
              // Out of service elevators first (true > false)
              return (toBool(b.isOut) ? 1 : 0) - (toBool(a.isOut) ? 1 : 0);
            })
            .map((e, idx) => (
              <div
                key={e.elevatorno ?? `in-${idx}`}
                className={`${styles.cardWrapperPlatform} ${
                  e.isOut
                    ? `${styles.colorBadFaint} ${
                        e.isRedundant == "0" ? styles.colorBadPlain : ""
                      }`
                    : ""
                }`}
              >
                <ElevatorCard
                  elevator={e}
                  map={map}
                  stationView={stationView}
                  setStationView={setStationView}
                  elevatorView={elevatorView}
                  setElevatorView={setElevatorView}
                  setShow3DToggle={setShow3DToggle}
                  activeFlyButton={activeFlyButton}
                  setActiveFlyButton={setActiveFlyButton}
                />
              </div>
            ))}
        </section>
      </div>
      {lastUpdated && (
        <div className={styles.lastUpdated}>
          <span>
            Last updated:{" "}
            {new Date(lastUpdated).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
          </span>
        </div>
      )}
    </section>
  );
};

export default StationPopup;
