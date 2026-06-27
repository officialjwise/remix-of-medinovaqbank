/**
 * ADMIN-TRAFFIC domain — self-contained API module.
 *
 * Wires the super-admin traffic analytics endpoints (all under /api/v1):
 *   GET /admin/traffic/overview    — totals + source/event-type breakdowns
 *   GET /admin/traffic/geography   — per-country roll-up (flags, lat/lng)
 *   GET /admin/traffic/points      — geo points for the cobe globe (lat/lng/volume)
 *   GET /admin/traffic/devices     — device / browser / OS splits
 *   GET /admin/traffic/timeline    — daily volume + peak-hour distribution
 *   GET /admin/traffic/heatmap     — dense 7×24 day-of-week × hour grid
 *   GET /admin/traffic/live        — active-now count + recent activity feed
 *
 * Backend wire types + boundary mappers live HERE (not in shared @/api/types
 * or @/api/mappers) to avoid cross-domain collisions, per project convention.
 *
 * Each endpoint takes an optional ISO date range ({ startDate, endDate }).
 * Mappers normalise the wire shapes into friendly view models the
 * admin.traffic screen consumes directly (globe markers, flag rows, heatmap
 * rows, donut data).
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Date-range query (mirrors TrafficQueryDto). ──
export interface TrafficRange {
  /** ISO-8601 start (inclusive). */
  startDate?: string;
  /** ISO-8601 end (inclusive). */
  endDate?: string;
}

function toRangeParams(r: TrafficRange = {}): Record<string, string | undefined> {
  return { startDate: r.startDate, endDate: r.endDate };
}

// ── Backend wire shapes (mirror traffic-response.dto.ts). ──
export interface BackendTrafficSource {
  source: string;
  count: number;
}
export interface BackendTrafficEventType {
  eventType: string;
  count: number;
}
export interface BackendTrafficOverview {
  totalEvents: number;
  uniqueUsers: number;
  activeNow: number;
  sources: BackendTrafficSource[];
  eventTypes: BackendTrafficEventType[];
}
export interface BackendTrafficGeography {
  country: string | null;
  countryCode: string | null;
  users: number;
  sessions: number;
  lat: number | null;
  lng: number | null;
  percentage: number;
}
export interface BackendTrafficPoint {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  lat: number;
  lng: number;
  volume: number;
}
export interface BackendTrafficSplit {
  name: string;
  count: number;
}
export interface BackendTrafficDevices {
  deviceType: BackendTrafficSplit[];
  browser: BackendTrafficSplit[];
  os: BackendTrafficSplit[];
}
export interface BackendTrafficDailyPoint {
  day: string;
  count: number;
}
export interface BackendTrafficHourlyPoint {
  hour: number;
  count: number;
}
export interface BackendTrafficTimeline {
  daily: BackendTrafficDailyPoint[];
  peakHours: BackendTrafficHourlyPoint[];
}
export interface BackendTrafficHeatmapCell {
  /** 0 = Sunday … 6 = Saturday. */
  dow: number;
  /** 0–23. */
  hour: number;
  count: number;
}
export interface BackendTrafficHeatmap {
  /** grid[dayOfWeek][hour] = event count. Always 7×24. */
  grid: number[][];
  raw: BackendTrafficHeatmapCell[];
}
export interface BackendTrafficLiveActivity {
  userId: string;
  name: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  countryCode: string | null;
  deviceType: string | null;
  currentAction: string;
  createdAt: string;
}
export interface BackendTrafficLive {
  activeNow: number;
  recent: BackendTrafficLiveActivity[];
}

// ── Frontend view models ──

/** A geo point for the cobe globe / flat map. */
export interface TrafficGeoPoint {
  lat: number;
  lng: number;
  label: string;
  /** ISO alpha-2 country code (drives the flag glyph). */
  code: string;
  city: string | null;
  /** Event volume at this point — sizes the marker / bubble. */
  value: number;
}

/** A per-country row for the "Top countries" table + flag list. */
export interface TrafficCountryRow {
  country: string;
  code: string;
  users: number;
  sessions: number;
  /** % of total traffic (0–100). */
  pct: number;
  lat: number | null;
  lng: number | null;
}

/** A name→count slice for the donut breakdowns. */
export interface TrafficSplitRow {
  name: string;
  count: number;
}

export interface TrafficDevices {
  deviceType: TrafficSplitRow[];
  browser: TrafficSplitRow[];
  os: TrafficSplitRow[];
}

/** One heatmap row: a day label + 24 hourly intensity values (0–100). */
export interface TrafficHeatmapRow {
  day: string;
  /** length 24, scaled 0–100 (relative to the busiest cell). */
  hours: number[];
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// ── Boundary mappers ──

export function mapGeographyToPoints(rows: BackendTrafficGeography[]): TrafficGeoPoint[] {
  return rows
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      lat: r.lat as number,
      lng: r.lng as number,
      label: r.country ?? "Unknown",
      code: r.countryCode ?? "",
      city: null,
      value: r.sessions,
    }));
}

export function mapPointsToGeoPoints(rows: BackendTrafficPoint[]): TrafficGeoPoint[] {
  return rows.map((r) => ({
    lat: r.lat,
    lng: r.lng,
    label: r.country ?? r.city ?? "Unknown",
    code: r.countryCode ?? "",
    city: r.city,
    value: r.volume,
  }));
}

