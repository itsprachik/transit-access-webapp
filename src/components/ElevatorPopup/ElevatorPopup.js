import React from "react";
import { AccessibleIcon, ElevatorOutIcon } from "../icons";
import { MTA_SUBWAY_LINE_ICONS } from "@/utils/constants";

export default function ElevatorPopup({
  title,
  elevatorno,
  imageUrl,
  description,
  linesServed,
  icon,
}) {
  const lines = linesServed.split("/");
  return (
    <>
      <div>
        {/* {icon ? <AccessibleIcon /> : <ElevatorOutIcon />} */}
        <strong>{title} </strong>
        {/* <p>{elevatorno}</p> */}
        <img src={imageUrl} alt="Image Desc"></img>
        <p>{description}</p>
        <p>
          <strong>Lines Served</strong>
        </p>
        <div>
          {lines.map((line, index) => (
            <span alt-text={line[index]} key={index}>
              {MTA_SUBWAY_LINE_ICONS[line]}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

export function OnHoverElevatorPopup({ linesServed }) {
  const lines = linesServed.split("/");
  return (
    <>
      <p>
        <strong>Lines Served</strong>
      </p>
      {lines.map((line, index) => (
        <span alt-text={line[index]} key={index}>
          {MTA_SUBWAY_LINE_ICONS[line]}
        </span>
      ))}
    </>
  );
}
