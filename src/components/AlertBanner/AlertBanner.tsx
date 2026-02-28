import React, { useRef } from "react";
import { Alert, Collapse } from "@mui/material";
import { AlertBannerProps } from "@/types/alerts";
const AlertBanner: React.FC<AlertBannerProps> = ({
  alertData,
  openStates,
  onClose,
}) => {
  const observerRef = useRef<ResizeObserver | null>(null);

  const callbackRef = (el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el) {
      document.documentElement.style.setProperty("--alert-height", "0px");
      document.documentElement.classList.remove("alert-open");
      return;
    }
    observerRef.current = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height;
      const current = parseFloat(
        document.documentElement.style.getPropertyValue("--alert-height") || "0"
      );
      if (Math.abs(height - current) < 1) return; // ignore sub-pixel changes
      document.documentElement.style.setProperty("--alert-height", `${height}px`);
      document.documentElement.classList.toggle("alert-open", height > 0);
    });
    observerRef.current.observe(el);
  };

  if (!alertData || alertData.length === 0) {
    return null;
  }

  return (
    <div
      ref={callbackRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        pointerEvents: "none",
        maxWidth: "100vw",
        boxSizing: "border-box",
      }}
    >
      {alertData.map(
        (alert, index) =>
          openStates[index] !== false && (
            <Collapse key={index} in={openStates[index] === true}>
              <Alert
                severity={alert.severity || "warning"}
                onClose={() => onClose(index)}
                sx={{
                  mb: 2,
                  pointerEvents: "auto",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
              >
                {alert.text}
              </Alert>
            </Collapse>
          ),
      )}
    </div>
  );
};

export default AlertBanner;
