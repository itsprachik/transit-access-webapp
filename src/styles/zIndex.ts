/**
 * Global z-index stack for the app.
 *
 * Two separate stacking contexts:
 *   Z        — fixed/absolute elements layered over the Mapbox canvas
 *   ZPopup   — internal stacking within the station popup (local context)
 *
 * Call applyZIndexVars() once on mount to publish as CSS custom properties
 * so CSS modules can reference them without importing this file.
 *
 * Usage in CSS:    z-index: var(--z-index-${css-name});
 * Usage in JS/TS:  zIndex: Z.${jsName}
 */

// ─── Global overlay stack ────────────────────────────────────────────────────
export const Z = {
  // Mapbox attribution (keep behind everything)
  mapboxBottomRight: 1,

  // Map canvas add-ons (center dot)
  centerDot: 995,

  footer: 996,

  // All map UI controls (footer, legend button, geolocate/compass, 3D toggle, center button)
  mapControls: 997,

  // in case nearby needs to be behind stationPopup
  nearbyPopup: 999,

  // Full-screen overlays (station popup, alert banner, last-updated text)
  stationPopup: 1000,
  alertBanner: 1000,
  lastUpdated: 1000,

  // Mapbox popup close button (inside onclick-popup stacking context)
  mapboxPopupCloseButton: 20,

  // Search bar sits above everything else
  searchBar: 1001,
} as const;

// ─── Station-popup internal stack (local stacking context) ───────────────────
export const ZPopup = {
  base: 2,
  note: 3,
  flyButton: 5,
  closeButton: 9,
  accessNote: 10,
  upcomingNote: 10,
} as const;

// ─── Publish as CSS custom properties ────────────────────────────────────────
// Converts camelCase key to css-style-name, e.g. nearbyPanel → nearby-panel
function toCssName(key: string): string {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export function applyZIndexVars(): void {
  const root = document.documentElement;
  for (const [key, val] of Object.entries(Z)) {
    root.style.setProperty(`--z-index-${toCssName(key)}`, String(val));
  }
  for (const [key, val] of Object.entries(ZPopup)) {
    root.style.setProperty(`--z-index-popup-${toCssName(key)}`, String(val));
  }
}
