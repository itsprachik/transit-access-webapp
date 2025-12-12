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

import styles from "./station-popup.module.css";
import "keen-slider/keen-slider.min.css";

import { FaWrench, FaRegQuestionCircle } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { LuClock2 } from "react-icons/lu";

import { lookAtElevator, highlightElevator, generateSubwayLines } from "@/utils/dataUtils";
import { ElevatorPopupProps } from "@/utils/types";

const ElevatorCard: React.FC<{
  elevator: ElevatorPopupProps;
  map: mapboxgl.Map;
  stationView: string | null;
  setStationView: React.Dispatch<React.SetStateAction<string | null>>;
  elevatorView: string | null;
  setElevatorView: React.Dispatch<React.SetStateAction<string | null>>;
  setShow3DToggle: React.Dispatch<React.SetStateAction<boolean>>;
  activeFlyButton: string | null;
  setActiveFlyButton: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ elevator, map, setShow3DToggle, elevatorView, setElevatorView, activeFlyButton, setActiveFlyButton }) => {
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

  // Details panel toggle
  const [showDetails, setShowDetails] = useState(false);

  // Access Note state
  const [showAccessNote, setShowAccessNote] = useState(false);
  const [isAnimatingAccessOpen, setIsAccessNoteAnimating] = useState(false);
  const [showAccessIcon, setShowAccessIcon] = useState(true);

  // Redundancy Note state
  const [showRedundancyNote, setShowRedundancyNote] = useState(false);
  const [isAnimatingRedundancyOpen, setIsRedundancyNoteAnimating] =
    useState(false);
  const [showRedundancyIcon, setShowRedundancyIcon] = useState(true);

  // Upcoming Note state
  const [showUpcomingNote, setShowUpcomingNote] = useState(false);
  const [isAnimatingUpcomingOpen, setIsUpcomingAnimating] = useState(false);
  const [showUpcomingIcon, setShowUpcomingIcon] = useState(true);

  // for click listeners on redundancy/access note states
  const accessNoteRef = useRef<HTMLDivElement>(null);
  const redundancyNoteRef = useRef<HTMLDivElement>(null);
  const upcomingNoteRef = useRef<HTMLDivElement>(null);
  const flyButtonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);

  // button refs are for screen reader focus management:
