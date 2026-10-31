import React from "react";
import { Wrench } from "lucide-react";
import { AccessibleIconWhite } from "../icons";
import { StatusIcon } from "@/components/StatusIcon/StatusIcon";
import { cn } from "@/lib/utils";

// Every status pill and badge in the app. Two sizes only: `summary` for a station's header,
// `row` for anything inside a list. The legend renders these same components.

export type StatusTone = "ok" | "partial" | "out" | "neutral";
type PillSize = "row" | "summary";

const TONES: Record<StatusTone, { surface: string; icon?: string; glyph?: "check" | "alert" }> = {
  ok: { surface: "bg-status-ok-muted text-status-ok-foreground", icon: "text-status-ok", glyph: "check" },
  partial: { surface: "bg-status-partial-muted text-status-partial-foreground", icon: "text-status-partial", glyph: "alert" },
  // Fully out is the one state drawn solid, wherever it appears
  out: {
    surface: "bg-status-out text-white",
    icon: "text-white [--status-icon-glyph:oklch(var(--status-out))]",
    glyph: "alert",
  },
  neutral: { surface: "bg-foreground/[0.06] text-foreground" },
};

const SIZES: Record<PillSize, { pill: string; icon: string }> = {
  row: { pill: "gap-1 py-0.5 pl-1 pr-2 text-caption", icon: "size-3.5" },
  summary: { pill: "gap-1.5 py-1.5 pl-2 pr-3 text-footnote", icon: "size-4" },
};

export function StatusPill({
  tone,
  children,
  size = "row",
}: {
  tone: StatusTone;
  children: React.ReactNode;
  size?: PillSize;
}) {
  const t = TONES[tone];
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-semibold",
        s.pill,
        !t.glyph && (size === "row" ? "pl-2" : "pl-3"),
        t.surface,
      )}
    >
      {t.glyph && <StatusIcon glyph={t.glyph} className={cn(s.icon, t.icon)} />}
      {children}
    </span>
  );
}

export const InServicePill = ({ label = "In service" }: { label?: string }) => (
  <StatusPill tone="ok">{label}</StatusPill>
);

export const OutOfServicePill = () => <StatusPill tone="out">Out of service</StatusPill>;

// Extra information about an elevator: outlined, so it never competes with the status pill
function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        // py-px + the 1px border matches a row pill's height
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background py-px pl-1.5 pr-2 text-caption font-semibold text-foreground",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export const AccessTipBadge = () => (
  <Badge icon={<AccessibleIconWhite size={12} fill="#6b2177" />}>Access tip</Badge>
);

export const OutagePlannedBadge = () => (
  <Badge icon={<Wrench className="size-3 text-status-out" strokeWidth={2.5} aria-hidden="true" />}>Outage planned</Badge>
);

export const MaintenanceBadge = ({ when }: { when: string }) => (
  <Badge icon={<Wrench className="size-3 text-status-partial" strokeWidth={2.5} aria-hidden="true" />}>
    Maintenance {when}
  </Badge>
);
