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
    
      <section className={styles["elevator-popup"]}>
        <div className={styles.header}>
          <div className={styles.headerText}>
      <h1 className={styles.title}>Street Elevator {" "} </h1>
      <h2 className={styles.subtitle}>{title} {directionLabel && ` (${directionLabel})`}</h2>
      <h3 className={styles["gray-text"]}>{elevatorno}</h3>
      </div>
    <section id="elevator-service">
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
      </section>
      </div>

      <section id="description" className={styles["description"]}>
        <span>{description_custom}</span>
      </section>

      <img src={imageURL} alt="Elevator at station" />

<section id="lines-served">
        <div className={styles["subtitle"]}>Lines Served</div>
      <div className={styles.linesServed}>
        {lines.map((line, index) => (
          <span key={index} title={line}>
            {MTA_SUBWAY_LINE_ICONS[line]}
          </span>
        ))}
      </div>
      </section>
    </section>
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
        <div className={styles.upcomingHeader}><LuClock2 size={25}/><strong>Upcoming Long-Term Outage</strong></div>
        {isStreet ? "Street Elevator" : "Platform Elevator"} at <div className={styles.popupSubtitle}>{station}</div>
      <div className={styles.date}>Starting {date}</div>
      </div>
    </>
  );
};
