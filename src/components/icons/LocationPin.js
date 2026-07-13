/** @param {{ size?: string }} props */
const LocationPin = ({ size = "1em" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="6" r="4" fill="var(--map-pin-color)" stroke="#111" strokeWidth="2" />
    <line x1="12" y1="10" x2="12" y2="22" stroke="#111" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default LocationPin;
