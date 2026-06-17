import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
} from "react";
import styles from "./nearby-stations.module.css";
import stationStyles from "@/components/StationPopup/station-popup.module.css";
import {
  AccessibleIconWhite,
  LiftBad,
  LiftGood,
  WarnIcon,
  ElevatorIcon,
  ElevatorInvertedIcon,
  Ramp,
} from "../icons";
import { FaPersonWalking } from "react-icons/fa6";
import { FaStar, FaWrench } from "react-icons/fa";
import { FiChevronRight } from "react-icons/fi";
import { userIsInBounds } from "@/components/MtaMap/mtaMapOptions";
import {
  getNearbyComplexes,
  getElevatorsByComplexId,
  getComplexOutageLayerFeatures,
  getComplexMaintenanceToday,
  distanceMiles,
  generateSubwayLines,
  WALKING_DISTANCE_FACTOR,
} from "@/utils/dataUtils";

type PanelState = "minimized" | "collapsed" | "expanded";

type Props = {
  userLocation: [number, number] | null;
  overrideLocation?: [number, number] | null;
  elevatorData: any[] | null;
  stationData: any[] | null;
  upcomingElevatorData?: any[] | null;
  onStationSelect: (
    feature: any,
    walkingToleranceMiles?: number | null,
  ) => void;
  lastUpdated: Date | null;
  stationPopupOpen: boolean;
  locateSignal: number;
  minimizeSignal?: number;
  onRadiusChange?: (radius: number | null) => void;
  onMinimizedChange?: (minimized: boolean) => void;
  onPanelStateChange?: (state: PanelState) => void;
  onRef?: (el: HTMLElement | null) => void;
};

