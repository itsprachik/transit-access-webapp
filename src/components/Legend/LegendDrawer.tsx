import React, { useState } from "react";
import {
  SwipeableDrawer,
  IconButton,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import {
  LiftGood,
  WarnIcon,
  LiftBad,
  ElevatorIcon,
  ElevatorInvertedIcon,
  AccessibleIconWhite,
  RedX,
  Ramp,
} from "../icons";

import { getADAPctByStation, getADAPctByComplex } from "@/utils/dataUtils";

import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import pkg from "../../../package.json";
import { FaWrench } from "react-icons/fa";

interface LegendDrawerProps {
  numOutElevators: number;
  totalElevators: number;
  pctInService: number;
  hasAlert?: boolean;
  lastUpdated?: Date;
}

const LegendDrawer: React.FC<LegendDrawerProps> = ({
  numOutElevators,
  totalElevators,
  pctInService,
  hasAlert,
  lastUpdated,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Open map legend and about"
        sx={{
          position: "fixed",
          top: hasAlert ? 140 : 97,
          left: 6,
          zIndex: 999,
          backgroundColor: "#fefefed6",
          boxShadow: 2,
          padding: "6px",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          "&:hover": { backgroundColor: "#f5f5f5" },
        }}
      >
        <MenuIcon sx={{ fontSize: 20 }} />
      </IconButton>

      {/* Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        aria-label="Map legend and about"
        swipeAreaWidth={20}
      >
        <Box
          sx={{
            width: 300,
            p: 3,
            backgroundColor: "#fdfdfdff",
          }}
        >
          {/* Header row with close button */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              mb: 0,
            }}
          >
            {/* Logo + title overlay */}
            <Box sx={{ position: "relative", width: 220, height: 110 }}>
              <Box
                component="img"
                src="/transitaccesslogo.png"
                alt="Transit Access logo: Two subway lines sweeping right"
                sx={{
                  width: "100%",
                  objectFit: "contain",
                  objectPosition: "left",
                  position: "absolute",
                  top: -80,
                  left: -20,
                }}
              />
              <Typography
                sx={{
                  position: "absolute",
                  display: "flex",
                  top: 15,
                  left: 40,
                  fontWeight: 700,
                  fontSize: 25,
                  lineHeight: 1,
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ ml: 1 }}>
                  <AccessibleIconWhite />
                </Box>
                Transit Access
              </Typography>
            </Box>

            {/* Close button pinned to top-right */}
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              size="small"
              sx={{ mt: 0 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={1}>
            This map shows live elevator status in the NYC subway system. <br />
            <br />
            Tap on a station for more info!
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" mb={2}>
            Live Summary
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            There are{" "}
            <span
              style={{
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "16px",
                WebkitTextStroke: "0.5px currentColor",
              }}
            >
              {numOutElevators}
            </span>{" "}
            elevators out of service at this time {"("}
            {100 - pctInService}% of the system{")"}
            <br />
            <br />
            <span
              style={{
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "16px",
                WebkitTextStroke: "0.5px currentColor",
              }}
            >
              {totalElevators - numOutElevators}
            </span>{" "}
            elevators available for use
            <br />
            <br />
            <span
              style={{
                fontSize: "11px",
              }}
            >
              Last updated:{" "}
              {lastUpdated?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Map Legend
          </Typography>

          {[
            { icon: <LiftGood />, label: "All elevators in service" },
            {
              icon: <WarnIcon />,
              label: "At least one elevator out of service",
            },
            { icon: <LiftBad />, label: "All elevators out of service" },
            { icon: <RedX size={20} />, label: "Station not ADA accessible" },
          ].map(({ icon, label }) => (
            <Box
              key={label}
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {icon}
              </Box>
              <Typography variant="body2">{label}</Typography>
            </Box>
          ))}

          <br />
          <Typography variant="subtitle2" gutterBottom>
            Station Legend
          </Typography>

          {[
            {
              icon: <ElevatorIcon />,
              label: "Street elevator (exact location shown on map)",
            },
            {
              icon: <ElevatorInvertedIcon />,
              label: "Platform elevator (not shown on map)",
            },
            {
              icon: <Ramp />,
              label: "Ramp",
            },
          ].map(({ icon, label }) => (
            <Box
              key={label}
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {icon}
              </Box>
              <Typography variant="body2">{label}</Typography>
            </Box>
          ))}

          <br />
          <Typography variant="subtitle2" gutterBottom>
            Elevator Legend
          </Typography>

          {[
            {
              icon: <AccessibleIconWhite fill="#501759e6" size={16} />,
              bg: "#f4c6fbe6",
              label: "Access tip from the community",
            },
            {
              icon: <FaWrench color="#c80000" size="12" />,
              bg: "#fff",
              label: "Upcoming outage (short-term)",
            },
            {
              icon: <FaWrench color="#fff" size="12" />,
              bg: "#c80000",
              label: "Upcoming outage (long-term)",
            },
          ].map(({ icon, bg, label }) => (
            <Box
              key={label}
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: bg,
                }}
              >
                {icon}
              </Box>
              <Typography variant="body2">{label}</Typography>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" mb={2}>
            General Accessibility Notes
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            • {getADAPctByComplex() < 75 ? "Only " : ""}
            <span
              style={{
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "16px",
                WebkitTextStroke: "0.5px currentColor",
              }}
            >
              {getADAPctByComplex()}%{" "}
            </span>{" "}
            of stations in the MTA are ADA accessible. Use Transit Access to
            check if your accessible station is in service.
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            • The MTA is taking elevators out of service for replacement for
            8-12 months at a time. Use Transit Access to stay ready and
            up-to-date.
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            • Mobility devices board in the middle of the platform. Look for the
            conductor and the blue Boarding Area sign.
          </Typography>

          <Box
            component="img"
            src="/boardingarea.png"
            alt="Blue Boarding Area sign on platform"
            sx={{ width: "100%", borderRadius: 1, mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            About
          </Typography>
          <Typography variant="body2" color="text.secondary">
            v{pkg.version}
            <br />© {new Date().getFullYear()} Transit Access LLC <br />
            Built by Joel Chapman & Prachi Kulkarni <br /> <br />
          </Typography>

          <Box
            component="a"
            href="https://www.buymeacoffee.com/transitaccess"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Box
              component="img"
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              sx={{ height: 40, width: "auto", mb: 2 }}
            />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "11px" }}
          >
            Disclaimer: App data pulled from MTA's GTFS-realtime feed and Open
            Data NY (<a href="https://data.ny.gov">data.ny.gov</a>). Accuracy is
            highly dependent on the data provided. If you suspect any
            inaccuracies, check MTA's website for official notices at{" "}
            <a href="https://mta.info">mta.info</a>
          </Typography>

          <Divider sx={{ my: 2 }} />
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default LegendDrawer;
