const StationComplexDot = ({ fill = "#000515", size = 40 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="border-dot-13"
      width="13"
      height="13"
      viewBox="0 0 13 13"
    >
      <g>
        <path
          d="M1,6.5A5.5,5.5,0,1,0,6.5,1,5.5,5.5,0,0,0,1,6.5"
          fill="hsl(220, 0%, 100%)"
          opacity="0.25"
        />
        <path
          d="M1.5,6.5a5,5,0,1,0,5-5,5,5,0,0,0-5,5"
          fill="hsl(220, 0%, 100%)"
          opacity="0.5"
        />
        <path
          d="M2,6.5A4.5,4.5,0,1,0,6.5,2,4.5,4.5,0,0,0,2,6.5"
          fill="hsl(220, 0%, 100%)"
          opacity="0.75"
        />
        <path
          d="M2.5,6.5a4,4,0,1,0,4-4,4,4,0,0,0-4,4"
          fill="hsl(220, 0%, 100%)"
        />
        <path
          d="M3,6.5A3.5,3.5,0,1,0,6.5,3,3.5,3.5,0,0,0,3,6.5"
          fill={fill}
        />
        <path
          d="M4,6.5A2.5,2.5,0,1,0,6.5,4,2.5,2.5,0,0,0,4,6.5"
          fill="hsl(220, 0%, 100%)"
        />
        <path
          d="M5,6.5A1.5,1.5,0,1,0,6.5,5,1.5,1.5,0,0,0,5,6.5"
          fill={fill}
        />
      </g>
    </svg>
  );
};

export default StationComplexDot;
