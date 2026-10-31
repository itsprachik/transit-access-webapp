import React from "react";
import { cn } from "@/lib/utils";

// Solid shape with a white glyph. Reads at 14px where lucide's outlined
// icons turn into a thin ring; takes its fill color from `currentColor`.
// On a solid pill, set --status-icon-glyph to the pill's color so the glyph cuts through.
const DISC = <circle cx="8" cy="8" r="8" fill="currentColor" />;

const ICONS = {
  check: (
    <>
      {DISC}
      <path d="M4.75 8.25 7 10.5l4.25-4.75" fill="none" stroke="var(--status-icon-glyph, white)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  alert: (
    <>
      {DISC}
      <rect x="7.1" y="3.75" width="1.8" height="5.5" rx="0.9" fill="var(--status-icon-glyph, white)" />
      <circle cx="8" cy="11.6" r="1.05" fill="var(--status-icon-glyph, white)" />
    </>
  ),
  info: (
    <>
      {DISC}
      <circle cx="8" cy="4.6" r="1.05" fill="var(--status-icon-glyph, white)" />
      <rect x="7.1" y="6.75" width="1.8" height="5.5" rx="0.9" fill="var(--status-icon-glyph, white)" />
    </>
  ),
  // Triangle for "degraded, still usable", as opposed to the disc for "down"
  warning: (
    <>
      <path d="M6.7 1.75a1.5 1.5 0 0 1 2.6 0l6.3 11a1.5 1.5 0 0 1-1.3 2.25H1.7a1.5 1.5 0 0 1-1.3-2.25z" fill="currentColor" />
      <rect x="7.1" y="5.25" width="1.8" height="4.75" rx="0.9" fill="var(--status-icon-glyph, white)" />
      <circle cx="8" cy="12.2" r="1.05" fill="var(--status-icon-glyph, white)" />
    </>
  ),
};

interface StatusIconProps {
  glyph: keyof typeof ICONS;
  className?: string;
}

export function StatusIcon({ glyph, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4 shrink-0", className)} aria-hidden="true">
      {ICONS[glyph]}
    </svg>
  );
}

export default StatusIcon;
