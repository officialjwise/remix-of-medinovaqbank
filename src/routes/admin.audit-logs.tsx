import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  useProtectionStore,
  EVENT_LABELS,
  ALL_EVENT_TYPES,
  type ProtectionEvent,
  type ProtectionEventType,
} from "@/stores/protectionStore";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [{ title: "Admin · Audit Logs — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AuditLogsPage,
});

interface AuditEntry {
  id: string;
  actor: string;
  actorRole: "SUPER_ADMIN" | "SYSTEM";
  action: string;
  target: string;
  ip: string;
  at: string;
  severity: "info" | "warning" | "critical";
}

const verbs = [
  "created",
  "updated",
  "deleted",
  "suspended",
  "reactivated",
  "exported",
  "logged in",
  "rotated",
];
const targets = [
  "bank:cardiology-essentials",
  "user:akua.mensah@example.gh",
  "plan:12-months",
  "subscription:sub_4f2",
  "api-key:mqb_live_8a3f",
  "settings:ai",
  "settings:system",
];

const seed: AuditEntry[] = Array.from({ length: 30 }, (_, i) => ({
  id: `a-${i + 1}`,
  actor: ["You (super.admin)", "kofi.admin", "ama.admin", "system"][i % 4],
  actorRole: i % 4 === 0 ? "SUPER_ADMIN" : i % 4 === 3 ? "SYSTEM" : "SUPER_ADMIN",
  action: verbs[i % verbs.length],
  target: targets[i % targets.length],
  ip: ["41.66.xxx.xx", "154.160.xxx.xx", "—"][i % 3],
  at: new Date(Date.now() - i * 47 * 60 * 1000).toISOString(),
  severity: (i % 9 === 0 ? "critical" : i % 4 === 0 ? "warning" : "info") as AuditEntry["severity"],
}));

const sevStyle: Record<AuditEntry["severity"], string> = {
  info: "bg-surface-alt text-muted-foreground",
  warning: "bg-warning-light text-warning",
  critical: "bg-error-light text-error",
};

/* ------------------------------------------------------------------ */
/* Shared UI                                                           */
/* ------------------------------------------------------------------ */

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const Avatar = React.memo(function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
      {initialsFromName(name)}
    </span>
  );
});

const TABS = ["Activity Log", "Protection Violations"] as const;
type Tab = (typeof TABS)[number];

function AuditLogsPage() {
  const [tab, setTab] = useState<Tab>("Activity Log");
  const violationCount = useProtectionStore((s) => s.events.length);

  return (
    <div>
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-md">
          <Activity className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Audit logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tamper-evident record of admin and system actions, plus content-protection violations.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {t}
              {t === "Protection Violations" && violationCount > 0 && (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] font-bold text-error">
                  {violationCount}
                </span>
              )}
            </span>
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#0E7C7B]" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Activity Log" ? <ActivityLogTab /> : <ProtectionViolationsTab />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 1 — Activity Log (existing content, unchanged)                  */
/* ------------------------------------------------------------------ */

function ActivityLogTab() {
  const [query, setQuery] = useState("");
  const [sev, setSev] = useState<"all" | AuditEntry["severity"]>("all");

  const filtered = seed.filter(
    (e) =>
      (sev === "all" || e.severity === sev) &&
      (query === "" ||
        e.action.includes(query.toLowerCase()) ||
        e.target.includes(query.toLowerCase()) ||
        e.actor.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div>
      <p className="text-sm text-muted-foreground">{seed.length} events in the last 30 days.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Actor, action, target…"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <select
            value={sev}
            onChange={(e) => setSev(e.target.value as typeof sev)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value="all">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button
          onClick={() => alert("CSV export — mock")}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Time</th>
                <th className="px-4 py-3 text-left font-bold">Actor</th>
                <th className="px-4 py-3 text-left font-bold">Action</th>
                <th className="px-4 py-3 text-left font-bold">Target</th>
                <th className="px-4 py-3 text-left font-bold">IP</th>
                <th className="px-4 py-3 text-left font-bold">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-surface-alt/50">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{e.actor}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {e.actorRole}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.action}</td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-xs">
                      {e.target}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.ip}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sevStyle[e.severity]}`}
                    >
                      {e.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No events match these filters.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2 — Protection Violations                                       */
/* ------------------------------------------------------------------ */

const VIOLATION_PER_PAGE = 15;

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "error" | "warning" | "primary" | "success";
  accent?: string;
}) {
  const tones: Record<string, string> = {
    error: "text-error",
    warning: "text-warning",
    primary: "text-primary",
    success: "text-success",
  };
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt ${tones[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {accent && <p className="mt-1 text-xs text-muted-foreground">{accent}</p>}
    </div>
  );
}

function EventPill({ type }: { type: ProtectionEventType }) {
  const isShot = type === "screenshot_key";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isShot ? "bg-error/10 text-error" : "bg-surface-alt text-muted-foreground"
      }`}
    >
      {isShot && <Camera className="h-3 w-3" />}
      {EVENT_LABELS[type]}
    </span>
  );
}

