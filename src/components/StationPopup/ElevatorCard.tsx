import React, { useState } from "react";
import { useKeenSlider } from "keen-slider/react";

import {
  LiftBad,
  LiftBadInverted,
  LiftGood,
  ElevatorIcon,
  ElevatorInvertedIcon,
} from "../icons";
import { MTA_SUBWAY_LINE_ICONS } from "@/utils/constants";

import styles from "./station-popup.module.css";
import "keen-slider/keen-slider.min.css";
import { ChevronDown } from "lucide-react";
import { lookAtElevator } from "@/utils/dataUtils";

type Elevator = {
  elevatorno: string;
  ada: string;
  description_custom: string;
  linesServed: string;
  imageURL: string;
  isOut: boolean;
  isStreet: string;
  directionLabel: string;
  estimatedReturn: string | null;
  totalElevators: number;
  isBridge: string;
  coordinates: [number, number];
};

const ElevatorCard: React.FC<{
  elevator: Elevator;
  map: mapboxgl.Map;
  stationView: string | null;
  setStationView: React.Dispatch<React.SetStateAction<string | null>>;
  elevatorView: string | null;
  setElevatorView: React.Dispatch<React.SetStateAction<string | null>>;
  setShow3DToggle: React.Dispatch<React.SetStateAction<boolean>>;

}> = ({ elevator, map, stationView, setStationView, setShow3DToggle, elevatorView, setElevatorView }) => {

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [totalSlides, setTotalSlides] = useState(0);

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

  // We've assigned our own ramp numbers. This is so they have a unique identifier. "RAxxx"
  const isRamp =
    typeof elevator.elevatorno === "string" &&
    elevator.elevatorno.toLowerCase().includes("ra");

  const lines = elevator.linesServed?.split("/") || [];

  return (
    <div className={styles.cardWrapper}>
      {" "}
      {/* <- wrapper for each elevator */}
      {/* TITLE & ELEVATOR INFO */}
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
        {elevator.ada === "0" && <> (not accessible)</>}
        {elevator.isStreet &&
          lines.map((line, i) => (
            <span key={i} title={line} className={styles.lineIcon}>
              {MTA_SUBWAY_LINE_ICONS[line]}
            </span>
          ))}
      </div>
      {/* ICON ON LEFT SIDE */}
      <div className={styles.thumbnailRow}>
        {/* Wrapping both the elevator icon and status icon in a container */}
        <div className={styles.thumbnailWrapper}>
          <div className={styles.statusIconFloating}>
            {elevator.isOut ? (
              <LiftBad fill="#C80000e6" />
            ) : (
              <LiftGood fill="#2bb9cfe6" />
            )}
          </div>
          <div className={styles.elevatorIcon}>
            {elevator.isStreet ? (
              <ElevatorIcon size={50} />
            ) : (
              <ElevatorInvertedIcon size={50} />
            )}
          </div>
        </div>

        {/* ELEVATOR STATUS */}
        <div className={styles.infoColumn}>
          <div className={styles.info1}>
            <div
              className={elevator.isOut ? styles.statusBad : styles.statusGood}
            >
              {isRamp
                ? "ramp always works"
                : elevator.isOut
                ? "out of service"
                : "elevator is working"}
            </div>
          </div>

          {/* SEE ON MAP */}
          <div className={styles.info2}>
            {elevator.isStreet && (
              <>
                <button
                  className={styles.flyButton}
                  onClick={() => {
                    setElevatorView(elevator.elevatorno)
                    setShow3DToggle(true);
                    lookAtElevator(
                      map,
                      elevator.elevatorno,
                      elevator.coordinates,
                      elevatorView,
                      setElevatorView
                    );

                  }}
                >
                  See on map
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* SEE MORE DETAILS */}
      <button
        className={styles.chevronWrapper}
        onClick={() => setShowDetails(!showDetails)}
        aria-label={
          showDetails ? "Hide elevator details" : "Show elevator details"
        }
        aria-expanded={showDetails}
        aria-controls="elevator-details"
      >
        <span className={styles.iconBackground}>
          <ChevronDown
            className={`${styles.chevronIcon} ${
              showDetails ? styles.rotated : ""
            }`}
            aria-hidden="true"
          />
        </span>
      </button>
      {/* EXPANDED PAGE */}
      {showDetails && (
        <>
          <div id="elevator-details" className={styles.detailsSection}>
            {elevator.isOut ? (
              <span className={styles.statusBad}>
                <LiftBadInverted fill="#fff" />
                <span className={styles.statusText}>
                  <span>Out of service until</span>
                  <span className={styles.eta}>{elevator.estimatedReturn}</span>
                </span>
              </span>
            ) : (
              <span className={styles.statusGood}>
                <LiftGood fill="#111" />
                <span className={styles.statusText}>In service</span>
              </span>
            )}
            {/* SLIDER 1*/}
            <div className={styles.sliderWrapper}>
              <div className={styles.paginationLabel}>
                {totalSlides > 0 &&
                  `${(currentSlide ?? 0) + 1} / ${totalSlides}`}
              </div>
              <div ref={sliderRef} className="keen-slider">
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

                <div className="keen-slider__slide">
                  <div className={styles.descriptionWrapper}>
                    <div className={styles.verticalStack}>
                      <div className={styles.description}>
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
              </div>
            </div>
          </div>

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
