import React, { useEffect, useMemo, useRef, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Command as CommandPrimitive } from "cmdk";
import { matchSorter } from "match-sorter";
import { Info, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusPill, StatusTone, MaintenanceBadge } from "@/components/StationPopup/StatusBadges";
import { ROW_PRESS, BUTTON_PRESS } from "@/lib/interaction";
import { Drawer, DrawerPortal, DrawerTitle } from "@/components/ui/drawer";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { LineBullets } from "@/components/LineBullets/LineBullets";
import { StatusIcon } from "@/components/StatusIcon/StatusIcon";
import LegendPage from "@/components/Legend/LegendPage";
import { LocationPin, AccessibleIconWhite } from "@/components/icons";
import { useNearbyStations, WALKING_RADII, formatWalkingDistance } from "./useNearbyStations";
import { getComplexesDataset } from "@/lib/dataStore";
import { MtaStationData, MtaStationFeature } from "@/utils/types";
import { cn } from "@/lib/utils";

const SNAP_PEEK = "136px";
const SNAP_HALF = 0.55;
const SNAP_FULL = 0.94;
const MAX_RESULTS = 40;

type LngLat = [number, number];
type StationOutage = { stationID: string; isOut: boolean };
type ComplexStatus = "ok" | "partial" | "out";

interface ComplexRow {
  key: string;
  name: string;
  routes: Set<string>;
  feature: MtaStationFeature;
  coords: LngLat;
  isAccessible: boolean;
  status: ComplexStatus;
}

interface HomeSheetProps {
  open: boolean;
  numOutElevators: number;
  totalElevators: number;
  lastUpdated: Date | null;
  stationData: MtaStationData | null;
  stationOutages: StationOutage[] | null;
  // Live location (Mapbox geolocate), the dropped map pin, and the tap count on the locate button
  userLocation: LngLat | null;
  overrideLocation: LngLat | null;
  locateSignal: number;
  elevatorData: any[] | null;
  upcomingElevatorData: any[] | null;
  // Station or elevator details, built by the map handlers, shown as a sub-page
  page: HTMLElement | null;
  onBack: () => void;
  onSelectStation: (feature: MtaStationFeature, walkingToleranceMiles?: number | null) => void;
}

const COMMUNITY_LINKS = [
  { label: "Send feedback", href: "https://app.youform.com/forms/dnefmhvd" },
  { label: "Email the team", href: "mailto:team@transitaccess.org" },
  { label: "Join our Discord", href: "https://discord.gg/HgZVSJ9SE8" },
  { label: "Buy us a coffee", href: "https://www.buymeacoffee.com/transitaccess" },
  { label: "Instagram", href: "https://www.instagram.com/transitaccess/" },
  { label: "TikTok", href: "https://www.tiktok.com/@transitaccess" },
  { label: "Bluesky", href: "https://bsky.app/profile/transitaccess.bsky.social" },
];

function StationLabel({ name, routes }: { name: string; routes: string[] }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
      <span className="max-w-full truncate text-headline font-semibold">{name}</span>
      <LineBullets routes={routes} size="sm" />
    </span>
  );
}

const STATUS_CHIPS: Record<ComplexStatus, { tone: StatusTone; label: string }> = {
  ok: { tone: "ok", label: "Working" },
  partial: { tone: "partial", label: "Some out" },
  out: { tone: "out", label: "All out" },
};

function StatusChip({ status, label }: { status: ComplexStatus; label?: string }) {
  const chip = STATUS_CHIPS[status];
  return <StatusPill tone={chip.tone}>{label ?? chip.label}</StatusPill>;
}

// Inset grouped list: outlined card on the white sheet, rows split by dividers
function Group({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-6">
      {title && (
        <div className="flex items-center justify-between px-4 pb-2">
          <h3 className="text-caption font-semibold uppercase tracking-[0.06em] text-muted-foreground">{title}</h3>
          {action}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-border [&>*+*]:border-t [&>*+*]:border-border">
        {children}
      </div>
    </section>
  );
}

// A page pushed on top of the station list, with a back button to return to it
function SubPage({
  label,
  onBack,
  scrollable,
  endPadding,
  children,
}: {
  label: string;
  onBack: () => void;
  scrollable: boolean;
  endPadding: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerTitle className="sr-only">{label}</DrawerTitle>
      <div className="px-2 pb-1">
        <Button
          variant="ghost"
          onClick={onBack}
          className={cn("h-11 gap-0.5 rounded-full pl-1.5 pr-3 text-body font-normal text-foreground hover:bg-transparent", BUTTON_PRESS)}
        >
          <ChevronLeft className="size-6" />
          Stations
        </Button>
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 overscroll-contain",
          scrollable ? "overflow-y-auto" : "overflow-hidden",
        )}
        style={endPadding}
      >
        {children}
      </div>
    </div>
  );
}

