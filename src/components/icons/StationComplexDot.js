const StationComplexDot = ({ fill = "#000515", size = 20 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 7 7"
    >
      {/* Outer ring */}
      <circle cx="3.5" cy="3.5" r="3.5" fill={fill} />
      {/* Middle ring */}
      <circle cx="3.5" cy="3.5" r="2.5" fill="hsl(220, 0%, 100%)" />
      {/* Inner dot */}
      <circle cx="3.5" cy="3.5" r="1.5" fill={fill} />
    </svg>
  );
};

export default StationComplexDot;
