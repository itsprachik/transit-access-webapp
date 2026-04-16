/**
 * One-time seed script — populates Supabase tables from local JSON files.
 * Run after executing migration.sql in the Supabase SQL editor.
 *
 * Usage: npx ts-node --skip-project src/db/seed.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set in .env
 */

import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import complexesJson from "../resources/mta_subway_complexes.json";
import stationsJson from "../resources/mta_subway_stations_all.json";
import elevatorsJson from "../resources/custom_elevator_dataset.json";
import alertsJson from "../resources/ta_alerts.json";
import stationAlertsJson from "../resources/station_alerts.json";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function seedComplexes() {
  const rows = complexesJson.features.map((f: any) => ({
    complex_id: f.properties.complex_id,
    station_ids: f.properties.station_ids,
    gtfs_stop_ids: f.properties.gtfs_stop_ids,
    stop_name: f.properties.stop_name,
    ada: f.properties.ada,
    borough: f.properties.borough,
    num_stations: parseInt(f.properties.num_stations_in_complex) || null,
    geometry: f.geometry,
  }));

  const { error } = await supabase.from("complexes").upsert(rows, { onConflict: "complex_id" });
  if (error) throw new Error(`complexes seed failed: ${error.message}`);
  console.log(`✓ complexes: ${rows.length} rows`);
}

async function seedStationDetails() {
  const rowMap = new Map<string, any>();
  for (const f of stationsJson.features as any[]) {
    rowMap.set(f.properties.station_id, {
      station_id: f.properties.station_id,
      complex_id: f.properties.complex_id,
      stop_name: f.properties.stop_name,
      line: f.properties.line,
      daytime_routes: f.properties.daytime_routes,
      division: f.properties.division,
      structure: f.properties.structure,
      ada: f.properties.ada,
      ada_northbound: f.properties.ada_northbound,
      ada_southbound: f.properties.ada_southbound,
      ada_notes: f.properties.ada_notes,
      north_direction_label: f.properties.north_direction_label,
      south_direction_label: f.properties.south_direction_label,
      gtfs_stop_id: f.properties.gtfs_stop_id,
      borough: f.properties.borough,
      geometry: f.geometry,
    });
  }
  const rows = Array.from(rowMap.values());

  const { error } = await supabase.from("station_details").upsert(rows, { onConflict: "station_id" });
  if (error) throw new Error(`station_details seed failed: ${error.message}`);
  console.log(`✓ station_details: ${rows.length} rows`);
}

async function seedElevators() {
  const rows = elevatorsJson.features.map((f: any) => ({
    elevator_id: f.properties.elevatorno,
    complex_id: f.properties.complexID,
    station_id: f.properties.stationID,
    route: f.properties.route,
    lines_served: f.properties.linesServed,
    gtfs_stop_id: f.properties.elevatorgtfsstopid,
    title: f.properties.title,
    direction_label: f.properties.directionLabel,
    short_description: f.properties.shortdescription,
    description_custom: f.properties.description_custom,
    alternative_route: f.properties.alternativeRoute,
    ada: f.properties.ada,
    is_street: f.properties.isStreet,
    is_redundant: f.properties.isRedundant,
    redundant_index: f.properties.redundantIndex ?? null,
    image: f.properties.image,
    access_note: f.properties.access_note ?? null,
    geometry: f.geometry,
  }));

  const { error } = await supabase.from("elevators").upsert(rows, { onConflict: "elevator_id" });
  if (error) throw new Error(`elevators seed failed: ${error.message}`);
  console.log(`✓ elevators: ${rows.length} rows`);
}

async function seedAlerts() {
  await supabase.from("alerts").delete().neq("id", 0);

  const rows = (alertsJson as any[])
    .filter((a) => a.text)
    .map((a) => ({
      severity: a.severity,
      text: a.text,
      color: a.color,
      type: a.type,
      active: true,
    }));

  const { error } = await supabase.from("alerts").insert(rows);
  if (error) throw new Error(`alerts seed failed: ${error.message}`);
  console.log(`✓ alerts: ${rows.length} rows`);
}

async function seedStationAlerts() {
  await supabase.from("station_alerts").delete().neq("id", 0);

  const rows = (stationAlertsJson as any).features.map((f: any) => ({
    complex_ids: f.properties.complex_id,
    stop_names: f.properties.stop_name,
    alert: f.properties.alert,
    active: true,
  }));

  const { error } = await supabase.from("station_alerts").insert(rows);
  if (error) throw new Error(`station_alerts seed failed: ${error.message}`);
  console.log(`✓ station_alerts: ${rows.length} rows`);
}

async function main() {
  console.log("Seeding database...");
  await seedComplexes();
  await seedStationDetails();
  await seedElevators();
  await seedAlerts();
  await seedStationAlerts();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
