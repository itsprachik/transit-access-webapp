import React, { useMemo, useRef, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Command as CommandPrimitive } from "cmdk";
import { matchSorter } from "match-sorter";
import { Info, Search, X, ChevronRight } from "lucide-react";
import { Drawer, DrawerPortal, DrawerTitle } from "@/components/ui/drawer";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { LineBullets } from "@/components/LineBullets/LineBullets";
import { StatusIcon } from "@/components/StatusIcon/StatusIcon";
import { getComplexesDataset } from "@/lib/dataStore";
import { MtaStationData, MtaStationFeature } from "@/utils/types";
import { AlertData } from "@/types/alerts";
import { cn } from "@/lib/utils";

const SNAP_PEEK = "168px";
const SNAP_HALF = 0.55;
const SNAP_FULL = 0.94;
const MAX_RESULTS = 40;

type StationOutage = { stationID: string; isOut: boolean };

interface HomeSheetProps {
  open: boolean;
  numOutElevators: number;
  totalElevators: number;
  lastUpdated: Date | null;
  stationData: MtaStationData | null;
  stationOutages: StationOutage[] | null;
  systemAlerts: AlertData[];
  onSelectStation: (feature: MtaStationFeature) => void;
  onOpenLegend: () => void;
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
      <span className="max-w-full truncate text-headline">{name}</span>
      <LineBullets routes={routes} size="sm" />
    </span>
  );
}

// Severity → status palette, so a good-news banner doesn't look like a warning
const ALERT_TONES = {
  success: { glyph: "check", surface: "bg-status-ok-muted", icon: "text-status-ok" },
  info: { glyph: "info", surface: "bg-card", icon: "text-muted-foreground" },
  warning: { glyph: "alert", surface: "bg-status-partial-muted", icon: "text-status-partial" },
  error: { glyph: "alert", surface: "bg-status-out-muted", icon: "text-status-out" },
} as const;

function AlertBanner({ alert }: { alert: AlertData }) {
  const tone = ALERT_TONES[alert.severity] ?? ALERT_TONES.warning;
  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-xl px-4 py-3", tone.surface)}>
      <StatusIcon glyph={tone.glyph} className={cn("mt-0.5 size-[18px]", tone.icon)} />
      <p className="text-subhead text-pretty">{alert.text}</p>
    </div>
  );
}

function StatusChip({ isOut }: { isOut: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-caption font-semibold",
        isOut
          ? "bg-status-out-muted text-status-out-foreground"
          : "bg-status-partial-muted text-status-partial-foreground",
      )}
    >
      <StatusIcon glyph="alert" className={isOut ? "text-status-out" : "text-status-partial"} />
      {isOut ? "All out" : "Some out"}
    </span>
  );
}

// Inset grouped list, the iOS Settings pattern: white card on the grey sheet
function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-6">
      {title && (
        <h3 className="px-4 pb-2 text-footnote font-semibold text-muted-foreground">{title}</h3>
      )}
      <div className="overflow-hidden rounded-xl bg-card [&>*+*]:border-t [&>*+*]:border-border">
        {children}
      </div>
    </section>
  );
}

// Highlight only while the sheet has focus, so touch users don't see a phantom selection
const itemClass =
  "group/row flex min-h-14 cursor-pointer items-center gap-3 rounded-none px-4 py-3 text-body data-[selected=true]:bg-transparent active:!bg-accent group-focus-within:data-[selected=true]:bg-accent";

