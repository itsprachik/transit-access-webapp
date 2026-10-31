// Shared hover/press feedback so every tappable surface in the sheet responds the same way.
// Tints are foreground at low alpha, so they read on white rows and on the pink out-of-service rows alike.

/** Full-width list rows */
export const ROW_PRESS =
  "transition-colors duration-150 hover:bg-foreground/[0.04] active:bg-foreground/[0.08]";

/** Round icon and text buttons */
export const BUTTON_PRESS =
  "transition-colors duration-150 hover:bg-foreground/[0.08] active:bg-foreground/[0.12]";

/** Opening and closing rows: a quick start that settles gently (iOS sheet curve) */
export const EXPAND_EASE = "ease-[cubic-bezier(0.32,0.72,0,1)] duration-[250ms]";
