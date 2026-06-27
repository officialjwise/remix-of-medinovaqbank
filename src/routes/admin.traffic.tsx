import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Globe2, Map as MapIcon, MapPin, Users } from "lucide-react";
import { GeoBubbleMap } from "@/components/admin/GeoBubbleMap";
import { UsageHeatmap } from "@/components/admin/UsageHeatmap";
import { countryFlag } from "@/lib/flags";
import type { GlobeMarker } from "@/components/admin/TrafficGlobe";
import {
  useTrafficDevices,
  useTrafficGeography,
  useTrafficLive,
  useTrafficOverview,
  useTrafficPoints,
  useTrafficTimeline,
  useTrafficHeatmap,
  type TrafficRange,
  trafficKeys,
  type TrafficGeoPoint,
  type TrafficSplitRow,
} from "@/api/admin-traffic.api";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeStream } from "@/lib/realtime";

// Lazy-load the WebGL globe so cobe never blocks initial paint (client-only).
const TrafficGlobe = lazy(() =>
  import("@/components/admin/TrafficGlobe").then((m) => ({
    default: m.TrafficGlobe,
  })),
);

export const Route = createFileRoute("/admin/traffic")({
  head: () => ({
    meta: [{ title: "Admin · Traffic — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: TrafficPage,
});

/* ------------------------------------------------------------------ */
/* Shared styling                                                      */
/* ------------------------------------------------------------------ */

const axisStroke = "var(--color-muted-foreground)";
const gridStroke = "var(--color-border)";
const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-foreground)",
  boxShadow: "var(--shadow-card-hover)",
};

const palette = {
  teal: "#0E7C7B",
  emerald: "#2BC97F",
  blue: "#3B82F6",
  amber: "#E89A1A",
  violet: "#7C3AED",
  rose: "#E11D48",
  success: "#1FA968",
  slate: "#94A3B8",
} as const;

// Stable colour ramp for donut/source slices.
const SLICE_COLORS = [
  palette.teal,
  palette.blue,
  palette.amber,
  palette.violet,
  palette.emerald,
  palette.rose,
  palette.slate,
] as const;

const cardClass = "rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]";

const gradients: Record<string, string> = {
  teal: "from-[#0E7C7B] to-[#15A89C]",
  emerald: "from-[#2BC97F] to-[#1FA968]",
  blue: "from-[#3B82F6] to-[#2563EB]",
  amber: "from-[#E89A1A] to-[#D97706]",
  violet: "from-[#7C3AED] to-[#8B5CF6]",
  rose: "from-[#E11D48] to-[#DB2777]",
};

/* ------------------------------------------------------------------ */
/* Range → ISO date window                                            */
/* ------------------------------------------------------------------ */

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

function rangeToWindow(range: Range): TrafficRange {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function timeAgo(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${cardClass} ${className ?? ""}`}>
      <div>
        <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  live,
}: {
  label: string;
  value: string;
  hint?: { text: string };
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof gradients;
  live?: boolean;
}) {
  return (
    <div className={`${cardClass} relative overflow-hidden`}>
      <div
        className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${gradients[tone]} opacity-15 blur-xl`}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradients[tone]} text-white`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {live && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1FA968] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1FA968]" />
          </span>
        )}
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      </div>
      {hint && <p className="mt-1 text-xs font-medium text-muted-foreground">{hint.text}</p>}
    </div>
  );
}

/** Donut from a name→count split. */
function Donut({ title, data }: { title: string; data: TrafficSplitRow[] }) {
  const total = useMemo(() => data.reduce((acc, d) => acc + d.count, 0), [data]);
  const sliced = useMemo(
    () => data.map((d, i) => ({ ...d, fill: SLICE_COLORS[i % SLICE_COLORS.length] })),
    [data],
  );
  return (
    <div className={cardClass}>
      <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
      {data.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">No data yet</p>
      ) : (
        <>
          <div className="mt-3 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sliced}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={3}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                >
                  {sliced.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => v.toLocaleString()}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {sliced.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: d.fill }}
                />
                {d.name}
                <span className="ml-auto font-semibold tabular-nums text-foreground">
                  {total ? Math.round((d.count / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function TrafficPage() {
  const [range, setRange] = useState<Range>("30d");
  const [mapMode, setMapMode] = useState<"flat" | "globe">("flat");
  const [dark, setDark] = useState(false);

  const window = useMemo(() => rangeToWindow(range), [range]);

  const overviewQ = useTrafficOverview(window);
  const geographyQ = useTrafficGeography(window);
  const pointsQ = useTrafficPoints(window);
  const devicesQ = useTrafficDevices(window);
  const timelineQ = useTrafficTimeline(window);
  const heatmapQ = useTrafficHeatmap(window);
  const liveQ = useTrafficLive();

  // Live updates: the backend pushes on the admin:traffic channel the instant a
  // user comes online, so the active-now count + feed refresh immediately.
  const qc = useQueryClient();
  useRealtimeStream("admin/traffic", {
    update: () => void qc.invalidateQueries({ queryKey: trafficKeys.all }),
  });

  // Track dark mode so the globe's palette matches the theme.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const overview = overviewQ.data;
  const countries = geographyQ.data?.countries ?? [];
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => b.users - a.users),
    [countries],
  );
  const countryPctMax = useMemo(() => Math.max(1, ...countries.map((c) => c.pct)), [countries]);

  // Globe points (lat/lng + volume) from /points; fall back to geography points.
  const geoPoints: TrafficGeoPoint[] = pointsQ.data?.length
    ? pointsQ.data
    : (geographyQ.data?.points ?? []);
  const geoMax = useMemo(() => Math.max(1, ...geoPoints.map((p) => p.value)), [geoPoints]);

  const flatPoints = useMemo(
    () =>
      geoPoints.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        label: p.label,
        value: p.value,
        code: p.code,
      })),
    [geoPoints],
  );

  // Globe markers sized by volume.
  const markers: GlobeMarker[] = useMemo(
    () =>
      geoPoints.map((p) => ({
        location: [p.lat, p.lng] as [number, number],
        size: 0.04 + (p.value / geoMax) * 0.12,
      })),
    [geoPoints, geoMax],
  );

  // Daily timeline → area-chart points.
  const trafficOverTime = useMemo(
    () =>
      (timelineQ.data?.daily ?? []).map((d) => ({
        label: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        visits: d.count,
      })),
    [timelineQ.data],
  );

  // Peak hours → bar-ish list.
  const peakHours = timelineQ.data?.peakHours ?? [];
  const peakHoursMax = useMemo(() => Math.max(1, ...peakHours.map((h) => h.count)), [peakHours]);

  // Traffic sources (referrers) from overview, coloured.
  const sources = useMemo(
    () =>
      (overview?.sources ?? []).map((s, i) => ({
        name: s.source,
        value: s.count,
        fill: SLICE_COLORS[i % SLICE_COLORS.length],
      })),
    [overview],
  );
  const trafficTotal = useMemo(() => sources.reduce((a, s) => a + s.value, 0), [sources]);

  const liveCount = liveQ.data?.activeNow ?? 0;
  const recent = liveQ.data?.recent ?? [];

  const totalVisitors = overview?.uniqueUsers ?? 0;
  const topCountry = sortedCountries[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Traffic &amp; Geography
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Where your learners come from, what they use, and when they study.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 self-start rounded-xl border border-border bg-surface-alt p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-surface text-foreground shadow-[var(--shadow-card)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {overviewQ.isError && (
        <div className="rounded-xl border border-error/20 bg-error/[0.06] px-4 py-3 text-sm text-error">
          Failed to load traffic analytics. {(overviewQ.error as Error)?.message}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Unique Visitors"
          value={totalVisitors.toLocaleString()}
          hint={{ text: `over ${range}` }}
          icon={Users}
          tone="teal"
        />
        <KpiCard
          label="Total Events"
          value={(overview?.totalEvents ?? 0).toLocaleString()}
          hint={{ text: "page + action events" }}
          icon={Activity}
          tone="blue"
        />
        <KpiCard
          label="Live Users Now"
          value={liveCount.toLocaleString()}
          hint={{ text: "active this minute" }}
          icon={Activity}
          tone="emerald"
          live
        />
        <KpiCard
          label="Top Country"
          value={topCountry ? `${topCountry.country} ${topCountry.pct}%` : "—"}
          hint={{ text: topCountry ? `${topCountry.users.toLocaleString()} users` : "no data" }}
          icon={Globe2}
          tone="violet"
        />
      </div>

      {/* Geographic distribution + Live now */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={`${cardClass} lg:col-span-2`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Where your users are
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Geographic distribution — marker size = volume
              </p>
            </div>
            {/* Flat map | 3D globe toggle */}
            <div className="inline-flex shrink-0 items-center gap-1 self-start rounded-xl border border-border bg-surface-alt p-1">
              <button
                type="button"
                onClick={() => setMapMode("flat")}
                aria-pressed={mapMode === "flat"}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mapMode === "flat"
                    ? "bg-surface text-foreground shadow-[var(--shadow-card)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Flat map
              </button>
              <button
                type="button"
                onClick={() => setMapMode("globe")}
                aria-pressed={mapMode === "globe"}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mapMode === "globe"
                    ? "bg-surface text-foreground shadow-[var(--shadow-card)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" />
                3D globe
              </button>
            </div>
          </div>

          {geoPoints.length === 0 ? (
            <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
              {geographyQ.isLoading || pointsQ.isLoading
                ? "Loading map…"
                : "No geo-located traffic in this range."}
            </div>
          ) : mapMode === "flat" ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <GeoBubbleMap points={flatPoints} max={geoMax} />
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center">
              <Suspense
                fallback={
                  <div className="aspect-square w-full max-w-[420px] animate-pulse rounded-full bg-surface-alt" />
                }
              >
                <TrafficGlobe markers={markers} dark={dark} />
              </Suspense>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Globe2 className="h-3 w-3" />
                Drag to rotate · auto-spins
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {sortedCountries.slice(0, 5).map((c) => (
              <span key={c.code || c.country} className="inline-flex items-center gap-1.5">
                {c.code && <span aria-hidden>{countryFlag(c.code)}</span>}
                {c.country}
                <span className="font-semibold tabular-nums text-foreground">
                  {c.users.toLocaleString()}
                </span>
              </span>
            ))}
          </div>
        </section>

        {/* Active users right now */}
        <Panel
          title="Active users right now"
          subtitle="Real-time activity feed (15s refresh)"
          className="flex flex-col"
        >
          <div className="mt-3 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1FA968] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1FA968]" />
            </span>
            <span className="text-4xl font-bold tracking-tight text-foreground">{liveCount}</span>
            <span className="text-xs text-muted-foreground">online now</span>
          </div>
          <div className="mt-4 flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
            {recent.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No recent activity in the last 15 minutes.
              </p>
            ) : (
              recent.map((a) => (
                <div
                  key={`${a.userId}-${a.createdAt}`}
                  className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-alt px-3 py-2"
                >
                  <span
                    className="mt-0.5 shrink-0 text-base leading-none"
                    aria-label={a.country ?? "Unknown"}
                    title={a.country ?? "Unknown"}
                  >
                    {a.countryCode ? countryFlag(a.countryCode) : "🌐"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-foreground">
                      <span className="font-semibold">{a.name ?? a.email ?? "User"}</span> —{" "}
                      {a.currentAction}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {[a.city, a.country].filter(Boolean).join(", ") || "Unknown"} ·{" "}
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* Countries table + Peak hours */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Top countries / regions" subtitle="Traffic share by country">
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Country</th>
                  <th className="pb-2 pr-4 text-right font-medium">Users</th>
                  <th className="pb-2 pr-4 text-right font-medium">Sessions</th>
                  <th className="pb-2 font-medium">% of traffic</th>
                </tr>
              </thead>
              <tbody>
                {sortedCountries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No country data in this range.
                    </td>
                  </tr>
                ) : (
                  sortedCountries.map((c) => (
                    <tr
                      key={c.code || c.country}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center gap-2">
                          {c.code && (
                            <span className="text-base leading-none" aria-hidden title={c.country}>
                              {countryFlag(c.code)}
                            </span>
                          )}
                          <span className="font-medium text-foreground">{c.country}</span>
                          {c.code && (
                            <span className="rounded bg-surface-alt px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                              {c.code}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">
                        {c.users.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                        {c.sessions.toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-alt">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F]"
                              style={{ width: `${(c.pct / countryPctMax) * 100}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-xs text-muted-foreground">
                            {c.pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Peak hours" subtitle="Events by hour of day (server time)">
          <div className="mt-4 space-y-2">
            {peakHours.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              peakHours.map((h) => (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {String(h.hour).padStart(2, "0")}:00
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F]"
                      style={{ width: `${(h.count / peakHoursMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs tabular-nums text-foreground">
                    {h.count.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* Traffic sources + traffic over time */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Traffic sources" subtitle="How visitors arrive (referrer)">
          {sources.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">No source data yet.</p>
          ) : (
            <>
              <div className="mt-3 h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sources}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="var(--color-surface)"
                      strokeWidth={2}
                    >
                      {sources.map((s) => (
                        <Cell key={s.name} fill={s.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => v.toLocaleString()}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {sources.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.fill }}
                    />
                    {s.name}
                    <span className="ml-auto tabular-nums text-foreground">
                      {s.value.toLocaleString()}
                    </span>
                    <span className="w-9 text-right font-semibold tabular-nums text-muted-foreground">
                      {trafficTotal ? Math.round((s.value / trafficTotal) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Traffic over time"
          subtitle="Daily event volume across the selected range"
          className="lg:col-span-2"
        >
          {trafficOverTime.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              {timelineQ.isLoading ? "Loading…" : "No daily traffic in this range."}
            </p>
          ) : (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficOverTime}>
                  <defs>
                    <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.teal} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={palette.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: gridStroke }}
                    formatter={(v: number) => v.toLocaleString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name="Events"
                    stroke={palette.teal}
                    strokeWidth={2.5}
                    fill="url(#gVisits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      {/* Device / browser / OS donuts */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Donut title="Device" data={devicesQ.data?.deviceType ?? []} />
        <Donut title="Browser" data={devicesQ.data?.browser ?? []} />
        <Donut title="Operating System" data={devicesQ.data?.os ?? []} />
      </div>

      {/* Peak usage heatmap */}
      <Panel
        title="Peak usage times"
        subtitle="Relative activity by day &amp; hour (server time) — hover a cell for detail"
      >
        {heatmapQ.data && heatmapQ.data.length > 0 ? (
          <UsageHeatmap data={heatmapQ.data} />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {heatmapQ.isLoading ? "Loading heatmap…" : "No activity recorded in this range."}
          </p>
        )}
      </Panel>
    </div>
  );
}
