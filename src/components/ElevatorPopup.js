import React from "react";
import { AccessibleIcon, ElevatorOutIcon } from "./icons";

export default function ElevatorPopup({
  title,
  elevatorno,
  imageUrl,
  description,
  linesServed,
  icon
}) {
console.log(icon);
   
  return (
    <>
      <div>
        {/* {icon ? <AccessibleIcon /> : <ElevatorOutIcon />} */}
        <strong>{title} </strong>
        <p>{elevatorno}</p>
        <img src={imageUrl} alt="Image Desc"></img>
        <p>{description}</p>
        <p>
          <strong>Lines Served</strong>
        </p>
        <p>{linesServed}</p>
      </div>
    </>
  );
}