function ProtectionViolationsTab() {
  const navigate = useNavigate();
  const events = useProtectionStore((s) => s.events);
  const restrictions = useProtectionStore((s) => s.restrictions);
  const violationCountOf = useProtectionStore((s) => s.violationCount);

  const [searchRaw, setSearchRaw] = useState("");
  const [type, setType] = useState<"all" | ProtectionEventType>("all");
  const [context, setContext] = useState<"all" | "quiz_session" | "high_yield_note">("all");
  const [shotOnly, setShotOnly] = useState(false);
  const [page, setPage] = useState(1);
  const search = useDebounce(searchRaw, 250);

  const goToUser = (userId: string) => navigate({ to: "/admin/users/$userId", params: { userId } });

  /* Summary metrics */
  const totalViolations = events.length;
  const screenshotAttempts = useMemo(
    () => events.filter((e) => e.type === "screenshot_key").length,
    [events],
  );
  const uniqueUsers = useMemo(() => new Set(events.map((e) => e.userId)).size, [events]);
  const activeRestrictions = useMemo(
    () => restrictions.filter((r) => r.status === "active").length,
    [restrictions],
  );

  /* Top offenders (highest violation count first, top 5) */
  const topOffenders = useMemo(() => {
    const seen = new Map<
      string,
      { userId: string; userName: string; userEmail: string; count: number }
    >();
    for (const e of events) {
      if (!seen.has(e.userId)) {
        seen.set(e.userId, {
          userId: e.userId,
          userName: e.userName,
          userEmail: e.userEmail,
          count: violationCountOf(e.userId),
        });
      }
    }
    return Array.from(seen.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events, violationCountOf]);

  /* Filtering + newest-first sort */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => {
        if (shotOnly && e.type !== "screenshot_key") return false;
        if (type !== "all" && e.type !== type) return false;
        if (context !== "all" && e.context !== context) return false;
        if (!q) return true;
        return e.userName.toLowerCase().includes(q) || e.userEmail.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [events, search, type, context, shotOnly]);

  /* Reset page on filter change */
  const filterKey = `${search}|${type}|${context}|${shotOnly}`;
  const lastKey = React.useRef(filterKey);
  if (lastKey.current !== filterKey) {
    lastKey.current = filterKey;
    if (page !== 1) setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / VIOLATION_PER_PAGE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * VIOLATION_PER_PAGE;
    return filtered.slice(start, start + VIOLATION_PER_PAGE);
  }, [filtered, page]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Total violations"
          value={totalViolations}
          icon={ShieldAlert}
          tone="error"
          accent="all protection events"
        />
        <SummaryCard
          label="Screenshot attempts"
          value={screenshotAttempts}
          icon={Camera}
          tone="warning"
          accent="PrintScreen key"
        />
        <SummaryCard
          label="Users flagged"
          value={uniqueUsers}
          icon={Users}
          tone="primary"
          accent="unique offenders"
        />
        <SummaryCard
          label="Active restrictions"
          value={activeRestrictions}
          icon={Lock}
          tone="error"
          accent="currently locked out"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column: filters + table */}
        <div className="space-y-3">
          {/* Quick screenshot filter + filters */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShotOnly((v) => !v)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                shotOnly
                  ? "border-error/30 bg-error/10 text-error"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-alt"
              }`}
            >
              <Camera className="h-4 w-4" />
              Screenshot takers only
            </button>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
                placeholder="Search user name or email…"
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All event types</option>
              {ALL_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVENT_LABELS[t]}
                </option>
              ))}
            </select>

            <select
              value={context}
              onChange={(e) => setContext(e.target.value as typeof context)}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All contexts</option>
              <option value="quiz_session">Quiz</option>
              <option value="high_yield_note">Note</option>
            </select>
          </div>

          {/* Event-type chip row */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setType("all");
                setShotOnly(false);
              }}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                type === "all" && !shotOnly
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-alt text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {ALL_EVENT_TYPES.map((t) => {
              const active = type === t || (shotOnly && t === "screenshot_key");
              const isShot = t === "screenshot_key";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setShotOnly(false);
                    setType((cur) => (cur === t ? "all" : t));
                  }}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    active
                      ? isShot
                        ? "bg-error/10 text-error"
                        : "bg-primary/10 text-primary"
                      : "bg-surface-alt text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {EVENT_LABELS[t]}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filtered.length} violation{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b border-border bg-surface-alt/40 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">User</th>
                    <th className="px-4 py-3 text-left font-bold">Event type</th>
                    <th className="px-4 py-3 text-left font-bold">Context</th>
                    <th className="px-4 py-3 text-left font-bold">IP</th>
                    <th className="px-4 py-3 text-left font-bold">Device</th>
                    <th className="px-4 py-3 text-left font-bold">Location</th>
                    <th className="px-4 py-3 text-left font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                          No protection violations match these filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((e) => (
                      <ViolationRow key={e.id} e={e} onClick={() => goToUser(e.userId)} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {pageRows.length} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-alt disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-alt disabled:opacity-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side column: repeat offenders */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] lg:self-start">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-bold tracking-tight text-foreground">Top offenders</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Users with the most protection violations.
          </p>
          <div className="mt-4 space-y-2">
            {topOffenders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No violations recorded yet.</p>
            ) : (
              topOffenders.map((o, i) => (
                <button
                  key={o.userId}
                  type="button"
                  onClick={() => goToUser(o.userId)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-alt/40 px-3 py-2 text-left transition-colors hover:bg-surface-alt"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-surface text-[11px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <Avatar name={o.userName} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {o.userName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{o.userEmail}</div>
                  </div>
                  <span className="inline-flex flex-shrink-0 rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-semibold text-error">
                    {o.count}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ViolationRow({ e, onClick }: { e: ProtectionEvent; onClick: () => void }) {
  return (
    <tr className="cursor-pointer transition-colors hover:bg-surface-alt/50" onClick={onClick}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={e.userName} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-foreground">{e.userName}</div>
            <div className="truncate text-xs text-muted-foreground">{e.userEmail}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <EventPill type={e.type} />
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-foreground">
          {e.context === "quiz_session" ? (
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {e.context === "quiz_session" ? "Quiz" : "Note"}
        </span>
        <div className="font-mono text-xs text-muted-foreground">
          {e.contextId}
          {e.page != null ? ` · p.${e.page}` : ""}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.ip}</td>
      <td className="px-4 py-3 text-xs text-foreground">{e.device}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{e.location}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(e.createdAt).toLocaleString()}
      </td>
    </tr>
  );
}