export function mapCountryRows(rows: BackendTrafficGeography[]): TrafficCountryRow[] {
  return rows.map((r) => ({
    country: r.country ?? "Unknown",
    code: r.countryCode ?? "",
    users: r.users,
    sessions: r.sessions,
    pct: r.percentage,
    lat: r.lat,
    lng: r.lng,
  }));
}

export function mapDevices(d: BackendTrafficDevices): TrafficDevices {
  return {
    deviceType: d.deviceType.map((s) => ({ name: s.name, count: s.count })),
    browser: d.browser.map((s) => ({ name: s.name, count: s.count })),
    os: d.os.map((s) => ({ name: s.name, count: s.count })),
  };
}

/**
 * Convert the dense 7×24 count grid into 7 rows of 0–100 intensities (scaled
 * to the busiest cell), matching the UsageHeatmap component contract.
 */
export function mapHeatmapRows(h: BackendTrafficHeatmap): TrafficHeatmapRow[] {
  const max = Math.max(1, ...h.grid.flat());
  return h.grid.map((hours, dow) => ({
    day: DOW_LABELS[dow] ?? String(dow),
    hours: hours.map((c) => Math.round((c / max) * 100)),
  }));
}

// ── API surface ──
export const adminTrafficApi = {
  overview(range?: TrafficRange): Promise<BackendTrafficOverview> {
    return apiClient.get<BackendTrafficOverview>("/admin/traffic/overview", {
      params: toRangeParams(range),
    });
  },
  geography(range?: TrafficRange): Promise<BackendTrafficGeography[]> {
    return apiClient.get<BackendTrafficGeography[]>("/admin/traffic/geography", {
      params: toRangeParams(range),
    });
  },
  points(range?: TrafficRange): Promise<BackendTrafficPoint[]> {
    return apiClient.get<BackendTrafficPoint[]>("/admin/traffic/points", {
      params: toRangeParams(range),
    });
  },
  devices(range?: TrafficRange): Promise<BackendTrafficDevices> {
    return apiClient.get<BackendTrafficDevices>("/admin/traffic/devices", {
      params: toRangeParams(range),
    });
  },
  timeline(range?: TrafficRange): Promise<BackendTrafficTimeline> {
    return apiClient.get<BackendTrafficTimeline>("/admin/traffic/timeline", {
      params: toRangeParams(range),
    });
  },
  heatmap(range?: TrafficRange): Promise<BackendTrafficHeatmap> {
    return apiClient.get<BackendTrafficHeatmap>("/admin/traffic/heatmap", {
      params: toRangeParams(range),
    });
  },
  live(): Promise<BackendTrafficLive> {
    return apiClient.get<BackendTrafficLive>("/admin/traffic/live");
  },
};

// ── Query keys ──
export const trafficKeys = {
  all: ["admin-traffic"] as const,
  overview: (range?: TrafficRange) => [...trafficKeys.all, "overview", range ?? {}] as const,
  geography: (range?: TrafficRange) => [...trafficKeys.all, "geography", range ?? {}] as const,
  points: (range?: TrafficRange) => [...trafficKeys.all, "points", range ?? {}] as const,
  devices: (range?: TrafficRange) => [...trafficKeys.all, "devices", range ?? {}] as const,
  timeline: (range?: TrafficRange) => [...trafficKeys.all, "timeline", range ?? {}] as const,
  heatmap: (range?: TrafficRange) => [...trafficKeys.all, "heatmap", range ?? {}] as const,
  live: () => [...trafficKeys.all, "live"] as const,
};

// ── Hooks ──

export function useTrafficOverview(range?: TrafficRange) {
  return useQuery({
    queryKey: trafficKeys.overview(range),
    queryFn: () => adminTrafficApi.overview(range),
    staleTime: 30_000,
  });
}

export function useTrafficGeography(range?: TrafficRange) {
  return useQuery({
    queryKey: trafficKeys.geography(range),
    queryFn: () => adminTrafficApi.geography(range),
    select: (rows) => ({
      raw: rows,
      countries: mapCountryRows(rows),
      points: mapGeographyToPoints(rows),
    }),
    staleTime: 60_000,
  });
}

export function useTrafficPoints(range?: TrafficRange) {
  return useQuery({
    queryKey: trafficKeys.points(range),
    queryFn: () => adminTrafficApi.points(range),
    select: mapPointsToGeoPoints,
    staleTime: 60_000,
  });
}

export function useTrafficDevices(range?: TrafficRange) {
  return useQuery({
    queryKey: trafficKeys.devices(range),
    queryFn: () => adminTrafficApi.devices(range),
    select: mapDevices,
    staleTime: 60_000,
  });
}

export function useTrafficTimeline(range?: TrafficRange) {
  return useQuery({
    queryKey: trafficKeys.timeline(range),
    queryFn: () => adminTrafficApi.timeline(range),
    staleTime: 60_000,
  });
}

export function useTrafficHeatmap(range?: TrafficRange) {
  return useQuery({
    queryKey: trafficKeys.heatmap(range),
    queryFn: () => adminTrafficApi.heatmap(range),
    select: mapHeatmapRows,
    staleTime: 60_000,
  });
}

/** Live panel — polls every 15s for a near-real-time count + feed. */
export function useTrafficLive() {
  return useQuery({
    queryKey: trafficKeys.live(),
    queryFn: () => adminTrafficApi.live(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
