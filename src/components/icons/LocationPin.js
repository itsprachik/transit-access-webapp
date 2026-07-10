/** @param {{ size?: string | number, className?: string, style?: object }} props */
const LocationPin = ({ size = "1em", className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={style}
    fill="none"
  >
    <circle cx="12" cy="6" r="4" fill="var(--map-pin-color)" stroke="#111" strokeWidth="2" />
    <line x1="12" y1="10" x2="12" y2="22" stroke="#111" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default LocationPin;
