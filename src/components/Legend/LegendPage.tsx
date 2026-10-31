import React from "react";
import { FaWrench } from "react-icons/fa";
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
import { StatusIcon } from "@/components/StatusIcon/StatusIcon";
import { getADAPctByComplex } from "@/utils/dataUtils";
import pkg from "../../../package.json";

interface LegendPageProps {
  numOutElevators: number;
  totalElevators: number;
  lastUpdated: Date | null;
}

const MAP_ITEMS = [
  { icon: <LiftGood />, label: "All elevators in service" },
  { icon: <WarnIcon />, label: "At least one elevator out of service" },
  { icon: <LiftBad />, label: "All elevators out of service" },
  { icon: <RedX size={20} />, label: "Station not ADA accessible" },
];

const STATION_ITEMS = [
  { icon: <ElevatorIcon />, label: "Street elevator, exact location shown on map" },
  { icon: <ElevatorInvertedIcon />, label: "Platform elevator, not shown on map" },
  { icon: <Ramp />, label: "Ramp" },
];

const ELEVATOR_ITEMS = [
  {
    icon: <AccessibleIconWhite fill="#501759e6" size={16} />,
    bg: "#f4c6fbe6",
    label: "Access tip from the community",
  },
  { icon: <FaWrench color="#c80000" size="12" />, bg: "#fff", label: "Upcoming short-term outage" },
  { icon: <FaWrench color="#fff" size="12" />, bg: "#c80000", label: "Upcoming long-term outage" },
];

// Same outlined group as the station lists, so the legend reads as part of the sheet
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-6">
      <h3 className="px-4 pb-2 text-caption font-semibold uppercase tracking-[0.06em] text-muted-foreground">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-border [&>*+*]:border-t [&>*+*]:border-border">
        {children}
      </div>
    </section>
  );
}

function Row({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center gap-3 px-4 py-3 text-body">
      {icon && (
        // The legacy icon components ignore size props, so cap the SVGs here
        <span
          className="grid size-7 shrink-0 place-items-center [&>svg]:max-h-6 [&>svg]:max-w-7 [&>svg]:h-auto [&>svg]:w-auto"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}

function IconList({ title, items }: { title: string; items: { icon: React.ReactNode; label: string; bg?: string }[] }) {
  return (
    <Group title={title}>
      {items.map(({ icon, label, bg }) => (
        <Row
          key={label}
          icon={
            bg ? (
              <span className="grid size-6 place-items-center rounded-md" style={{ backgroundColor: bg }}>
                {icon}
              </span>
            ) : (
              icon
            )
          }
        >
          {label}
        </Row>
      ))}
    </Group>
  );
}

const LegendPage: React.FC<LegendPageProps> = ({ numOutElevators, totalElevators, lastUpdated }) => {
  const numInService = totalElevators - numOutElevators;
  const pctOut = Math.round((numOutElevators / totalElevators) * 100);
  const pctAccessible = getADAPctByComplex();
  const updatedAt = lastUpdated?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div>
      <header className="px-4">
        <h2 className="text-title">Legend</h2>
        <p className="mt-1 text-subhead text-muted-foreground">
          Live elevator status for the NYC subway. Tap a station for details.
        </p>
      </header>

      {/* aria-live so screen readers hear refreshed counts without being interrupted */}
      <section className="px-4 pt-6" aria-labelledby="live-status-heading" aria-live="polite" aria-atomic="true">
        <h3 id="live-status-heading" className="px-4 pb-2 text-caption font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Live status
        </h3>
        <div className="overflow-hidden rounded-xl border border-border [&>*+*]:border-t [&>*+*]:border-border">
          <Row icon={<StatusIcon glyph="warning" className="size-[18px] text-status-partial" />}>
            <span className="flex-1">Out of service</span>
            <span className="font-semibold tabular-nums text-status-partial-foreground">
              {lastUpdated ? numOutElevators : "–"}
            </span>
          </Row>
          <Row icon={<StatusIcon glyph="check" className="size-[18px] text-status-ok" />}>
            <span className="flex-1">In service</span>
            <span className="font-semibold tabular-nums">{lastUpdated ? numInService : "–"}</span>
          </Row>
        </div>
        <p className="px-4 pt-2 text-footnote tabular-nums text-muted-foreground">
          {lastUpdated
            ? `${pctOut}% of ${totalElevators} elevators are out · Updated ${updatedAt}`
            : "Loading live status…"}
        </p>
      </section>

      <IconList title="On the map" items={MAP_ITEMS} />
      <IconList title="At a station" items={STATION_ITEMS} />
      <IconList title="On an elevator" items={ELEVATOR_ITEMS} />

      <Group title="Getting around">
        <p className="px-4 py-3 text-subhead text-pretty">
          {pctAccessible < 75 ? "Only " : ""}
          <span className="font-semibold tabular-nums">{pctAccessible}%</span> of subway stations are ADA
          accessible. Check here that yours is in service before you go.
        </p>
        <p className="px-4 py-3 text-subhead text-pretty">
          The MTA takes elevators out for replacement for 8–12 months at a time. Upcoming outages show on
          each station’s page.
        </p>
        <div className="flex flex-col gap-3 px-4 py-3">
          <p className="text-subhead text-pretty">
            Mobility devices board in the middle of the platform. Look for the conductor and the blue Boarding
            Area sign.
          </p>
          <img
            src="/boardingarea.png"
            alt="A blue Boarding Area sign on a subway platform ceiling, marking where mobility device users wait to board"
            className="w-full rounded-lg"
          />
        </div>
      </Group>

      <section className="px-8 pb-2 pt-6 text-footnote text-muted-foreground" aria-label="About">
        <p className="text-pretty">
          Data comes from the MTA’s real-time feed and{" "}
          <a href="https://data.ny.gov" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            Open Data NY
          </a>
          , so it’s only as accurate as their reporting. Check{" "}
          <a href="https://mta.info" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            mta.info
          </a>{" "}
          for official notices.
        </p>
        <p className="mt-3">
          Version {pkg.version} · © {new Date().getFullYear()} Transit Access LLC
          <br />
          Built by Joel Chapman &amp; Prachi Kulkarni
        </p>
      </section>
    </div>
  );
};

export default LegendPage;
