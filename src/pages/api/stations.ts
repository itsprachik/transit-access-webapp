import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

function toComplexFeature(row: any) {
  return {
    type: "Feature",
    properties: {
      complex_id: row.complex_id,
      station_ids: row.station_ids,
      gtfs_stop_ids: row.gtfs_stop_ids,
      stop_name: row.stop_name,
      ada: row.ada,
      borough: row.borough,
      num_stations_in_complex: String(row.num_stations ?? ""),
    },
    geometry: row.geometry,
  };
}

function toStationFeature(row: any) {
  return {
    type: "Feature",
    properties: {
      station_id: row.station_id,
      complex_id: row.complex_id,
      stop_name: row.stop_name,
      line: row.line,
      daytime_routes: row.daytime_routes,
      division: row.division,
      structure: row.structure,
      ada: row.ada,
      ada_northbound: row.ada_northbound,
      ada_southbound: row.ada_southbound,
      ada_notes: row.ada_notes,
      north_direction_label: row.north_direction_label,
      south_direction_label: row.south_direction_label,
      gtfs_stop_id: row.gtfs_stop_id,
      borough: row.borough,
    },
    geometry: row.geometry,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const [complexesResult, stationsResult] = await Promise.all([
    supabase.from("complexes").select("*"),
    supabase.from("station_details").select("*"),
  ]);

  if (complexesResult.error || stationsResult.error) {
    console.error(complexesResult.error ?? stationsResult.error);
    return res.status(500).json({ error: "Failed to fetch stations" });
  }

  return res.status(200).json({
    complexes: {
      type: "FeatureCollection",
      features: complexesResult.data.map(toComplexFeature),
    },
    stations: {
      type: "FeatureCollection",
      features: stationsResult.data.map(toStationFeature),
    },
  });
}
