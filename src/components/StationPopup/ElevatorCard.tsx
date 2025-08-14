import React, { useState, useEffect, useRef } from "react";
import { useKeenSlider } from "keen-slider/react";

import {
  LiftBad,
  LiftBadInverted,
  LiftGood,
  ElevatorIcon,
  ElevatorInvertedIcon,
  Ramp,
  AccessibleIconWhite,
  ElevatorOutIcon,
  AccessibleIconFalse,
} from "../icons";
import { MTA_SUBWAY_LINE_ICONS } from "@/utils/constants";

import styles from "./station-popup.module.css";
import "keen-slider/keen-slider.min.css";
import {
  Calendar,
  Calendar1Icon,
  CalendarDays,
  ChevronDown,
  CircleQuestionMark,
  Clock10Icon,
  InfoIcon,
  ListIcon,
  MenuIcon,
} from "lucide-react";

import { lookAtElevator } from "@/utils/dataUtils";
import { ElevatorPopupProps } from "@/utils/types";

const ElevatorCard: React.FC<{
  elevator: ElevatorPopupProps;
  map: mapboxgl.Map;
  stationView: string | null;
  setStationView: React.Dispatch<React.SetStateAction<string | null>>;
  elevatorView: string | null;
  setElevatorView: React.Dispatch<React.SetStateAction<string | null>>;
  setShow3DToggle: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ elevator, map, setShow3DToggle, elevatorView, setElevatorView }) => {
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

  // Details panel toggle
  const [showDetails, setShowDetails] = useState(false);

  // Access Note state
  const [showAccessNote, setShowAccessNote] = useState(false);
  const [isAnimatingAccessOpen, setIsAnimatingAccessOpen] = useState(false);
  const [showAccessIcon, setShowAccessIcon] = useState(true);

  // Redundancy Note state
  const [showRedundancyNote, setShowRedundancyNote] = useState(false);
  const [isAnimatingRedundancyOpen, setIsAnimatingRedundancyOpen] =
    useState(false);
  const [showRedundancyIcon, setShowRedundancyIcon] = useState(true);

  // Upcoming Note state
  const [showUpcomingNote, setShowUpcomingNote] = useState(false);
  const [isAnimatingUpcomingOpen, setIsAnimatingUpcomingOpen] = useState(false);
  const [showUpcomingIcon, setShowUpcomingIcon] = useState(true);

  // for click listeners on redundancy/access note states
  const accessNoteRef = useRef<HTMLDivElement>(null);
  const redundancyNoteRef = useRef<HTMLDivElement>(null);
  const upcomingNoteRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isUpcomingPressed, setIsUpcomingPressed] = useState(false);
  const [isFlyButtonPressed, setIsFlyButtonPressed] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showAccessNote &&
        accessNoteRef.current &&
        !accessNoteRef.current.contains(event.target as Node)
      ) {
        handleToggleAccessNote(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAccessNote]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showRedundancyNote &&
        redundancyNoteRef.current &&
        !redundancyNoteRef.current.contains(event.target as Node)
      ) {
        handleToggleRedundancyNote(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRedundancyNote]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showUpcomingNote &&
        upcomingNoteRef.current &&
        !upcomingNoteRef.current.contains(event.target as Node)
      ) {
        handleToggleUpcomingNote(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUpcomingNote]);

  // Handle mutual exclusivity: open access note, close redundancy note
  const handleToggleAccessNote = (open: boolean) => {
    if (open) {
      setShowAccessNote(true);
      setShowAccessIcon(false);
      // Close redundancy note
      setShowRedundancyNote(false);
      setShowRedundancyIcon(true);
      setIsAnimatingRedundancyOpen(false);
    } else {
      setIsAnimatingAccessOpen(false);
      setShowAccessNote(false);
      setTimeout(() => setShowAccessIcon(true), 300);
    }
  };

  // Handle mutual exclusivity: open redundancy note, close access note
  const handleToggleRedundancyNote = (open: boolean) => {
    if (open) {
      setShowRedundancyNote(true);
      setShowRedundancyIcon(false);
      // Close access note
      setShowAccessNote(false);
      setShowAccessIcon(true);
      setIsAnimatingAccessOpen(false);
    } else {
      setIsAnimatingRedundancyOpen(false);
      setShowRedundancyNote(false);
      setTimeout(() => setShowRedundancyIcon(true), 300);
    }
  };

  const handleToggleUpcomingNote = (open: boolean) => {
    if (open) {
      setShowUpcomingNote(true);
      setShowAccessNote(false);
      setShowAccessIcon(true);
      setIsAnimatingAccessOpen(false);
      setShowRedundancyNote(false);
      setShowRedundancyIcon(true);
      setIsAnimatingRedundancyOpen(false);
    } else {
      setIsAnimatingUpcomingOpen(false);
      setShowUpcomingNote(false);
    }
  };

  // Animate opening/closing Access Note
  useEffect(() => {
    if (showAccessNote) {
      const timer = setTimeout(() => setIsAnimatingAccessOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingAccessOpen(false);
    }
  }, [showAccessNote]);

  // Animate opening/closing Redundancy Note
  useEffect(() => {
    if (showRedundancyNote) {
      const timer = setTimeout(() => setIsAnimatingRedundancyOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingRedundancyOpen(false);
    }
  }, [showRedundancyNote]);

  useEffect(() => {
    if (showUpcomingNote) {
      const timer = setTimeout(() => setIsAnimatingUpcomingOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingUpcomingOpen(false);
    }
  }, [showUpcomingNote]);

  const handleFlyButtonClick = () => {
    setIsFlyButtonPressed(true);

    setElevatorView(elevator.elevatorno);
    setShow3DToggle(true);
    lookAtElevator(
      map,
      elevator.elevatorno,
      elevator.coordinates,
      elevatorView,
      setElevatorView
    );
  };

  // Keen slider setup
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: false,
    slides: { perView: 1, spacing: 8 },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created(slider) {
      setTotalSlides(slider.track.details.slides.length);
    },
  });

  // Identify if elevatorno is a ramp
  const isRamp = elevator.elevatorno.toLowerCase().includes("ra");

  const lines = elevator.linesServed?.split("/") || [];

  const upcomingOutages = elevator.isUpcomingOutage
    ? Array.isArray(elevator.isUpcomingOutage)
      ? elevator.isUpcomingOutage
      : [elevator.isUpcomingOutage] // wrap single object in an array
    : [];

  return (
    <div
      className={
        elevator.isStreet
          ? styles.cardWrapperStreet
          : styles.cardWrapperPlatform
      }
    >
      {/* Title & elevator info */}
      <div className={styles.elevatorTitle}>
        {isRamp ? (
          "Ramp"
        ) : elevator.isStreet ? (
          "Street Elevator "
        ) : (
          <>
            Elevator to {elevator.isBridge && <> overpass to </>}
            {lines.map((line, i) => (
              <span key={i} title={line} className={styles.lineIcon}>
                {MTA_SUBWAY_LINE_ICONS[line]}
              </span>
            ))}{" "}
            trains
          </>
        )}

        {elevator.directionLabel && (
          <span className={styles.directionLabel}>
            {" "}
            ({elevator.directionLabel}){" "}
          </span>
        )}
        <span className={styles.directionLabel}>
          {elevator.ada === "0" && <> (not accessible) </>}{" "}
        </span>
        {elevator.isStreet &&
          lines.map((line, i) => (
            <span title={line} className={styles.lineIcon} key={`street-${i}`}>
              {MTA_SUBWAY_LINE_ICONS[line]}
            </span>
          ))}
      </div>

      {/* Left icon and status */}
      <div className={styles.thumbnailRow}>
        <div className={styles.thumbnailWrapper}>
          <div className={styles.statusIconFloating}>
            {elevator.isOut ? (
              <LiftBad fill="#C80000e6" />
            ) : (
              <LiftGood fill="#2bb9cfe6" />
            )}
          </div>
          <div className={styles.elevatorIcon}>
            {isRamp ? (
              <Ramp size={50} />
            ) : elevator.isStreet ? (
              <ElevatorIcon size={50} />
            ) : (
              <ElevatorInvertedIcon size={50} />
            )}
          </div>
        </div>

        {/* Info column */}
        <div className={styles.infoColumn}>
          {/* Details toggle button */}
          <button
            className={styles.chevronWrapper}
            onClick={() => {
              setShowDetails(!showDetails);
              if (!isPressed) {
                setIsPressed(true);
              } else {
                setIsPressed(false);
              }
            }}
            aria-label={
              showDetails ? "Hide elevator details" : "Show elevator details"
            }
            aria-expanded={showDetails}
            aria-controls="elevator-details"
          >
            <span className={styles.iconBackground}>
              <ChevronDown
                className={`
    ${styles.chevronIcon} 
    ${elevator.isOut ? styles.colorBad : styles.colorGood} 
    ${isPressed ? styles.pressed : ""} 
    ${showDetails ? styles.rotated : ""}
  `}
                aria-hidden="true"
              />
            </span>
          </button>
          {/* Status and redundancy note */}
          <div className={styles.info1}>
            <div
              className={
                elevator.isOut ? styles.statusBadSmall : styles.statusGoodSmall
              }
            >
              {isRamp
                ? "always in service"
                : elevator.isOut
                ? "out of service"
                : "in service"}

              {/* Redundancy note toggle and content */}
              {elevator.isOut && (
                <div className={styles.accessToggle} ref={redundancyNoteRef}>
                  {(showRedundancyNote || !showRedundancyIcon) && (
                    <div
                      {...({
                        inert: !showRedundancyNote ? "true" : undefined,
                      } as any)}
                      className={`
                     ${styles.redundancyNote}
                     ${isAnimatingRedundancyOpen ? styles.accessNoteOpen : ""}
                     ${
                       elevator.isRedundant === "1"
                         ? styles.redundantYes
                         : styles.redundantNo
                     }
                   `}
                    >
                      <button
                        onClick={() => handleToggleRedundancyNote(false)}
                        className={styles.accessNoteClose}
                        aria-label="Close redundancy info"
                      >
                        ×
                      </button>
                      <div className={styles.redundancyNoteContent}>
                        {elevator.isRedundant === "1" ? (
                          <>
                            <ElevatorIcon size={30} />
                            <span>
                              Don&apos;t worry, there&apos;s another option
                            </span>
                          </>
                        ) : (
                          <>
                            <AccessibleIconFalse size={30} />
                            <span>There is no other accessible path</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleToggleRedundancyNote(true)}
                    className={`
                      ${styles.iconButton} ${styles.redundancyNoteIconButton}
                   ${showRedundancyIcon ? styles.iconButtonVisible : ""}
                   ${
                     elevator.isRedundant === "1"
                       ? styles.redundantYes
                       : styles.redundantNo
                   }
                 `}
                    aria-label="Show redundancy info"
                  >
                    <CircleQuestionMark />
                  </button>
                </div>
              )}
            </div>

            {/* ACCESS NOTE */}
            {elevator.access_note && (
              <div ref={accessNoteRef}>
                {(showAccessNote || !showAccessIcon) && (
                  <div
                    {...({
                      inert: !showAccessNote ? "true" : undefined,
                    } as any)}
                    className={`${styles.accessNote} ${
                      isAnimatingAccessOpen ? styles.accessNoteOpen : ""
                    }`}
                  >
                    <div className={styles.accessNoteHeader}>
                      <AccessibleIconWhite />
                      Transit Access Note
                      <button
                        onClick={() => handleToggleAccessNote(false)}
                        className={styles.accessNoteClose}
                        aria-label="Close access note"
                      >
                        ×
                      </button>
                    </div>
                    <div>{elevator.access_note}</div>
                  </div>
                )}

                <button
                  onClick={() => handleToggleAccessNote(true)}
                  className={`${styles.iconButton} ${styles.accessNoteIconButton} ${
                    showAccessIcon ? styles.iconButtonVisible : ""
                  }`}
                  aria-label="Show access note"
                >
                  <ListIcon size={15} color="#111" />
                </button>
              </div>
            )}
          </div>

            {/* UPCOMING OUTAGES NOTE */}
            {upcomingOutages.length > 0 && (
              <div ref={upcomingNoteRef}>
                                    <div className={styles.upcomingWrapper}>
                {(showUpcomingNote) && (
                  <div
                    {...({
                      inert: !showUpcomingNote ? "true" : undefined,
                    } as any)}
                    className={`${styles.accessNote} ${styles.upcomingNote} ${
                      isAnimatingUpcomingOpen ? styles.accessNoteOpen : ""
                    }`}
                  >

                    <div className={styles.accessNoteHeader}>
                      <Clock10Icon />
                      Upcoming Outage
                      <button
                        onClick={() => handleToggleUpcomingNote(false)}
                        className={styles.accessNoteClose}
                        aria-label="Close access note"
                      >
                        ×
                      </button>
                    </div>
                    <div>
                      {upcomingOutages.length > 0 ? (
                        upcomingOutages.map((o, i) => (
                          <div key={i}>
                            {o.outageDuration} ({o.reason})
                          </div>
                        ))
                      ) : (
                        <div>No upcoming outages</div>
                      )}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    handleToggleUpcomingNote(!showUpcomingNote)}
                  }
                  
                  className={`${styles.iconButton} ${styles.upcomingIconButton} ${showUpcomingNote ? `${styles.pressed} ${styles.upcomingAnimate}` : ""}   ${
                    showUpcomingIcon ? styles.iconButtonVisible : showUpcomingIcon
                  }`}
                  aria-label="Show access note"
                >
                  <CalendarDays size={20} color="#c80000" />
                </button>
              </div>
              </div>
            )}


          {/* See on map button */}
          <div className={styles.info2}>
            {elevator.isStreet && (
              <button
                className={`${styles.flyButton} ${
                  isFlyButtonPressed ? styles.flyButtonActive : ""
                }`}
                style={
                  {
                    "--flybutton-bg": `url(${elevator.imageURL})`,
                  } as React.CSSProperties
                }
                onClick={handleFlyButtonClick}
              >
                <span className={styles.flyButtonLabel}>see on map</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <>
          <div id="elevator-details" className={styles.detailsSection}>
            {elevator.isOut ? (
              <span className={styles.statusBad}>
                <LiftBadInverted fill="#fff" />
                <span className={styles.statusText}>
                  <span>Back in service</span>
                  <span className={styles.eta}>{elevator.estimatedReturn}</span>
                </span>
              </span>
            ) : (
              <span className={styles.statusGood}>
                <LiftGood fill="#111" />
                <span className={styles.statusText}>In service</span>
              </span>
            )}

            {/* Slider */}
            <div className={styles.sliderWrapper}>
              <div className={styles.paginationLabel}>
                {totalSlides > 0 && `${currentSlide + 1} / ${totalSlides}`}
              </div>
              <div ref={sliderRef} className="keen-slider">
                {/* Slide 2 - Description */}
                <div className="keen-slider__slide">
                  <div className={styles.descriptionWrapper}>
                    <div className={styles.verticalStack}>
                      <div className={styles.description}>
                        <div className={styles.accessNoteHeader}>
                          {elevator.isStreet ? (
                            <>
                              <ElevatorIcon size={30} />
                              Street Elevator Description
                            </>
                          ) : (
                            <>
                              <ElevatorInvertedIcon size={30} />
                              Platform Elevator Description
                            </>
                          )}
                        </div>
                        {elevator.description_custom ||
                          "No description provided."}
                      </div>

                      <span className={styles["gray-text"]}>
                        {isRamp ? "ramp" : "elevator"} number:{" "}
                        {elevator.elevatorno}
                      </span>

                      <div className={styles.lineWrapper}>
                        <strong>Lines Served: </strong>
                        <div>
                          {lines.map((line, i) => (
                            <span
                              key={i}
                              title={line}
                              className={`${styles.lineIcon} ${styles.lineIconLarge}`}
                            >
                              {MTA_SUBWAY_LINE_ICONS[line]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Slide 1 - Elevator image + access note */}
                <div
                  className="keen-slider__slide"
                  style={{ minWidth: "100%" }}
                >
                  <img
                    className={styles.slideImage}
                    src={elevator.imageURL}
                    alt="Elevator at station"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Slider dots */}
          <div className={styles.dots}>
            {[0, 1].map((i) => (
              <span
                key={i}
                className={`${styles.dot} ${
                  currentSlide === i ? styles.activeDot : ""
                }`}
                onClick={() => instanceRef.current?.moveToIdx(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ElevatorCard;
