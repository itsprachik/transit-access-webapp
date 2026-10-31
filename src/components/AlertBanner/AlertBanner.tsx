import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { StatusIcon } from "@/components/StatusIcon/StatusIcon";
import { AlertData } from "@/types/alerts";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "dismissed-system-alerts";

// Severity → status palette, so a good-news banner doesn't look like a warning
const ALERT_TONES = {
  success: { glyph: "check", surface: "bg-status-ok-muted", icon: "text-status-ok" },
  info: { glyph: "info", surface: "bg-background", icon: "text-muted-foreground" },
  warning: { glyph: "alert", surface: "bg-status-partial-muted", icon: "text-status-partial" },
  error: { glyph: "alert", surface: "bg-status-out-muted", icon: "text-status-out" },
} as const;

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// Dismissals are remembered by alert text, so a new or reworded alert shows again
const AlertBanner: React.FC<{ alerts: AlertData[] }> = ({ alerts }) => {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => setDismissed(readDismissed()), []);

  const dismiss = (text: string) => {
    const next = [...dismissed, text];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Private mode or blocked storage: the dismissal just won't survive a reload
    }
  };

  const visible = alerts.filter((alert) => !dismissed.includes(alert.text));
  if (visible.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      {visible.map((alert) => {
        const tone = ALERT_TONES[alert.severity] ?? ALERT_TONES.warning;
        return (
          <div
            key={alert.text}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl py-3 pl-4 pr-1 shadow-[0_1px_2px_oklch(0_0_0/0.08),0_4px_12px_oklch(0_0_0/0.1)]",
              tone.surface,
            )}
          >
            <StatusIcon glyph={tone.glyph} className={cn("mt-0.5 size-[18px]", tone.icon)} />
            <p className="min-w-0 flex-1 text-subhead text-pretty">{alert.text}</p>
            <button
              type="button"
              onClick={() => dismiss(alert.text)}
              aria-label="Dismiss alert"
              className="-my-2.5 grid size-11 shrink-0 place-items-center rounded-full text-foreground/60 active:bg-foreground/10"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AlertBanner;
