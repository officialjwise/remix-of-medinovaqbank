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
import {
  Activity,
  Globe2,
  Map as MapIcon,
  MapPin,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  browserBreakdown,
  countryTraffic,
  deviceBreakdown,
  ghanaCities,
  liveActivity,
  liveUserCount,
  osBreakdown,
  signupsByLocation,
  trafficSources,
  usageHeatmap,
} from "@/data/traffic";
import { GeoBubbleMap } from "@/components/admin/GeoBubbleMap";
import { UsageHeatmap } from "@/components/admin/UsageHeatmap";
import { flagForCountry, countryFlag } from "@/lib/flags";
import type { GlobeMarker } from "@/components/admin/TrafficGlobe";

// Lazy-load the WebGL globe so cobe never blocks initial paint.
const TrafficGlobe = lazy(() =>
  import("@/components/admin/TrafficGlobe").then((m) => ({
    default: m.TrafficGlobe,
  })),
);

export const Route = createFileRoute("/admin/traffic")({
  head: () => ({
    meta: [
      { title: "Admin · Traffic — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
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

const cardClass =
  "rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]";

const gradients: Record<string, string> = {
  teal: "from-[#0E7C7B] to-[#15A89C]",
  emerald: "from-[#2BC97F] to-[#1FA968]",
  blue: "from-[#3B82F6] to-[#2563EB]",
  amber: "from-[#E89A1A] to-[#D97706]",
  violet: "from-[#7C3AED] to-[#8B5CF6]",
  rose: "from-[#E11D48] to-[#DB2777]",
};

/* ------------------------------------------------------------------ */
/* Module-level derived data                                           */
/* ------------------------------------------------------------------ */

const geoPoints = countryTraffic.map((c) => ({
  lat: c.lat,
  lng: c.lng,
  label: c.country,
  value: c.users,
  code: c.code,
}));

const geoMax = Math.max(...countryTraffic.map((c) => c.users));

const totalVisitors = countryTraffic.reduce((acc, c) => acc + c.users, 0);
const totalSessions = countryTraffic.reduce((acc, c) => acc + c.sessions, 0);
const topCountry = [...countryTraffic].sort((a, b) => b.users - a.users)[0];
const avgSessionsPerVisitor = (totalSessions / totalVisitors).toFixed(1);
const signupsToday = signupsByLocation[signupsByLocation.length - 1];
const newSignupsToday =
  signupsToday.Ghana + signupsToday.Nigeria + signupsToday.Other;

const cityMaxPct = Math.max(...ghanaCities.map((c) => c.pct));
const trafficTotal = trafficSources.reduce((acc, s) => acc + s.value, 0);

const usersMax = Math.max(...countryTraffic.map((c) => c.users));

// Globe markers sized by traffic volume (computed once at module scope).
const globeMarkers: GlobeMarker[] = countryTraffic.map((c) => ({
  location: [c.lat, c.lng] as [number, number],
  size: 0.04 + (c.users / usersMax) * 0.12,
}));

// Synthesized 30-day visits trend (seeded LCG → deterministic across renders).
const trafficOverTime = (() => {
  let seed = 20260626;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const today = new Date(2026, 5, 26);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 0.78 : 1;
    const trend = 1 + i * 0.012; // gentle upward growth
    const wave = 1 + Math.sin(i / 3.2) * 0.12;
    const visits = Math.round(1850 * weekend * trend * wave + rand() * 220);
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visits,
      sessions: Math.round(visits * (1.35 + rand() * 0.25)),
    };
  });
})();

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
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
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
  hint?: { text: string; up?: boolean };
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
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
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
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
      </div>
      {hint && (
        <p
          className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
            hint.up === undefined
              ? "text-muted-foreground"
              : hint.up
                ? "text-[#1FA968]"
                : "text-[#E11D48]"
          }`}
        >
          {hint.up === true && <TrendingUp className="h-3.5 w-3.5" />}
          {hint.up === false && <TrendingDown className="h-3.5 w-3.5" />}
          {hint.text}
        </p>
      )}
    </div>
  );
}

function Donut({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number; fill: string }[];
}) {
  const total = useMemo(
    () => data.reduce((acc, d) => acc + d.value, 0),
    [data],
  );
  return (
    <div className={cardClass}>
      <h3 className="text-sm font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="mt-3 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={68}
              paddingAngle={3}
              stroke="var(--color-surface)"
              strokeWidth={2}
            >
              {data.map((d) => (
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
        {data.map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
            />
            {d.name}
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function TrafficPage() {
  const [range, setRange] = useState<Range>("30d");
  const [mapMode, setMapMode] = useState<"flat" | "globe">("flat");
  const [dark, setDark] = useState(false);

  // Track dark mode so the globe's palette matches the theme.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const sortedCountries = useMemo(
    () => [...countryTraffic].sort((a, b) => b.users - a.users),
    [],
  );
  const countryPctMax = useMemo(
    () => Math.max(...countryTraffic.map((c) => c.pct)),
    [],
  );
  // Memoize the markers array so the globe effect doesn't re-init each render.
  const markers = useMemo(() => globeMarkers, []);

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

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total Visitors"
          value={totalVisitors.toLocaleString()}
          hint={{ text: "+9.1% vs prev", up: true }}
          icon={Users}
          tone="teal"
        />
        <KpiCard
          label="Live Users Now"
          value={liveUserCount.toLocaleString()}
          hint={{ text: "active this minute" }}
          icon={Activity}
          tone="emerald"
          live
        />
        <KpiCard
          label="Top Country"
          value={`${topCountry.country} ${topCountry.pct}%`}
          hint={{ text: `${topCountry.trend}% growth`, up: topCountry.trend >= 0 }}
          icon={Globe2}
          tone="blue"
        />
        <KpiCard
          label="New Signups Today"
          value={newSignupsToday.toLocaleString()}
          hint={{ text: "across all regions", up: true }}
          icon={UserPlus}
          tone="violet"
        />
        <KpiCard
          label="Avg Sessions / Visitor"
          value={avgSessionsPerVisitor}
          hint={{ text: "engagement depth" }}
          icon={MapPin}
          tone="amber"
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
                Geographic distribution — marker size = users
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

          {mapMode === "flat" ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <GeoBubbleMap points={geoPoints} max={geoMax} />
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
              <span key={c.code} className="inline-flex items-center gap-1.5">
                <span aria-hidden>{countryFlag(c.code)}</span>
                {c.country}
                <span className="font-semibold tabular-nums text-foreground">
                  {c.users.toLocaleString()}
                </span>
              </span>
            ))}
          </div>
        </section>

        {/* Active users right now */}
        <Panel title="Active users right now" subtitle="Real-time activity feed">
          <div className="mt-3 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1FA968] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1FA968]" />
            </span>
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {liveUserCount}
            </span>
            <span className="text-xs text-muted-foreground">online now</span>
          </div>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
            {liveActivity.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-alt px-3 py-2"
              >
                <span
                  className="mt-0.5 shrink-0 text-base leading-none"
                  aria-label={a.country}
                  title={a.country}
                >
                  {countryFlag(a.country)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-foreground">
                    <span className="font-semibold">{a.city}</span> — {a.action}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{a.ago}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Countries table + Cities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Top countries / regions"
          subtitle="Traffic share by country"
        >
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Country</th>
                  <th className="pb-2 pr-4 text-right font-medium">Users</th>
                  <th className="pb-2 pr-4 text-right font-medium">Sessions</th>
                  <th className="pb-2 pr-4 font-medium">% of traffic</th>
                  <th className="pb-2 text-right font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map((c) => (
                  <tr
                    key={c.code}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="text-base leading-none"
                          aria-hidden
                          title={c.country}
                        >
                          {flagForCountry(c.country)}
                        </span>
                        <span className="font-medium text-foreground">
                          {c.country}
                        </span>
                        <span className="rounded bg-surface-alt px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {c.code}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">
                      {c.users.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                      {c.sessions.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-alt">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F]"
                            style={{
                              width: `${(c.pct / countryPctMax) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {c.pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                          c.trend >= 0 ? "text-[#1FA968]" : "text-[#E11D48]"
                        }`}
                      >
                        {c.trend >= 0 ? "▲" : "▼"}
                        {Math.abs(c.trend)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Top cities (Ghana)" subtitle="Where Ghanaian users study">
          <div className="mt-4 space-y-3">
            {ghanaCities.map((c) => (
              <div key={c.city}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#0E7C7B]" />
                    <span className="font-medium text-foreground">
                      {c.city}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.region}
                    </span>
                  </div>
                  <span className="tabular-nums text-foreground">
                    {c.users.toLocaleString()}{" "}
                    <span className="text-xs text-muted-foreground">users</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F]"
                    style={{ width: `${(c.pct / cityMaxPct) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Traffic sources + signups by location */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Traffic sources" subtitle="How visitors arrive">
          <div className="mt-3 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSources}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                >
                  {trafficSources.map((s) => (
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
            {trafficSources.map((s) => (
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
                  {Math.round((s.value / trafficTotal) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="New signups by location"
          subtitle="Last 14 days, by region"
          className="lg:col-span-2"
        >
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupsByLocation}>
                <defs>
                  <linearGradient id="gGh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.teal} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={palette.teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gNg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.blue} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={palette.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOther" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.amber} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={palette.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridStroke}
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke={axisStroke}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis
                  stroke={axisStroke}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: gridStroke }}
                />
                <Area
                  type="monotone"
                  dataKey="Ghana"
                  stackId="1"
                  stroke={palette.teal}
                  strokeWidth={2}
                  fill="url(#gGh)"
                />
                <Area
                  type="monotone"
                  dataKey="Nigeria"
                  stackId="1"
                  stroke={palette.blue}
                  strokeWidth={2}
                  fill="url(#gNg)"
                />
                <Area
                  type="monotone"
                  dataKey="Other"
                  stackId="1"
                  stroke={palette.amber}
                  strokeWidth={2}
                  fill="url(#gOther)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {[
              { name: "Ghana", color: palette.teal },
              { name: "Nigeria", color: palette.blue },
              { name: "Other", color: palette.amber },
            ].map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      {/* Traffic over time */}
      <Panel
        title="Traffic over time"
        subtitle="Visits &amp; sessions across the last 30 days"
      >
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficOverTime}>
              <defs>
                <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.teal} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={palette.teal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={palette.emerald}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor={palette.emerald}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStroke}
                vertical={false}
              />
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
                dataKey="sessions"
                name="Sessions"
                stroke={palette.emerald}
                strokeWidth={2}
                fill="url(#gSessions)"
              />
              <Area
                type="monotone"
                dataKey="visits"
                name="Visits"
                stroke={palette.teal}
                strokeWidth={2.5}
                fill="url(#gVisits)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {[
            { name: "Visits", color: palette.teal },
            { name: "Sessions", color: palette.emerald },
          ].map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
      </Panel>

      {/* Device / browser / OS donuts */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Donut title="Device" data={deviceBreakdown} />
        <Donut title="Browser" data={browserBreakdown} />
        <Donut title="Operating System" data={osBreakdown} />
      </div>

      {/* Peak usage heatmap */}
      <Panel
        title="Peak usage times"
        subtitle="Relative activity by day &amp; hour (local time) — hover a cell for detail"
      >
        <UsageHeatmap data={usageHeatmap} />
      </Panel>
    </div>
  );
}