// The map handlers render station details into their own React root; adopt that node
function AdoptedNode({ node }: { node: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.replaceChildren(node);
    ref.current?.parentElement?.scrollTo({ top: 0 });
  }, [node]);

  return <div ref={ref} />;
}

// Highlight only while the sheet has focus, so touch users don't see a phantom selection
const itemClass =
  "group/row flex min-h-14 cursor-pointer items-center gap-3 rounded-none px-4 py-3 text-body transition-colors duration-150 data-[selected=true]:bg-transparent hover:!bg-foreground/[0.04] active:!bg-foreground/[0.08] group-focus-within:data-[selected=true]:bg-foreground/[0.04]";

const HomeSheet: React.FC<HomeSheetProps> = ({
  open,
  numOutElevators,
  totalElevators,
  lastUpdated,
  stationData,
  stationOutages,
  userLocation,
  overrideLocation,
  locateSignal,
  elevatorData,
  upcomingElevatorData,
  page,
  onBack,
  onSelectStation,
}) => {
  const [snap, setSnap] = useState<number | string | null>(SNAP_PEEK);
  const [query, setQuery] = useState("");
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoaded = lastUpdated !== null;

  // Opening a station lifts the sheet so its details show; going back lowers it
  useEffect(() => {
    if (page) setIsLegendOpen(false);
    setSnap(page ? SNAP_HALF : SNAP_PEEK);
  }, [page]);

  const openLegend = () => {
    setIsLegendOpen(true);
    setSnap(SNAP_FULL);
  };

  const closeLegend = () => {
    setIsLegendOpen(false);
    setSnap(SNAP_PEEK);
  };

  const nearby = useNearbyStations({
    userLocation,
    overrideLocation,
    elevatorData,
    stationOutages,
    upcomingElevatorData,
  });

  // Tapping the map's locate button brings the nearby list into view
  useEffect(() => {
    if (locateSignal > 0 && !page) setSnap((s) => (s === SNAP_PEEK ? SNAP_HALF : s));
  }, [locateSignal]);

  const stationOptions = useMemo(
    () =>
      (stationData?.features ?? []).map((feature) => ({
        feature,
        key: feature.properties.gtfs_stop_id,
        name: feature.properties.stop_name,
        routes: feature.properties.daytime_routes.split(" ").filter(Boolean),
        isAccessible: feature.properties.ada !== "0",
      })),
    [stationData],
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return matchSorter(stationOptions, query, {
      keys: [(o) => o.name.replace(/-/g, " "), (o) => o.routes.join(" ")],
    }).slice(0, MAX_RESULTS);
  }, [query, stationOptions]);

  // One row per complex. A street elevator outage marks every station in the
  // complex, so a complex is "out" only if each affected station is fully out.
  const complexes = useMemo(() => {
    if (!stationData) return [];
    const complexInfo = new Map(
      getComplexesDataset().features.map((f) => [f.properties.complex_id, f]),
    );
    const outages = new Map((stationOutages ?? []).map((o) => [o.stationID, o.isOut]));
    const rows = new Map<string, ComplexRow & { affected: boolean[] }>();

    stationData.features.forEach((feature) => {
      const { complex_id, station_id, stop_name, daytime_routes, ada } = feature.properties;
      let row = rows.get(complex_id);
      if (!row) {
        const complex = complexInfo.get(complex_id);
        row = {
          key: complex_id,
          name: complex?.properties.stop_name ?? stop_name,
          routes: new Set(),
          feature,
          coords: (complex?.geometry.coordinates ?? feature.geometry.coordinates) as LngLat,
          isAccessible: false,
          status: "ok",
          affected: [],
        };
        rows.set(complex_id, row);
      }
      daytime_routes.split(" ").filter(Boolean).forEach((r) => row.routes.add(r));
      row.isAccessible ||= ada !== "0";
      if (outages.has(station_id)) row.affected.push(outages.get(station_id));
    });

    return Array.from(rows.values()).map(({ affected, ...row }) => ({
      ...row,
      status: (affected.length === 0 ? "ok" : affected.every(Boolean) ? "out" : "partial") as ComplexStatus,
    }));
  }, [stationData, stationOutages]);

  const outageRows = useMemo(
    () =>
      complexes
        .filter((c) => c.status !== "ok")
        .sort(
          (a, b) => Number(b.status === "out") - Number(a.status === "out") || a.name.localeCompare(b.name),
        ),
    [complexes],
  );

  const select = (feature: MtaStationFeature, walkingToleranceMiles?: number | null) => {
    setQuery("");
    inputRef.current?.blur();
    onSelectStation(feature, walkingToleranceMiles);
  };

  const isSearching = query.trim().length > 0;
  const isScrollable = snap !== SNAP_PEEK;
  // The sheet is always full height and slides down to each snap point, so the part below the
  // screen edge is (1 - snap) of the viewport. Pad by that plus 32px so the last row can always
  // scroll clear of the edge, with visible empty space to show it's the end.
  const hiddenDvh = typeof snap === "number" ? (1 - snap) * 100 : 0;
  const endPadding = {
    paddingBottom: `calc(${hiddenDvh.toFixed(1)}dvh + 32px + env(safe-area-inset-bottom))`,
  };

  return (
    <Drawer
      open={open}
      modal={false}
      dismissible={false}
      shouldScaleBackground={false}
      snapPoints={[SNAP_PEEK, SNAP_HALF, SNAP_FULL]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <DrawerPortal>
        <DrawerPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-[998] mx-auto flex h-dvh max-w-lg flex-col rounded-t-sheet bg-background shadow-[0_-1px_0_oklch(0_0_0/0.04),0_-8px_24px_oklch(0_0_0/0.12)] outline-none"
        >
          <div className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-foreground/20" aria-hidden="true" />

          {page ? (
            <SubPage label="Station details" onBack={onBack} scrollable={isScrollable} endPadding={endPadding}>
              <AdoptedNode node={page} />
            </SubPage>
          ) : isLegendOpen ? (
            <SubPage label="Legend" onBack={closeLegend} scrollable={isScrollable} endPadding={endPadding}>
              <LegendPage
                numOutElevators={numOutElevators}
                totalElevators={totalElevators}
                lastUpdated={lastUpdated}
              />
            </SubPage>
          ) : (
            <Command shouldFilter={false} className="group min-h-0 flex-1 rounded-none bg-transparent">
              <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
                <DrawerTitle className="text-title">Stations</DrawerTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("-mr-2 size-11 shrink-0 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground", BUTTON_PRESS)}
                  aria-label="Legend and about"
                  onClick={openLegend}
                >
                  <Info className="size-5" />
                </Button>
              </header>

              <div className="px-4 pb-3">
                <div className="flex h-11 items-center gap-2 rounded-xl bg-foreground/[0.06] px-4 focus-within:ring-2 focus-within:ring-foreground/10">
                  <Search className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
                  <CommandPrimitive.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={setQuery}
                    onFocus={() => setSnap(SNAP_FULL)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setQuery("");
                        inputRef.current?.blur();
                        setSnap(SNAP_PEEK);
                      }
                    }}
                    placeholder="Search stations or lines"
                    aria-label="Search stations or lines"
                    // 16px keeps iOS Safari from zooming on focus
                    className="h-full w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        inputRef.current?.focus();
                      }}
                      className={cn("-mr-3 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground", BUTTON_PRESS)}
                      aria-label="Clear search"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <CommandList
                className={cn(
                  "max-h-none flex-1 overscroll-contain",
                  isScrollable ? "overflow-y-auto" : "overflow-hidden",
                )}
                style={endPadding}
              >
                {isSearching ? (
                  results.length > 0 ? (
                    <CommandGroup className="p-0 px-4">
                      <div className="overflow-hidden rounded-xl border border-border [&>*+*]:border-t [&>*+*]:border-border">
                        {results.map((option) => (
                          <CommandItem
                            key={option.key}
                            value={option.key}
                            onSelect={() => select(option.feature)}
                            className={itemClass}
                          >
                            <StationLabel name={option.name} routes={option.routes} />
                            {!option.isAccessible && (
                              <span className="shrink-0 text-footnote text-muted-foreground">Not accessible</span>
                            )}
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>
                  ) : (
                    <p className="px-8 py-10 text-center text-body text-muted-foreground">
                      No stations match “{query}”. Try a street name or a line, like “L”.
                    </p>
                  )
                ) : (
                  <>
                    <section className="pt-3">
                      <div className="flex items-center justify-between px-8 pb-2">
                        <h3 className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                          {nearby.isUsingPin && <LocationPin size="12px" />}
                          {nearby.isUsingPin ? "Near the map pin" : "Nearby accessible stations"}
                        </h3>
                      </div>
                      <div
                        role="radiogroup"
                        aria-label="Walking distance"
                        className="-mt-1.5 flex gap-2 overflow-x-auto px-4 pb-3 pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        {WALKING_RADII.map(({ label, value }) => {
                          const active =
                            value === null ? nearby.radius === null : nearby.radius !== null && Math.abs(value - nearby.radius) < 0.001;
                          return (
                            <button
                              key={label}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => nearby.setRadius(value)}
                              className={cn(
                                // 32px pill, 44px tap area: the ::before extends the hit box without changing the look
                                "relative h-8 shrink-0 rounded-full border px-3 text-footnote font-semibold tabular-nums transition-colors duration-150 before:absolute before:inset-x-0 before:-inset-y-1.5",
                                active
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border text-foreground hover:bg-foreground/[0.04] active:bg-foreground/[0.08]",
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      {!nearby.hasLocation ? (
                        <p className="px-8 pb-1 text-subhead text-pretty text-muted-foreground">
                          Tap the location button on the map to see accessible stations near you.
                        </p>
                      ) : nearby.stations.length === 0 ? (
                        <p className="px-8 pb-1 text-subhead text-pretty text-muted-foreground">
                          {nearby.radius === null
                            ? "No accessible stations found."
                            : `No accessible stations within ${formatWalkingDistance(nearby.radius)}. Try a longer distance.`}
                        </p>
                      ) : (
                        <CommandGroup className="p-0 px-4">
                          <div className="overflow-hidden rounded-xl border border-border [&>*+*]:border-t [&>*+*]:border-border">
                            {nearby.stations.map((station) => (
                              <CommandItem
                                key={station.complexId}
                                value={`nearby-${station.complexId}`}
                                onSelect={() => select(station.feature, nearby.radius)}
                                className={cn(itemClass, "items-start")}
                              >
                                <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                                  <span className="max-w-full truncate text-headline font-semibold">{station.name}</span>
                                  <LineBullets routes={station.routes} size="sm" />
                                  {station.maintenanceLabel && <MaintenanceBadge when={station.maintenanceLabel} />}
                                  {station.adaNotes && (
                                    <span className="flex items-start gap-1 text-caption text-muted-foreground">
                                      <span className="mt-px shrink-0" aria-hidden="true">
                                        <AccessibleIconWhite size={11} fill="currentColor" />
                                      </span>
                                      {station.adaNotes}
                                    </span>
                                  )}
                                </span>
                                <span className="flex shrink-0 flex-col items-end gap-1.5">
                                  <StatusChip
                                    status={station.status}
                                    label={station.status === "partial" && station.outCount > 0 ? `${station.outCount} out` : undefined}
                                  />
                                  {nearby.showDistances && (
                                    <span className="pr-1 text-footnote tabular-nums text-muted-foreground">
                                      {formatWalkingDistance(station.walkingMiles)}
                                      {station.walkMinutes !== null && ` · ${station.walkMinutes} min`}
                                    </span>
                                  )}
                                </span>
                              </CommandItem>
                            ))}
                          </div>
                        </CommandGroup>
                      )}
                    </section>

                    {isLoaded && outageRows.length === 0 ? (
                      <Group>
                        <div className="flex items-center gap-3 px-4 py-4">
                          <StatusIcon glyph="check" className="size-5 text-status-ok" />
                          <p className="text-body">Every station has its elevators running.</p>
                        </div>
                      </Group>
                    ) : (
                      <CommandGroup className="p-0">
                        <Group title={isLoaded ? `Stations with outages · ${outageRows.length}` : "Stations with outages"}>
                          {outageRows.map((row) => (
                            <CommandItem
                              key={row.key}
                              value={`outage-${row.key}`}
                              onSelect={() => select(row.feature)}
                              className={itemClass}
                            >
                              <StationLabel name={row.name} routes={Array.from(row.routes)} />
                              <StatusChip status={row.status} />
                            </CommandItem>
                          ))}
                        </Group>
                      </CommandGroup>
                    )}

                    <Group title="Get in touch">
                      {COMMUNITY_LINKS.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                          rel="noreferrer"
                          className={cn("flex min-h-12 items-center justify-between px-4 py-3 text-body", ROW_PRESS)}
                        >
                          {link.label}
                          <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                        </a>
                      ))}
                    </Group>
                  </>
                )}
              </CommandList>
            </Command>
          )}
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
};

export default HomeSheet;
