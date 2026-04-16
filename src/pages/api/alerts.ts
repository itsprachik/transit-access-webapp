import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const [systemAlerts, stationAlerts] = await Promise.all([
    supabase.from("alerts").select("*").eq("active", true),
    supabase.from("station_alerts").select("*").eq("active", true),
  ]);

  if (systemAlerts.error || stationAlerts.error) {
    console.error(systemAlerts.error ?? stationAlerts.error);
    return res.status(500).json({ error: "Failed to fetch alerts" });
  }

  // station_alerts returned as GeoJSON FeatureCollection to match station_alerts.json shape
  const stationAlertsGeoJSON = {
    type: "FeatureCollection",
    features: stationAlerts.data.map((row) => ({
      type: "Feature",
      properties: {
        complex_id: row.complex_ids,
        stop_name: row.stop_names,
        alert: row.alert,
      },
    })),
  };

  return res.status(200).json({
    system: systemAlerts.data,
    station: stationAlertsGeoJSON,
  });
}
