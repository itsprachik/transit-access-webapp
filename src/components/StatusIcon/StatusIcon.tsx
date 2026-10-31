import React from "react";
import { cn } from "@/lib/utils";

// Solid disc with a white glyph. Reads at 14px where lucide's outlined
// icons turn into a thin ring; takes its disc color from `currentColor`.
const GLYPHS = {
  check: <path d="M4.75 8.25 7 10.5l4.25-4.75" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />,
  alert: (
    <>
      <rect x="7.1" y="3.75" width="1.8" height="5.5" rx="0.9" fill="white" />
      <circle cx="8" cy="11.6" r="1.05" fill="white" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="4.6" r="1.05" fill="white" />
      <rect x="7.1" y="6.75" width="1.8" height="5.5" rx="0.9" fill="white" />
    </>
  ),
};

interface StatusIconProps {
  glyph: keyof typeof GLYPHS;
  className?: string;
}

export function StatusIcon({ glyph, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4 shrink-0", className)} aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      {GLYPHS[glyph]}
    </svg>
  );
}

export default StatusIcon;
