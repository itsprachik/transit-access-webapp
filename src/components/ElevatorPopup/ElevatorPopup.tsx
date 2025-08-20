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
import { ElevatorPopupProps } from "@/utils/types";
import { LuClock2 } from "react-icons/lu";

const ElevatorPopup: React.FC<ElevatorPopupProps> = ({
  title,
  elevatorno,
  imageURL,
  description_custom,
  linesServed,
  estimatedreturntoservice,
  directionLabel,
  isStreet,
  lastUpdated,
  isUpcomingOutage
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

      <img src={imageURL} alt="Elevator at station" />

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
  date: string;
  reason: string;
  isStreet: string;
  station: string;
}

export const OnHoverElevatorPopup: React.FC<OnHoverElevatorPopupProps> = ({
  date, reason, isStreet, station
}) => {

  return (
    <>
    <div className={styles.upcoming}>
        <div className={styles.header}><LuClock2 size={25}/><strong>Upcoming Long-Term Outage</strong></div>
        {isStreet ? "Street Elevator" : "Platform Elevator"} at <div className={styles.popupSubtitle}>{station}</div>
      <div className={styles.date}>Starting {date}</div>
      </div>
    </>
  );
};
