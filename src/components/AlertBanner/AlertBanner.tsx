import React from "react";
import { Alert, Collapse } from "@mui/material";
import { AlertBannerProps } from "@/types/alerts";

const AlertBanner: React.FC<AlertBannerProps> = ({
  alertData,
  openStates,
  onClose,
}) => {
  if (!alertData || alertData.length === 0) {
    return null;
  }

  return (
    <div
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
                  // formerly .css-zioonp-MuiAlert-message
                  "& .MuiAlert-message": {
                    fontSize: "12px",
                  },
                  // formerly .css-rgppqo-MuiAlert-action
                  "& .MuiAlert-action": {
                    padding: "4px 0 0 4px",
                  },
                  // formerly .css-1ckov0h-MuiSvgIcon-root
                  "& .MuiSvgIcon-root": {
                    width: "0.8em",
                    height: "0.8em",
                  },
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
