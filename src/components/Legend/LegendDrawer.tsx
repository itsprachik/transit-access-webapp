import React, { useState, useId } from "react";
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
  const drawerId = useId(); // stable ID for aria-controls / aria-labelledby

  const numInService = totalElevators - numOutElevators;
  const pctOut = 100 - pctInService;

  const formattedTime = lastUpdated?.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const mapLegendItems = [
    { icon: <LiftGood />, iconLabel: "Blue checkmark", label: "All elevators in service" },
    { icon: <WarnIcon />, iconLabel: "Yellow exclamation mark", label: "At least one elevator out of service" },
    { icon: <LiftBad />, iconLabel: "Red exclamation mark", label: "All elevators out of service" },
    { icon: <RedX size={20} />, iconLabel: "Red X", label: "Station not ADA accessible", srLabel: "Station not A.D.A. accessible" },
  ];

  const stationLegendItems = [
    {
      icon: <ElevatorIcon />,
      iconLabel: "Black elevator",
      label: "Street elevator (exact location shown on map)",
    },
    {
      icon: <ElevatorInvertedIcon />,
      iconLabel: "White elevator",
      label: "Platform elevator (not shown on map)",
    },
    { icon: <Ramp />, iconLabel: "Ramp slope", label: "Ramp" },
  ];

  const elevatorLegendItems = [
    {
      icon: <AccessibleIconWhite fill="#501759e6" size={16} />,
      iconLabel: "Purple wheelchair symbol",
      bg: "#f4c6fbe6",
      label: "Access tip from the community",
    },
    {
      icon: <FaWrench color="#c80000" size="12" />,
      iconLabel: "Red wrench",
      bg: "#fff",
      label: "Upcoming outage (short-term)",
    },
    {
      icon: <FaWrench color="#fff" size="12" />,
      iconLabel: "White wrench on red background",
      bg: "#c80000",
      label: "Upcoming outage (long-term)",
    },
  ];

  return (
    <>
      {/* Floating trigger button */}
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Open map legend and about"
        aria-expanded={open}
        aria-controls={drawerId}
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
          transition: "top 0.2s",
          "&:hover": { backgroundColor: "#f5f5f5" },
        }}
      >
        <MenuIcon sx={{ fontSize: 20 }} aria-hidden="true" />
      </IconButton>

      {/* Drawer — role="dialog" with accessible name comes from aria-labelledby */}
      <SwipeableDrawer
        anchor="left"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        swipeAreaWidth={20}
        // MUI's SwipeableDrawer renders a <div role="presentation"> wrapper;
        // the inner Paper needs the dialog semantics via PaperProps.
        PaperProps={{
          id: drawerId,
          role: "dialog",
          "aria-modal": true,
          "aria-label": "Map legend and about Transit Access",
          component: "div",
        }}
      >
        <Box
          sx={{
            width: 300,
            p: 3,
            backgroundColor: "#fdfdfdff",
          }}
        >
          {/* ── Header ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              mb: 0,
            }}
          >
            <Box sx={{ position: "relative", width: 220, height: 110 }}>
              <Box
                component="img"
                src="/transitaccesslogo.png"
                // Decorative — the heading text below is the real label
                alt=""
                aria-hidden="true"
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
                component="h2"
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
                {/* Icon is decorative — heading text is sufficient */}
                <Box sx={{ ml: 1 }} aria-hidden="true">
                  <AccessibleIconWhite />
                </Box>
                Transit Access
              </Typography>
            </Box>

            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              size="small"
              sx={{ mt: 0 }}
            >
              <CloseIcon fontSize="small" aria-hidden="true" />
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={1}
            aria-label="This map shows live elevator status in the New York City subway system. Tap on a station for more info!"
          >
            <span aria-hidden="true">
              This map shows live elevator status in the NYC subway system.
              <br />
              <br />
              Tap on a station for more info!
            </span>
          </Typography>

          <Divider aria-hidden="true" sx={{ my: 2 }} />

          {/* ── Live Summary ──
              aria-live="polite" so screen readers re-announce when data refreshes
              without interrupting the user. aria-atomic keeps the whole region
              together so partial updates don't read mid-sentence fragments. */}
          <section aria-labelledby="live-summary-heading">
            <Typography
              id="live-summary-heading"
              variant="h6"
              component="h3"
              mb={2}
            >
              Live Summary
            </Typography>

              <Typography variant="body2" color="text.secondary" mb={1}>
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
                elevators out of service at this time ({pctOut}% of the system).
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                <span
                  style={{
                    fontWeight: 900,
                    fontStyle: "italic",
                    fontSize: "16px",
                    WebkitTextStroke: "0.5px currentColor",
                  }}
                >
                  {numInService}
                </span>{" "}
                elevators available for use.
              </Typography>
              {formattedTime && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  mb={2}
                  sx={{ fontSize: "11px" }}
                >
                  {`Last updated: ${formattedTime}`}
                </Typography>
              )}
          </section>

          <Divider aria-hidden="true" sx={{ my: 2 }} />

          {/* ── Map Legend ── */}
          <section aria-labelledby="map-legend-heading">
            <Typography
              id="map-legend-heading"
              variant="subtitle2"
              component="h3"
              gutterBottom
            >
              Map Legend
            </Typography>

            {/* Use a real <ul> so AT announces "list, 4 items" */}
            <Box
              component="ul"
              aria-label="Map legend"
              sx={{ listStyle: "none", p: 0, m: 0 }}
            >
              {mapLegendItems.map(({ icon, iconLabel, label, srLabel }) => (
                <Box
                  key={label}
                  component="li"
                  aria-label={`${iconLabel}, ${srLabel ?? label}`}
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Box aria-hidden="true" sx={{ width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                  </Box>
                  <Typography aria-hidden="true" variant="body2">{label}</Typography>
                </Box>
              ))}
            </Box>
          </section>

          <br />

          {/* ── Station Legend ── */}
          <section aria-labelledby="station-legend-heading">
            <Typography
              id="station-legend-heading"
              variant="subtitle2"
              component="h3"
              gutterBottom
            >
              Station Legend
            </Typography>

            <Box
              component="ul"
              aria-label="Station legend"
              sx={{ listStyle: "none", p: 0, m: 0 }}
            >
              {stationLegendItems.map(({ icon, iconLabel, label }) => (
                <Box
                  key={label}
                  component="li"
                  aria-label={`${iconLabel}, ${label}`}
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Box aria-hidden="true" sx={{ width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center" }}>
                    {icon}
                  </Box>
                  <Typography aria-hidden="true" variant="body2">{label}</Typography>
                </Box>
              ))}
            </Box>
          </section>

          <br />

          {/* ── Elevator Legend ── */}
          <section aria-labelledby="elevator-legend-heading">
            <Typography
              id="elevator-legend-heading"
              variant="subtitle2"
              component="h3"
              gutterBottom
            >
              Elevator Legend
            </Typography>

            <Box
              component="ul"
              aria-label="Elevator legend"
              sx={{ listStyle: "none", p: 0, m: 0 }}
            >
              {elevatorLegendItems.map(({ icon, iconLabel, bg, label }) => (
                <Box
                  key={label}
                  component="li"
                  aria-label={`${iconLabel}, ${label}`}
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{ width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: bg }}
                  >
                    {icon}
                  </Box>
                  <Typography aria-hidden="true" variant="body2">{label}</Typography>
                </Box>
              ))}
            </Box>
          </section>

          <Divider aria-hidden="true" sx={{ my: 2 }} />

          {/* ── Accessibility Notes ── */}
          <section aria-labelledby="accessibility-notes-heading">
            <Typography
              id="accessibility-notes-heading"
              variant="h6"
              component="h3"
              mb={2}
            >
              General Accessibility Notes
            </Typography>

            {/* Use a list so AT can navigate items */}
            <Box
              component="ul"
              sx={{ listStyle: "none", p: 0, m: 0 }}
            >
              <Box
                component="li"
                aria-label={`${getADAPctByComplex() < 75 ? "Only " : ""}${getADAPctByComplex()}% of stations in the MTA are A.D.A. accessible. Use Transit Access to check if your accessible station is in service.`}
              >
                <Typography aria-hidden="true" variant="body2" color="text.secondary" mb={2}>
                  {getADAPctByComplex() < 75 ? "Only " : ""}
                  <span
                    style={{
                      fontWeight: 900,
                      fontStyle: "italic",
                      fontSize: "16px",
                      WebkitTextStroke: "0.5px currentColor",
                    }}
                  >
                    {getADAPctByComplex()}%{" "}
                  </span>
                  of stations in the MTA are ADA accessible. Use Transit Access
                  to check if your accessible station is in service.
                </Typography>
              </Box>

              <Box component="li">
                <Typography variant="body2" color="text.secondary" mb={2}>
                  The MTA is taking elevators out of service for replacement for
                  8–12 months at a time. Use Transit Access to stay ready and
                  up-to-date.
                </Typography>
              </Box>

              <Box component="li">
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Mobility devices board in the middle of the platform. Look for
                  the conductor and the blue Boarding Area sign.
                </Typography>
              </Box>
            </Box>

            <Box
              component="img"
              src="/boardingarea.png"
              alt="A blue Boarding Area sign mounted on the ceiling of a subway platform, indicating where mobility device users should wait to board"
              sx={{ width: "100%", borderRadius: 1, mb: 2 }}
            />
          </section>

          <Divider aria-hidden="true" sx={{ my: 2 }} />

          {/* ── About ── */}
          <section aria-labelledby="about-heading">
            <Typography
              id="about-heading"
              variant="subtitle2"
              component="h3"
              gutterBottom
            >
              About
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Version {pkg.version}
              <br />© {new Date().getFullYear()} Transit Access LLC
              <br />
              Built by Joel Chapman &amp; Prachi Kulkarni
              <br />
              <br />
            </Typography>

            {/* External link — visible text already describes destination */}
            <Box
              component="a"
              href="https://www.buymeacoffee.com/transitaccess"
              target="_blank"
              rel="noopener noreferrer"
              // Explicit label since the link's content is only an image
              aria-label="Buy Me A Coffee — support Transit Access (opens in new tab)"
            >
              <Box
                component="img"
                // alt="" since the link itself carries the accessible name above
                alt=""
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                sx={{ height: 40, width: "auto", mb: 2 }}
              />
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "11px" }}
            >
              Disclaimer: App data pulled from MTA's GTFS-realtime feed and Open
              Data NY (
              <a
                href="https://data.ny.gov"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Data NY — data.ny.gov (opens in new tab)"
              >
                data.ny.gov
              </a>
              ). Accuracy is highly dependent on the data provided. If you
              suspect any inaccuracies, check MTA's website for official notices
              at{" "}
              <a
                href="https://mta.info"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MTA website — mta.info (opens in new tab)"
              >
                mta.info
              </a>
              .
            </Typography>
          </section>

          <Divider aria-hidden="true" sx={{ my: 2 }} />
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default LegendDrawer;