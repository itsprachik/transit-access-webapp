import React from "react";
import { AccessibleIcon, ElevatorOutIcon } from "../icons";
import { MTA_SUBWAY_LINE_ICONS } from "@/utils/constants";

interface ElevatorPopupProps {
  title: string;
  elevatorno: string;
  imageUrl: string;
  description: string;
  linesServed: string;
  returntoservice?: string;
}

const ElevatorPopup: React.FC<ElevatorPopupProps> = ({
  title,
  elevatorno,
  imageUrl,
  description,
  linesServed,
  returntoservice,
}) => {
  const lines = linesServed.split("/");

  return (
    <div>
      <strong>{title}</strong>
      <p>{elevatorno}</p>

      {returntoservice && (
        <p>
          <strong>Estimated Return to Service:</strong> {returntoservice}
        </p>
      )}

      <img src={imageUrl} alt="Elevator at station" />
      <p>{description}</p>

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