const accessButtonRef = useRef<HTMLButtonElement>(null);
const redundancyButtonRef = useRef<HTMLButtonElement>(null);
const upcomingButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showRedundancyNote &&
        redundancyNoteRef.current &&
        !redundancyNoteRef.current.contains(event.target as Node)
      ) {
        handleToggleRedundancyNote(false);
      }
      if (
        showUpcomingNote &&
        upcomingNoteRef.current &&
        !upcomingNoteRef.current.contains(event.target as Node)
      ) {
        handleToggleUpcomingNote(false);
      }
      if (
        showAccessNote &&
        accessNoteRef.current &&
        !accessNoteRef.current.contains(event.target as Node)
      ) {
        handleToggleAccessNote(false);
      }
      if (activeFlyButton && 
        flyButtonRef.current &&
        !flyButtonRef.current.contains(event.target as Node)
      ) { 
       handleToggleFlyButton(false);
      };
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRedundancyNote, showUpcomingNote, showAccessNote, activeFlyButton]);

  useEffect(() => {
    highlightElevator(map, activeFlyButton);
  }, [activeFlyButton])

  // Handle mutual exclusivity: open access note, close redundancy note
  const handleToggleAccessNote = (open: boolean) => {
    if (open) {
      setShowAccessNote(true);
      setShowAccessIcon(false);
      // Close redundancy note
      setShowRedundancyNote(false);
      setShowRedundancyIcon(true);
      setIsRedundancyNoteAnimating(false);
      // Close upcoming note
      setShowUpcomingNote(false);
      setShowUpcomingIcon(true);
      setIsUpcomingAnimating(false);
  
      // Focus management - move focus to the note after animation
      setTimeout(() => {
        const closeButton = accessNoteRef.current?.querySelector('button');
        (closeButton as HTMLElement)?.focus();
      }, 350);
      
    } else {
      setIsAccessNoteAnimating(false);
      setShowAccessNote(false);
      setTimeout(() => {
        setShowAccessIcon(true);
        // Return focus to trigger button
        accessButtonRef.current?.focus();
      }, 300);
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
      setIsAccessNoteAnimating(false);
      // Close upcoming note  
      setShowUpcomingNote(false);
      setShowUpcomingIcon(true);
      setIsUpcomingAnimating(false);
  
      // Focus management
      setTimeout(() => {
        const closeButton = redundancyNoteRef.current?.querySelector('button');
        (closeButton as HTMLElement)?.focus();
      }, 350);
      
    } else {
      setIsRedundancyNoteAnimating(false);
      setShowRedundancyNote(false);
      setTimeout(() => {
        setShowRedundancyIcon(true);
        redundancyButtonRef.current?.focus();
      }, 300);
    }
  };

  const handleToggleUpcomingNote = (open: boolean) => {
    if (open) {
      setShowUpcomingNote(true);
      setShowUpcomingIcon(true);
      setShowAccessNote(false);
      setShowAccessIcon(true);
      setIsAccessNoteAnimating(false);
      setShowRedundancyNote(false);
      setShowRedundancyIcon(true);
      setIsRedundancyNoteAnimating(false);
  
      // Focus management
      setTimeout(() => {
        const closeButton = upcomingNoteRef.current?.querySelector('button');
        (closeButton as HTMLElement)?.focus();
      }, 350);
      
    } else {
      setIsUpcomingAnimating(false);
      setShowUpcomingNote(false);
      setTimeout(() => {
        upcomingButtonRef.current?.focus();
      }, 300);
    }
  };

  const handleToggleFlyButton = (open: boolean, elevatorId?: string) => {
    if (open) {
      setActiveFlyButton(elevatorId);
    } else {
      setActiveFlyButton(null);
    }
  };

  function handleFlyButtonClick(
    elevatorId: string,
    elevator: ElevatorPopupProps
  ) {
    // Always set the clicked one as active
    setActiveFlyButton(elevatorId);
    
    lookAtElevator(
      map,
      elevator.elevatorno,
      elevator.coordinates,
      elevatorView,
      setElevatorView
    );
  }

  // Animate opening/closing Access Note
  useEffect(() => {
    if (showAccessNote) {
      const timer = setTimeout(() => setIsAccessNoteAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAccessNoteAnimating(false);
    }

    if (showRedundancyNote) {
      const timer = setTimeout(() => setIsRedundancyNoteAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsRedundancyNoteAnimating(false);
    }

    if (showUpcomingNote) {
      const timer = setTimeout(() => setIsUpcomingAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsUpcomingAnimating(false);
    }
  }, [showAccessNote, showRedundancyNote, showUpcomingNote]);

  // This useEffect for keyboard support (Escape key):
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showAccessNote) {
        handleToggleAccessNote(false);
      } else if (showRedundancyNote) {
        handleToggleRedundancyNote(false);
      } else if (showUpcomingNote) {
        handleToggleUpcomingNote(false);
      }
    }
  };

  if (showAccessNote || showRedundancyNote || showUpcomingNote) {
    document.addEventListener('keydown', handleKeyDown);
  }

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [showAccessNote, showRedundancyNote, showUpcomingNote]);

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

  const lines = elevator.linesServed?.replace(/-/g, "").replaceAll("/", " ") || [];

  const linesServedBigSlow = generateSubwayLines(lines, "big", elevator.ada, true, styles)
  const linesServedBigQuick = generateSubwayLines(lines, "big", elevator.ada, false, styles);
  const linesServedSmallSlow = generateSubwayLines(lines, "small", elevator.ada, true, styles);
  const linesServedSmallQuick = generateSubwayLines(lines, "small", elevator.ada, false, styles);

  const upcomingOutages = elevator.isUpcomingOutage
    ? Array.isArray(elevator.isUpcomingOutage)
      ? elevator.isUpcomingOutage
      : [elevator.isUpcomingOutage] // wrap single object in an array
    : [];

  return (
    <div

    aria-label="individual elevator"
    >
      <div className={styles.topRowWrapper}>
      {/* Title & elevator info */}
      <h3
  className={`${styles.titleWrapper} ${
    showUpcomingNote || showAccessNote ? styles.thumbnailRowBlur : ""
  }`}
>
  <div className={`${styles.elevatorTitle} ${elevator.isOut && elevator.isRedundant == "0" ? styles.strikethrough : ""}`}>
    <div className="sr-only">{elevator.isOut ? "Out of service: " : "In service: "}</div>
    {isRamp ? (
      "Ramp"
    ) : elevator.isStreet ? (
      <>Street Elevator {linesServedSmallQuick}</>
    ) : (
      <>
        Elevator to{elevator.isBridge && <> overpass to</>}{elevator.isMezzTransferOnly && <> lower mezzanine to</>}
        {" "}{linesServedSmallQuick} trains 
      </>
    )}

    {elevator.directionLabel && (
      <span className={styles.directionLabel}> 
      <span aria-hidden="true"> (</span>
      {elevator.directionLabel}
      <span aria-hidden="true">)</span>
      </span>
    )}
    
    {elevator.ada === "0" && (
      <span className={styles.directionLabel}>
        <span aria-hidden="true"> (</span>
        not
        <span aria-hidden> ADA </span>
        <span className="sr-only">A.D.A.</span>
        accessible
        <span aria-hidden="true">)</span>
        </span>
    )}
  </div>
</h3>
      {/* elevatorTitle */}
      {/* Left icon and status */}
      <div
        className={`
      ${styles.thumbnailRow}`}
      >
        <div
          className={`${styles.thumbnailWrapper} ${
            showUpcomingNote || showAccessNote ? styles.thumbnailRowBlur : ""
          }`}
          aria-hidden="true"
        >
          <div className={styles.statusIconFloating}>
            {elevator.isOut ? (
              <LiftBad fill="#C80000e6" />
            ) : (
              <LiftGood fill="#2bb9cfe6" />
            )}
          </div>{" "}
          {/* statusIconFloating */}
          <div className={styles.elevatorIcon}>
            {isRamp ? (
              <Ramp size={50} />
            ) : elevator.isStreet ? (
              <ElevatorIcon size={40} />
            ) : (
              <ElevatorInvertedIcon size={40} />
            )}
          </div>{" "}
          {/* elevatorIcon */}
        </div>{/* thumbnailWrapper */}

        {/* Info column */}
        <div className={styles.infoColumn}>
          {/* Details toggle button */}
          <button
            className={`${styles.chevronWrapper} ${
              showUpcomingNote || showAccessNote ? styles.thumbnailRowBlur : ""
            }`}
            onClick={() => {
              setTimeout(() => setShowDetails(!showDetails), 100);
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
            <div className={styles.iconBackground} aria-hidden="true">
              <FiChevronDown
                className={`
                  ${styles.chevronIcon} 
                  ${elevator.isOut ? styles.colorBad : styles.colorGood} 
                  ${isPressed ? styles.pressed : ""} 
                  ${showDetails ? styles.rotated : ""}
                `}
              />
            </div>
          </button>
          {/* Status and redundancy note */}
          <div
            className={styles.chevronWrapper}
            onClick={() => {
              setTimeout(() => setShowDetails(!showDetails), 100);
              if (!isPressed) {
                setIsPressed(true);
              } else {
                setIsPressed(false);
              }
            }}
          >
            <div
              className={`${styles.info1} ${
                showUpcomingNote || showAccessNote ? styles.thumbnailRowBlur : ""
              }`}
            >
              <div
                className={
                  elevator.isOut
                    ? styles.statusBadSmall
                    : styles.statusGoodSmall
                }
              >
                <div aria-hidden="true">
                {isRamp
                  ? "always in service"
                  : elevator.isOut
                  ? "out of service"
                  : "in service"}
                  </div>

                {/* Redundancy note toggle and content */}
                {elevator.isOut && (
  <div className={styles.accessToggle} ref={redundancyNoteRef}>
    {(showRedundancyNote || !showRedundancyIcon) && (
      <div
        className={`
          ${styles.redundancyNote}
          ${isAnimatingRedundancyOpen ? styles.accessNoteOpen : ""}
          ${
            elevator.isRedundant === "1"
              ? styles.redundantYes
              : styles.redundantNo
          }
        `}
        role="dialog"
        aria-labelledby="redundancy-note-title"
        aria-describedby="redundancy-note-content"
        aria-modal="false"
      >
        <h4 id="redundancy-note-title" className="sr-only">
          Redundancy Information
        </h4>
        <button
          onClick={(e) => {
            handleToggleRedundancyNote(false);
            e.stopPropagation(); // redundancyNote is a child of OOS/IS indication, this is so the close button doesn't trigger the card expansion
          }}
          className={styles.accessNoteClose}
          aria-label="Close redundancy information and return to elevator details"
        >
          ×
        </button>
        <div id="redundancy-note-content" className={styles.redundancyNoteContent}>
          {elevator.isRedundant === "1" ? (
            <>
              <div aria-hidden="true"><ElevatorIcon size={20} /></div>
              <span>Don&apos;t worry, there&apos;s another option</span>
            </>
          ) : (
            <>
              <div aria-hidden="true"><AccessibleIconFalse size={20} /></div>
              <span>There is no other accessible path</span>
            </>
          )}
        </div>
      </div>
    )}
    <button
      ref={redundancyButtonRef}
      onClick={(e) => {
        handleToggleRedundancyNote(true);
        e.stopPropagation();
      }}
      className={`
        ${styles.iconButton} ${styles.redundancyNoteIconButton}
        ${showRedundancyIcon ? styles.iconButtonVisible : ""}
        ${
          elevator.isRedundant === "1"
            ? styles.redundantYes
            : styles.redundantNo
        }
      `}
      aria-label="Show elevator redundancy information"
      aria-expanded={showRedundancyNote}
      aria-controls="redundancy-note-content"
    >
      <FaRegQuestionCircle size={18} />
    </button>
  </div>
)}
              </div>{" "}
              {/* elevator.isOut */}
            </div>{" "}
            {/* second chevronWrapper, so clicking on service text does the same thing */}
          </div>{" "}
          {/* info1 */}
          {/* ACCESS NOTE */}
          {elevator.access_note && (
  <div ref={accessNoteRef}>
    {(showAccessNote || !showAccessIcon) && (
      <div
        className={`${styles.accessNote} ${
          isAnimatingAccessOpen ? styles.accessNoteOpen : ""
        }`}
        role="dialog"
        aria-labelledby="access-note-title"
        aria-describedby="access-note-content"
        aria-modal="false"
      >
        <div className={styles.accessNoteHeader}>
          <div aria-hidden="true"><AccessibleIconWhite /></div>
          <h4 id="access-note-title" style={{ margin: 0, display: 'inline' }}>
            Transit Access Note
          </h4>
          <button
            onClick={() => handleToggleAccessNote(false)}
            className={styles.accessNoteClose}
            aria-label="Close access note and return to elevator details"
          >
            ×
          </button>
        </div>
        <div id="access-note-content">{elevator.access_note}</div>
      </div>
    )}

    <button
      ref={accessButtonRef}
      onClick={() => handleToggleAccessNote(true)}
      className={`${styles.iconButton} ${
        styles.accessNoteIconButton
      } ${showAccessIcon ? styles.iconButtonVisible : ""}`}
      aria-label="Show transit access note"
      aria-expanded={showAccessNote}
      aria-controls="access-note-content"
    >
      <AccessibleIconWhite size={15} fill="#501759e6" />
    </button>
  </div>
)}
          <div className={styles.info2}></div> {/* info2 */}
        </div>{" "}
        {/* infoColumn */}
      </div>{" "}
      {/* thumbnailRow */}
      {elevator.isStreet && (
        <button
        aria-hidden="true"
        ref={flyButtonRef}
          className={`${styles.flyButton} ${
            activeFlyButton === elevator.elevatorno
              ? styles.flyButtonActive
              : ""
          }
          ${showUpcomingNote || showAccessNote ? styles.thumbnailRowBlur : ""}
          `}
          style={
            {
              "--flybutton-bg": `url(${elevator.imageURL})`,
            } as React.CSSProperties
          }
          onClick={() => {
            handleFlyButtonClick(elevator.elevatorno, elevator);
            setShow3DToggle(true);
          }}
        >
          <span className={styles.flyButtonLabel}>see on map</span>
        </button>
      )}

{/* UPCOMING OUTAGES NOTE */}
{upcomingOutages.length > 0 && (
  <div ref={upcomingNoteRef}>
    <div className={styles.upcomingWrapper}>
      {showUpcomingNote && (
        <div
          className={`${styles.note} ${styles.upcomingNote} ${
            isAnimatingUpcomingOpen ? styles.accessNoteOpen : ""
          }`}
          role="dialog"
          aria-labelledby="upcoming-note-title"
          aria-modal="false"
        >
          <div className={styles.accessNoteHeader}>
            <LuClock2 size={20} aria-hidden="true" />
            <h4 id="upcoming-note-title" style={{ margin: 0, display: 'inline' }}>
              <span className="sr-only">
                {upcomingOutages.map((o, i) => {
                  const outageType = o.reason === "Capital Replacement" ? "Long-Term" : "Short-Term";
                  const separator = i < upcomingOutages.length - 1 ? "; " : "";
                  return `Upcoming ${outageType} Outage: ${o.outageDuration} (${o.reason})${separator}`;
                }).join("")}
              </span>
              <span aria-hidden="true">
                {upcomingOutages.map((o, i) => (
                  <span key={i}>
                    Upcoming{" "}
                    {o.reason === "Capital Replacement"
                      ? "Long-Term"
                      : "Short-Term"}{" "}
                    Outage
                  </span>
                ))}
              </span>
            </h4>
            <button
              onClick={() => handleToggleUpcomingNote(false)}
              className={styles.accessNoteClose}
              aria-label="Close upcoming outage information and return to elevator details"
            >
              ×
            </button>
          </div>
          <div id="upcoming-note-content" aria-hidden="true">
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
        ref={upcomingButtonRef}
        onClick={() => {
          handleToggleUpcomingNote(!showUpcomingNote);
        }}
        className={`${styles.iconButton} ${
          styles.upcomingIconButton
        } ${
          showUpcomingNote
            ? `${styles.pressed} ${styles.upcomingAnimate}`
            : ""
        } ${showUpcomingIcon ? styles.iconButtonVisible : ""}
        `}
        aria-label="Show upcoming outage information"
        aria-expanded={showUpcomingNote}
        aria-controls="upcoming-note-content"
      >
        {upcomingOutages.map((o, i) => (
          <div
            key={i}
            className={
              o.reason === "Capital Replacement"
                ? styles.upcomingIconButtonRedInverted
                : styles.upcomingIconButtonRed
            }
          >
            <FaWrench size={10} />
          </div>
        ))}
      </button>
    </div>
  </div>
)}
      </div> {/* topRowWrapper */}

      {/* Expanded details */}
      {showDetails && (
        <>
          <div id="elevator-details" className={styles.detailsSection}>
            {elevator.isOut ? (
              <span className={styles.statusBad}>
                <div aria-hidden="true"><LiftBadInverted fill="#fff" /></div>
                <span className="sr-only">Back in service {elevator.estimatedreturntoservice}</span>
                <span className={styles.statusText} aria-hidden="true">
                  <div>Back in service</div>
                  <span className={styles.eta}>
                    {elevator.estimatedreturntoservice}
                  </span>
                </span>
              </span>
            ) : (
              <span className={styles.statusGood} aria-hidden="true">
                 <div aria-hidden="true"><LiftGood fill="#111" /></div>
                <span className={styles.statusText}>In service</span>
              </span>
            )}

            {/* Slider */}
            <div className={styles.sliderWrapper}>
              <div aria-hidden="true" className={styles.paginationLabel}>
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
                               <div aria-hidden="true"><ElevatorIcon size={30} /></div>
                               <div aria-hidden="true"> Street Elevator Description</div>
                            </>
                          ) : (
                            <>
                               <div aria-hidden="true"><ElevatorInvertedIcon size={30} /></div>
                               <div aria-hidden="true">Platform Elevator Description</div>
                            </>
                          )}
                        </div>
                        <div aria-label="Elevator Description"> {elevator.description_custom ||
                          "No description provided."} </div>
                      </div>

                      <span className={styles["gray-text"]}>
                        {isRamp ? "ramp" : "elevator"} number:{" "}
                        {elevator.elevatorno}
                      </span>

                      <div 
                      aria-label="Lines Served By Elevator"
                        className={styles.lineWrapper}
                       >
                        <strong aria-hidden="true">Lines Served By Elevator: </strong>
                        <div>{linesServedBigQuick}
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
                  aria-hidden="true"
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
    </div> // cardWrapper
  );
};

export default ElevatorCard;

