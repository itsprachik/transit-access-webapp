-- Run this in the Supabase SQL editor before seeding

CREATE TABLE complexes (
  complex_id    TEXT PRIMARY KEY,
  station_ids   TEXT,
  gtfs_stop_ids TEXT,
  stop_name     TEXT NOT NULL,
  ada           TEXT,
  borough       TEXT,
  num_stations  INTEGER,
  geometry      JSONB
);

-- gtfs_stop_id (not station_id) is the true unique key: some stations, e.g.
-- Queensboro Plaza, 145 St, and W 4 St-Wash Sq, have two physical stops that
-- share a station_id/complex_id but have distinct gtfs_stop_id values.
CREATE TABLE station_details (
  gtfs_stop_id          TEXT PRIMARY KEY,
  station_id            TEXT NOT NULL,
  complex_id            TEXT REFERENCES complexes(complex_id),
  stop_name             TEXT,
  line                  TEXT,
  daytime_routes        TEXT,
  division              TEXT,
  structure             TEXT,
  ada                   TEXT,
  ada_northbound        TEXT,
  ada_southbound        TEXT,
  ada_notes             TEXT,
  north_direction_label TEXT,
  south_direction_label TEXT,
  borough               TEXT,
  geometry              JSONB
);

CREATE TABLE elevators (
  elevator_id        TEXT PRIMARY KEY,
  complex_id         TEXT REFERENCES complexes(complex_id),
  station_id         TEXT,
  route              TEXT,
  lines_served       TEXT,
  gtfs_stop_id       TEXT,
  title              TEXT,
  direction_label    TEXT,
  short_description  TEXT,
  description_custom TEXT,
  alternative_route  TEXT,
  ada                TEXT,
  is_street          TEXT,
  is_redundant       TEXT,
  redundant_index    TEXT,
  image              TEXT,
  access_note        TEXT,
  geometry           JSONB
);

CREATE TABLE alerts (
  id       SERIAL PRIMARY KEY,
  severity TEXT,
  text     TEXT NOT NULL,
  color    TEXT,
  type     TEXT,
  active   BOOLEAN DEFAULT true
);

-- complex_id is comma-separated (one alert can span multiple complexes)
CREATE TABLE station_alerts (
  id          SERIAL PRIMARY KEY,
  complex_ids TEXT,
  stop_names  TEXT,
  alert       TEXT NOT NULL,
  active      BOOLEAN DEFAULT true
);