const NearbyStationsPopup: React.FC<Props> = ({
  userLocation,
  overrideLocation,
  elevatorData,
  stationData,
  upcomingElevatorData,
  onStationSelect,
  lastUpdated,
  stationPopupOpen,
  locateSignal,
  minimizeSignal,
  onRadiusChange,
  onMinimizedChange,
  onPanelStateChange,
  onRef,
}) => {
  const [panelState, setPanelState] = useState<PanelState>("collapsed");
  const [radius, setRadius] = useState<number | null>(1);
  const [distanceSource, setDistanceSource] = useState<"gps" | "override">(
    "gps",
  );
  const [fallbackLocation, setFallbackLocation] = useState<
    [number, number] | null
  >(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const pullTabRef = useRef<HTMLButtonElement>(null);
  const minSwipeDistance = 50;
  // tracks whether the panel was minimized specifically because a station popup opened,
  // so we can restore it when that popup closes (e.g. back button) without forcing
  // the panel open when the user closed an unrelated station popup
  const minimizedByPopup = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    onMinimizedChange?.(panelState === "minimized");
    onPanelStateChange?.(panelState);
  }, [panelState]);

  useEffect(() => {
    onRef?.(panelRef.current);
    return () => onRef?.(null);
  }, []);

  // Apply inert on desktop when minimized so off-screen content is unreachable by keyboard/AT
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (isDesktop && panelState === "minimized") {
      el.setAttribute("inert", "");
    } else {
      el.removeAttribute("inert");
    }
  }, [isDesktop, panelState]);

  // Scroll pills to midpoint and keep edge masks in sync with scroll position
  useLayoutEffect(() => {
    const container = pillsRef.current;
    if (!container) return;

    container.scrollLeft =
      (container.scrollWidth - container.clientWidth) / 1.5; // shifted a little right of center

    const updateMask = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const atLeft = scrollLeft <= 1;
      const atRight = scrollLeft + clientWidth >= scrollWidth - 1;
      const mask =
        atLeft && atRight
          ? "none"
          : atLeft
            ? "linear-gradient(to right, black 90%, transparent 100%)"
            : atRight
              ? "linear-gradient(to right, transparent 0%, black 10%)"
              : "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)";
      container.style.setProperty("mask-image", mask);
      container.style.setProperty("-webkit-mask-image", mask);
    };

    updateMask();
    container.addEventListener("scroll", updateMask);
    return () => container.removeEventListener("scroll", updateMask);
  }, []);

  // When "All" is selected and the Mapbox geolocate hasn't fired (e.g. user is out of
  // bounds), request the real location directly so distances are accurate.
  useEffect(() => {
    if (radius !== null || userLocation || fallbackLocation) return;
    navigator.geolocation?.getCurrentPosition(
      ({ coords: { longitude, latitude } }) =>
        setFallbackLocation([longitude, latitude]),
    );
  }, [radius, userLocation, fallbackLocation]);

  const resolvedLocation =
    overrideLocation ??
    userLocation ??
    (radius === null ? fallbackLocation : null);

  const userInBounds =
    userLocation !== null && userIsInBounds(userLocation[0], userLocation[1]);

  const canToggleDistance = !!overrideLocation && !!userLocation;

  useEffect(() => {
    if (!overrideLocation) setDistanceSource("gps");
  }, [overrideLocation]);

  const stationsNearby = useMemo(() => {
    if (!resolvedLocation && radius !== null) return [];
    if (!resolvedLocation) return [];
    const [lng, lat] = resolvedLocation;
    if (radius === null) return getNearbyComplexes(lng, lat, Infinity);

    // radius is a walking-distance value; convert to crow-flies for the spatial filter
    const crowFliesRadius = radius / WALKING_DISTANCE_FACTOR;

    // Fetch with a 0.1 mi buffer so complexes whose centroid is slightly beyond
    // the radius but whose nearest street elevator is within it aren't missed.
    const candidates = getNearbyComplexes(lng, lat, crowFliesRadius + 0.1);

    return candidates
      .map((complex) => {
        const elevators = getElevatorsByComplexId(
          complex.properties.complex_id,
        );
        const streetEls = elevators.filter((el: any) =>
          typeof el.properties.isStreet === "string"
            ? el.properties.isStreet === "true"
            : Boolean(el.properties.isStreet),
        );
        const nearestDist =
          streetEls.length > 0
            ? Math.min(
                ...streetEls.map((el: any) => {
                  const [elLng, elLat] = el.geometry.coordinates;
                  return distanceMiles(lng, lat, elLng, elLat);
                }),
              )
            : complex.distance;
        return { ...complex, distance: nearestDist };
      })
      .filter((c) => c.distance <= crowFliesRadius + 0.05)
      .sort((a, b) => a.distance - b.distance);
  }, [resolvedLocation, radius]);

  // Distances shown to the user always come from the real GPS location, even
  // when the list is centred on the map-drag override location.
  const userDistances = useMemo(() => {
    if (!userLocation || stationsNearby.length === 0) return null;
    const [lng, lat] = userLocation;
    const map = new Map<string, number>();
    for (const complex of stationsNearby) {
      const id = complex.properties.complex_id;
      const elevators = getElevatorsByComplexId(id);
      const streetEls = elevators.filter((el: any) =>
        typeof el.properties.isStreet === "string"
          ? el.properties.isStreet === "true"
          : Boolean(el.properties.isStreet),
      );
      const dist =
        streetEls.length > 0
          ? Math.min(
              ...streetEls.map((el: any) => {
                const [elLng, elLat] = el.geometry.coordinates;
                return distanceMiles(lng, lat, elLng, elLat);
              }),
            )
          : distanceMiles(
              lng,
              lat,
              complex.geometry.coordinates[0],
              complex.geometry.coordinates[1],
            );
      map.set(id, dist);
    }
    return map;
  }, [userLocation, stationsNearby]);

  const complexOutageById = useMemo(() => {
    if (!stationData) return new Map();
    const features = getComplexOutageLayerFeatures(stationData);
    return new Map(
      features.map((f) => [f.properties.complex_id, f.properties]),
    );
  }, [stationData]);

  // Minimize when a station popup opens; restore when it closes via back button
  useEffect(() => {
    if (stationPopupOpen) {
      minimizedByPopup.current = true;
      setPanelState("minimized");
    } else if (minimizedByPopup.current) {
      minimizedByPopup.current = false;
      setPanelState("collapsed");
      if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0;
      setIsScrolled(false);
    }
  }, [stationPopupOpen]);

  // Expand to collapsed each time the user actively taps the geolocate button
  useEffect(() => {
    if (locateSignal > 0) setPanelState("collapsed");
  }, [locateSignal]);

  useEffect(() => {
    if (minimizeSignal > 0) setPanelState("minimized");
  }, [minimizeSignal]);

  useEffect(() => {
    onRadiusChange?.(radius);
  }, [radius]);

  // If location is known but nothing is nearby, make sure the message is visible
  useEffect(() => {
    if (userLocation && stationsNearby.length === 0) {
      setPanelState((p) => (p === "minimized" ? "collapsed" : p));
    }
  }, [userLocation, stationsNearby.length]);

  // Clicking the map canvas → minimize; drags and other UI elements do not
  useEffect(() => {
    let downX = 0;
    let downY = 0;
    const onMouseDown = (e: MouseEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onMouseClick = (e: MouseEvent) => {
      const moved =
        Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5;
      if (
        !moved &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        e.target instanceof HTMLCanvasElement
      ) {
        setPanelState("minimized");
        if (isDesktop) setTimeout(() => pullTabRef.current?.focus(), 320);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("click", onMouseClick);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("click", onMouseClick);
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const currentY = e.targetTouches[0].clientY;
    setTouchEnd(currentY);
    if (!touchStart) return;
    const delta = touchStart - currentY;

    if (delta > minSwipeDistance) {
      // swipe up → expand
      setPanelState((p) => {
        if (p === "minimized") return "collapsed";
        if (p === "collapsed") return "expanded";
        return p;
      });
    } else if (delta < -minSwipeDistance) {
      // swipe down → collapse
      setPanelState((p) => {
        if (p === "expanded") {
          setIsScrolled(false);
          return "collapsed";
        }
        if (p === "collapsed") return "minimized";
        return p;
      });
    }
  };

  const lastTouchEndTime = useRef(0);

  const cycleState = () =>
    setPanelState((p) => {
      const next =
        p === "minimized"
          ? "collapsed"
          : p === "collapsed"
            ? "expanded"
            : "collapsed";
      if (isDesktop && p === "minimized") {
        // returning from desktop slide-out — move focus to panel heading
        setTimeout(() => titleRef.current?.focus(), 50);
      }
      return next;
    });

  const onTouchEnd = () => {
    lastTouchEndTime.current = Date.now();
    const wasSwipe = touchEnd !== null && Math.abs(touchStart - touchEnd) > 10;
    if (!wasSwipe && touchStart !== null) {
      cycleState();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Desktop-only click handler — skipped on mobile where onTouchEnd already handled it
  const handleHeaderClick = () => {
    if (Date.now() - lastTouchEndTime.current < 500) return;
    cycleState();
  };

  useEffect(() => {
    const el = contentAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const top = el.scrollTop;
      if (top > 45 && !isScrolled) setTimeout(() => setIsScrolled(true), 10);
      else if (top < 15 && isScrolled)
        setTimeout(() => setIsScrolled(false), 10);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [isScrolled]);

  const formatDist = (miles: number) => {
    if (miles < 0.25) return `${Math.round(miles * 5280).toLocaleString()} ft`;
    if (Math.abs(miles - 0.25) <= 0.001) return "¼ mi";
    if (Math.abs(miles - 0.5) <= 0.001) return "½ mi";
    if (Math.abs(miles - 0.75) <= 0.001) return "¾ mi";
    return `${miles % 1 === 0 ? miles : miles.toFixed(1)} mi`;
  };

  const toBool = (v?: boolean | string | null) =>
    typeof v === "string" ? v === "true" : Boolean(v);

  const panelClass =
    panelState === "minimized"
      ? styles.minimized
      : panelState === "expanded"
        ? styles.expanded
        : "";

  return (
    <>
      {isDesktop && panelState === "minimized" && (
        <button
          ref={pullTabRef}
          className={styles.pullTab}
          onClick={cycleState}
          aria-label="Open nearby stations panel"
          aria-expanded={false}
          aria-controls="nearby-stations-popup"
        >
          <span className={styles.pullTabLabel} aria-hidden="true">
            Nearby
          </span>
          <span className={styles.pullTabChevron} aria-hidden="true">
            ›
          </span>
        </button>
      )}
      <section
        ref={panelRef}
        id="nearby-stations-popup"
        className={`${styles.nearbyPopup} ${panelClass}`}
        role="complementary"
        aria-label="Nearby accessible stations"
      >
        <div
          className={`${styles.popupHeader} ${isScrolled ? styles.scrolled : ""}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={handleHeaderClick}
          style={{ cursor: "pointer" }}
        >
          {/* Grab bar inside header so sticky positioning can never cover it */}
          <div className={styles.grabBar} aria-hidden="true">
            <span />
          </div>
          <h1
            ref={titleRef}
            tabIndex={-1}
            id="nearby-popup-title"
            className={`${styles.title} ${isScrolled ? styles.scrolled : ""}`}
          >
            Nearby Accessible Stations
            <span className={`${styles.iconWrapper} ${styles.colorGood}`}>
              {" "}
              <AccessibleIconWhite
                size={isScrolled ? 14 : 20}
                fill="#055765"
                aria-hidden="true"
              />
            </span>
          </h1>
        </div>

        <div ref={contentAreaRef} className={styles.popupContent}>
          <div
            className={styles.radiusBar}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            role="group"
            aria-label="Walking distance radius"
          >
            <span className={styles.radiusLabel} aria-hidden="true">
              <FaPersonWalking />
              <AccessibleIconWhite fill="#555555" size={13} />
              Walking tolerance
            </span>
            <div
              ref={pillsRef}
              className={styles.radiusPills}
              role="radiogroup"
              aria-label="Radius"
            >
              {(
                [
                  { label: "50 ft", value: 50 / 5280 },
                  { label: "100 ft", value: 100 / 5280 },
                  { label: "500 ft", value: 500 / 5280 },
                  { label: "¼ mi", value: 0.25 },
                  { label: "½ mi", value: 0.5 },
                  { label: "1 mi", value: 1 },
                  { label: "1.5 mi", value: 1.5 },
                  { label: "2 mi", value: 2 },
                  { label: "3 mi", value: 3 },
                  { label: "∞ infinity", value: null },
                ] as { label: string; value: number | null }[]
              ).map(({ label, value }) => {
                const active =
                  value === null
                    ? radius === null
                    : radius !== null && Math.abs(value - radius) < 0.001;
                return (
                  <button
                    key={label}
                    role="radio"
                    aria-checked={active}
                    className={`${styles.radiusPill} ${active ? styles.radiusPillActive : ""}`}
                    onClick={() => {
                      setRadius(value);
                      setPanelState((p) =>
                        p === "minimized" ? "collapsed" : p,
                      );
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {!resolvedLocation && locateSignal === 0 ? (
            <p className={styles.prompt}>
              Tap the location button to see nearby accessible stations.
            </p>
          ) : stationsNearby.length === 0 ? (
            <p className={styles.prompt}>
              {radius === null
                ? "No accessible stations found."
                : `No accessible stations within ${formatDist(radius)} of you.`}
            </p>
          ) : (
            stationsNearby.map((complex) => {
              const complexId = complex.properties.complex_id;
              const ada = complex.properties.ada;
              const routes = complex.properties.route || "";
              const firstStationId = (complex.properties.station_ids || "")
                .split("/")[0]
                .trim();
              const ada_notes = complex.properties.ada_notes;

              const elevators = getElevatorsByComplexId(complexId);

              const outage = complexOutageById.get(complexId);
              const isOut = outage?.isOut ?? false;
              const isProblem = outage?.isProblem ?? false;

              const oosCount = elevators.filter((el: any) =>
                elevatorData?.some(
                  (out) =>
                    out.elevatorNo?.toLowerCase() ===
                    el.properties.elevatorno?.toLowerCase(),
                ),
              ).length;

              const stationFeature = {
                geometry: complex.geometry,
                properties: {
                  complex_id: complexId,
                  station_id: firstStationId,
                  ada_notes: ada_notes || null,
                },
              };

              const displayDist =
                canToggleDistance && distanceSource === "override"
                  ? complex.distance
                  : (userDistances?.get(complexId) ?? complex.distance);
              const maintenanceLabel = getComplexMaintenanceToday(
                complexId,
                upcomingElevatorData,
              );
              const walkingDist = displayDist * WALKING_DISTANCE_FACTOR;

              return (
                <div
                  key={complexId}
                  className={`${styles.stationRow} ${isOut ? styles.outage : isProblem ? styles.warning : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${complex.properties.stop_name}, ${formatDist(walkingDist)} away${isOut ? ", elevator outage" : isProblem ? ", partial elevator outage" : ""}. Tap for details.`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStationSelect(
                      stationFeature,
                      distanceSource === "gps" ? radius : 0,
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onStationSelect(
                        stationFeature,
                        distanceSource === "gps" ? radius : 0,
                      );
                    }
                  }}
                >
                  <div className={styles.nameRow}>
                    <div className={styles.stationMain}>
                      {/* Name, routes */}
                      <div className={styles.nameAndLines}>
                        <span className={styles.stationName}>
                          {complex.properties.stop_name}
                        </span>
                        <div aria-hidden="true" className={styles.linesWrapper}>
                          {generateSubwayLines(
                            routes,
                            "small",
                            ada,
                            false,
                            stationStyles,
                          )}
                        </div>
                        {(userInBounds || !!overrideLocation) && (
                          <span
                            className={`${styles.distanceGroup}${canToggleDistance ? ` ${styles.distanceGroupToggleable}` : ""}`}
                            onClick={
                              canToggleDistance
                                ? (e) => {
                                    e.stopPropagation();
                                    setDistanceSource((s) =>
                                      s === "gps" ? "override" : "gps",
                                    );
                                  }
                                : undefined
                            }
                            onKeyDown={
                              canToggleDistance
                                ? (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDistanceSource((s) =>
                                        s === "gps" ? "override" : "gps",
                                      );
                                    }
                                  }
                                : undefined
                            }
                            role={canToggleDistance ? "button" : undefined}
                            tabIndex={canToggleDistance ? 0 : undefined}
                            aria-label={
                              canToggleDistance
                                ? `${distanceSource === "gps" ? "GPS" : "Map center"} distance: ${formatDist(displayDist)}. Tap to switch.`
                                : undefined
                            }
                          >
                            {!!overrideLocation &&
                              (!userInBounds ||
                                distanceSource === "override") && (
                                <span
                                  className={`${styles.distanceSourceDot} ${styles.dotBrown}`}
                                  aria-hidden="true"
                                />
                              )}
                            <span
                              className={styles.inlineDistance}
                              aria-hidden="true"
                            >
                              {formatDist(walkingDist)}
                            </span>
                            {userInBounds &&
                              distanceSource === "gps" &&
                              radius !== null &&
                              displayDist <=
                                radius / WALKING_DISTANCE_FACTOR && (
                                <span
                                  className={styles.walkTime}
                                  aria-hidden="true"
                                >
                                  <FaPersonWalking color="#737272" size={10} />
                                  {Math.max(
                                    1,
                                    Math.round(walkingDist * 20),
                                  )}{" "}
                                  min
                                </span>
                              )}
                          </span>
                        )}
                        {ada_notes && (
                          <div className={styles.adaNoteRow}>
                            <span
                              className={styles.adaNote}
                              aria-label={`Accessibility note: ${ada_notes}`}
                            >
                              <AccessibleIconWhite
                                size={11}
                                fill="currentColor"
                                aria-hidden="true"
                              />
                              <span aria-hidden="true">{ada_notes}</span>
                            </span>
                          </div>
                        )}
                        {maintenanceLabel && (
                          <div className={styles.maintenanceRow}>
                            <span
                              className={styles.maintenanceBadge}
                              aria-label={`Maintenance ${maintenanceLabel}`}
                            >
                              <FaWrench size={9} aria-hidden="true" />
                              <span aria-hidden="true">
                                maintenance {maintenanceLabel}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={styles.elevatorStatusLine}>
                        {isOut ? (
                          <>
                            <LiftBad
                              size={20}
                              fill="#c80000e6"
                              aria-hidden="true"
                            />{" "}
                            All elevators out of service
                          </>
                        ) : isProblem ? (
                          <>
                            <WarnIcon
                              fill="#ffb700"
                              size={20}
                              aria-hidden="true"
                            />{" "}
                            {oosCount}{" "}
                            {oosCount === 1 ? "elevator" : "elevators"} out of
                            service
                          </>
                        ) : elevators.length > 0 ? (
                          <>
                            <LiftGood
                              size={20}
                              fill="#2bb9cfe6"
                              aria-hidden="true"
                            />{" "}
                            All elevators in service
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className={styles.rowRight}>
                      <FiChevronRight
                        size={16}
                        color="#727272"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {elevators.some((el) =>
                    elevatorData?.some(
                      (out) =>
                        out.elevatorNo?.toLowerCase() ===
                        el.properties.elevatorno?.toLowerCase(),
                    ),
                  ) && (
                    <div className={styles.elevatorList}>
                      {elevators
                        .filter((el) =>
                          elevatorData?.some(
                            (out) =>
                              out.elevatorNo?.toLowerCase() ===
                              el.properties.elevatorno?.toLowerCase(),
                          ),
                        )
                        .map((el, idx) => {
                          const isRamp = el.properties.elevatorno
                            ?.toLowerCase()
                            .includes("ra");
                          const lines = (el.properties.linesServed || "")
                            .replace(/-/g, "")
                            .replaceAll("/", " ");
                          const direction = el.properties.directionLabel || "";

                          return (
                            <div
                              key={el.properties.elevatorno ?? idx}
                              className={styles.oosElevatorCard}
                              aria-label={`${isRamp ? "Ramp" : "Elevator"}${direction ? `, ${direction}` : ""}, out of service`}
                            >
                              <span
                                className={styles.oosThumb}
                                aria-hidden="true"
                              >
                                <span className={styles.oosThumbBadge}>
                                  <LiftBad size={14} fill="#C80000e6" />
                                </span>
                                {isRamp ? (
                                  <Ramp size={20} />
                                ) : toBool(el.properties.isStreet) ? (
                                  <ElevatorIcon size={20} />
                                ) : (
                                  <ElevatorInvertedIcon size={20} />
                                )}
                              </span>
                              <span className={styles.oosCardText}>
                                <div className={`${styles.oosCardTitle}`}>
                                  <div className="sr-only">
                                    Out of service:{" "}
                                  </div>
                                  {isRamp ? (
                                    "Ramp"
                                  ) : toBool(el.properties.isStreet) ? (
                                    <>
                                      Street Elevator{" "}
                                      {generateSubwayLines(
                                        lines,
                                        "small",
                                        el.properties.ada,
                                        false,
                                        styles,
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      Elevator to
                                      {el.properties.isBridge && (
                                        <> overpass to</>
                                      )}
                                      {el.properties.isMezzTransferOnly && (
                                        <> lower mezzanine to</>
                                      )}{" "}
                                      {generateSubwayLines(
                                        lines,
                                        "small",
                                        el.properties.ada,
                                        false,
                                        styles,
                                      )}{" "}
                                      trains
                                    </>
                                  )}
                                  {direction && (
                                    <span className={styles.directionLabel}>
                                      <span aria-hidden="true"> (</span>
                                      {direction}
                                      <span aria-hidden="true">)</span>
                                    </span>
                                  )}
                                  {el.properties.ada === "0" && (
                                    <span className={styles.directionLabel}>
                                      <span aria-hidden="true"> (</span>
                                      not
                                      <span aria-hidden="true"> ADA </span>
                                      <span className="sr-only">A.D.A.</span>
                                      accessible
                                      <span aria-hidden="true">)</span>
                                    </span>
                                  )}
                                </div>
                              </span>
                              <div className={styles.oosBadgeGroup}>
                                <span
                                  className={styles.oosBadge}
                                  aria-hidden="true"
                                >
                                  out of service
                                </span>
                                {el.properties.isRedundant === "1" && (
                                  <span
                                    className={styles.oosRedundantBadge}
                                    aria-hidden="true"
                                  >
                                    <FaStar />
                                    redundant elevator
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {lastUpdated && (
          <div className={styles.lastUpdated}>
            Last updated:{" "}
            {new Date(lastUpdated).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </section>
    </>
  );
};

export default NearbyStationsPopup;
