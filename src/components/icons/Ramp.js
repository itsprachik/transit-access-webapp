export function Ramp( { fill = "#000", size = 40} ) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
           <rect x="4.4" y="4.4" width="15.3" height="15.3" fill="#fff" />
      <path
        d="M5.675 20.3333H18.6667C19.5833 20.3333 20.3333 19.5833 20.3333 18.6667V5.675C20.3333 4.93333 19.4333 4.55833 18.9083 5.08333L5.09167 18.9083C4.56667 19.4333 4.93334 20.3333 5.675 20.3333Z"
        fill={fill}
      />
    </svg>
  );
}

export default Ramp;