const HomeSheet: React.FC<HomeSheetProps> = ({
  open,
  numOutElevators,
  totalElevators,
  lastUpdated,
  stationData,
  stationOutages,
  systemAlerts,
  onSelectStation,
  onOpenLegend,
}) => {
  const [snap, setSnap] = useState<number | string | null>(SNAP_PEEK);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoaded = lastUpdated !== null;
  const numWorking = totalElevators - numOutElevators;
  const updatedAt = lastUpdated?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

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

  // One row per complex: a street elevator outage marks every station in the complex
  const outageRows = useMemo(() => {
    if (!stationOutages || !stationData) return [];
    const complexNames = new Map(
      getComplexesDataset().features.map((f) => [f.properties.complex_id, f.properties.stop_name]),
    );
    const byComplex = new Map<
      string,
      { key: string; name: string; routes: Set<string>; isOut: boolean; feature: MtaStationFeature }
    >();

    stationOutages.forEach(({ stationID, isOut }) => {
      const feature = stationData.features.find((f) => f.properties.station_id === stationID);
      if (!feature) return;
      const complexId = feature.properties.complex_id;
      const routes = feature.properties.daytime_routes.split(" ").filter(Boolean);
      const row = byComplex.get(complexId);
      if (row) {
        routes.forEach((r) => row.routes.add(r));
        row.isOut = row.isOut && isOut;
      } else {
        byComplex.set(complexId, {
          key: complexId,
          name: complexNames.get(complexId) ?? feature.properties.stop_name,
          routes: new Set(routes),
          isOut,
          feature,
        });
      }
    });

    return Array.from(byComplex.values()).sort(
      (a, b) => Number(b.isOut) - Number(a.isOut) || a.name.localeCompare(b.name),
    );
  }, [stationOutages, stationData]);

  const select = (feature: MtaStationFeature) => {
    setQuery("");
    inputRef.current?.blur();
    setSnap(SNAP_PEEK);
    onSelectStation(feature);
  };

  const isSearching = query.trim().length > 0;
  const isExpanded = snap === SNAP_FULL;

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
          className="fixed inset-x-0 bottom-0 z-[900] mx-auto flex h-dvh max-w-lg flex-col rounded-t-sheet bg-secondary shadow-[0_-1px_0_oklch(0_0_0/0.04),0_-8px_24px_oklch(0_0_0/0.12)] outline-none"
        >
          <div className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-foreground/20" aria-hidden="true" />

          <Command shouldFilter={false} className="group min-h-0 flex-1 rounded-none bg-transparent">
            <header className="flex items-start justify-between gap-3 px-4 pb-4 pt-2">
              <div className="min-w-0">
                <DrawerTitle className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-display tabular-nums",
                      isLoaded && numOutElevators > 0 && "text-status-out-foreground",
                    )}
                  >
                    {isLoaded ? numOutElevators : "–"}
                  </span>
                  <span className="text-headline">
                    {numOutElevators === 1 ? "elevator out" : "elevators out"}
                  </span>
                </DrawerTitle>
                <p className="mt-1 text-footnote tabular-nums text-muted-foreground">
                  {isLoaded
                    ? `${numWorking} of ${totalElevators} working · Updated ${updatedAt}`
                    : "Loading live elevator status…"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 size-11 shrink-0 rounded-full text-muted-foreground"
                aria-label="About and map legend"
                onClick={onOpenLegend}
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
                    className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <CommandList
              className={cn(
                // At the top snap the sheet sits 6% down, so pad its offscreen bottom
                "max-h-none flex-1 overscroll-contain pb-[calc(6dvh+max(1.5rem,env(safe-area-inset-bottom)))]",
                isExpanded ? "overflow-y-auto" : "overflow-hidden",
              )}
            >
              {isSearching ? (
                results.length > 0 ? (
                  <CommandGroup className="p-0 px-4">
                    <div className="overflow-hidden rounded-xl bg-card [&>*+*]:border-t [&>*+*]:border-border">
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
                  {systemAlerts.length > 0 && (
                    <section className="flex flex-col gap-2 px-4 pt-3">
                      {systemAlerts.map((alert, i) => (
                        <AlertBanner key={i} alert={alert} />
                      ))}
                    </section>
                  )}

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
                            <StatusChip isOut={row.isOut} />
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
                        className="flex min-h-12 items-center justify-between px-4 py-3 text-body active:bg-accent"
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
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
};

export default HomeSheet;
