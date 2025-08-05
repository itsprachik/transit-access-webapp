import React from "react";
import {
  AccessibleIcon,
  ElevatorOutIcon,
  WarnIcon,
  LiftBad,
  LiftGood,
} from "../icons";
import { MTA_SUBWAY_LINE_ICONS } from "@/utils/constants";
import styles from "./elevator-popup.module.css";

interface ElevatorPopupProps {
  title: string;
  elevatorno: string;
  imageUrl: string;
  description_custom: string;
  linesServed: string;
  estimatedreturntoservice: string;
  directionLabel: string;
  isStreet: string;
  lastUpdated: string;
}

const ElevatorPopup: React.FC<ElevatorPopupProps> = ({
  title,
  elevatorno,
  imageUrl,
  description_custom,
  linesServed,
  estimatedreturntoservice,
  directionLabel,
  isStreet,
  lastUpdated
}) => {
  const lines = linesServed.split("/");

  return (
    
    <div>
      <div className={styles["elevator-popup"]}>
      <span className={styles["gray-text"]}>{elevatorno}</span>
      <span className={styles.subtitle}>Street Elevator {" "}
        <span className={styles.title}>{title} {directionLabel && ` (${directionLabel})`}</span>
      </span>

      {estimatedreturntoservice ? (
  <div className={`${styles["elevator-service"]} ${styles["elevator-service-bad"]}`}>
    <LiftBad fill="#111" />
    <span className={styles.statusText}>
      <span>Back in service</span>
      <span className={styles.eta}>{estimatedreturntoservice}</span>
    </span>
  </div>
      ) : (
        <div
          className={`${styles["elevator-service"]} ${styles["elevator-service-good"]}`}
        >
          <LiftGood fill="#111" />
          <span>In service</span>
        </div>
      )}

      <div className={styles["description"]}>
        <span>{description_custom}</span>
      </div>

      <img src={imageUrl} alt="Elevator at station" />

        <div className={styles["subtitle"]}>Lines Served</div>
      <div className={styles.linesServed}>
        {lines.map((line, index) => (
          <span key={index} title={line}>
            {MTA_SUBWAY_LINE_ICONS[line]}
          </span>
        ))}
      </div>
    </div>
    </div>
  );
};

export default ElevatorPopup;

interface OnHoverElevatorPopupProps {
  linesServed: string;
}

export const OnHoverElevatorPopup: React.FC<OnHoverElevatorPopupProps> = ({
  linesServed,
}) => {
  const lines = linesServed.split("/");

  return (
    <>
      <p>
        <strong>Lines Served</strong>
      </p>
      <div>
        {lines.map((line, index) => (
          <span key={index} title={line}>
            {MTA_SUBWAY_LINE_ICONS[line]}
          </span>
        ))}
      </div>
    </>
  );
};
