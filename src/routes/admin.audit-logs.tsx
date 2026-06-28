import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useProtectionEvents,
  useProtectionSummary,
  useTopOffenders,
  EVENT_TYPE_LABELS,
  ALL_EVENT_TYPES,
  type ProtectionEvent,
  type BackendProtectionEventType,
  type BackendProtectionContext,
} from "@/api/protection.api";

// Deterministic, locale + timezone-stable timestamp so the SSR HTML and the
// hydrated client render byte-identical strings (otherwise toLocaleString uses
// the runtime's default locale/TZ — UTC/en-US on the server vs the user's
// locale in the browser — and React reports a hydration mismatch). Ghana-based.
const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});
function formatTimestamp(value: string | number | Date): string {
  return DATE_FMT.format(new Date(value));
}

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [{ title: "Admin · Audit Logs — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AuditLogsPage,
});

/* GAP: there is no admin activity-log API assigned to this work item. The
 * "Activity Log" tab below stays on a static seed until that endpoint is wired
 * (the user activity-log lives at GET /admin/users/:id/activity, which is
 * per-user, not a global feed). */
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

// No global admin activity-log feed endpoint exists yet (per-user history lives
// at GET /admin/users/:id/activity, and the real global view is /admin/activity-logs),
// so this tab renders no fabricated rows — it shows an empty state until a global
// feed is wired.
const seed: AuditEntry[] = [];

const sevStyle: Record<AuditEntry["severity"], string> = {
  info: "bg-surface-alt text-muted-foreground",
  warning: "bg-warning-light text-warning",
  critical: "bg-error-light text-error",
};

/* ------------------------------------------------------------------ */
/* Shared UI                                                           */
/* ------------------------------------------------------------------ */

const Avatar = React.memo(function Avatar({ id }: { id: string }) {
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
      {id.slice(0, 2).toUpperCase()}
    </span>
  );
});

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 10)}…` : id;
}

const TABS = ["Activity Log", "Protection Violations"] as const;
type Tab = (typeof TABS)[number];

function AuditLogsPage() {
  const [tab, setTab] = useState<Tab>("Activity Log");
  const summary = useProtectionSummary();
  const violationCount = summary.data?.totalViolations ?? 0;

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
/* Tab 1 — Activity Log (GAP: still on static seed, see note above)    */
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
                    {formatTimestamp(e.at)}
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

function EventPill({ type }: { type: BackendProtectionEventType }) {
  const isShot = type === "screenshot_attempt";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isShot ? "bg-error/10 text-error" : "bg-surface-alt text-muted-foreground"
      }`}
    >
      {isShot && <Camera className="h-3 w-3" />}
      {EVENT_TYPE_LABELS[type]}
    </span>
  );
}

function ProtectionViolationsTab() {
  const navigate = useNavigate();

  const [searchRaw, setSearchRaw] = useState("");
  const [type, setType] = useState<"all" | BackendProtectionEventType>("all");
  const [context, setContext] = useState<"all" | BackendProtectionContext>("all");
  const [shotOnly, setShotOnly] = useState(false);
  const [page, setPage] = useState(1);
  const search = useDebounce(searchRaw, 250);

  const effectiveType: BackendProtectionEventType | undefined = shotOnly
    ? "screenshot_attempt"
    : type === "all"
      ? undefined
      : type;

  const eventsQuery = useProtectionEvents({
    limit: 100,
    eventType: effectiveType,
    context: context === "all" ? undefined : context,
  });
  const summaryQuery = useProtectionSummary();
  const offendersQuery = useTopOffenders({ limit: 5 });

  const events = useMemo(() => eventsQuery.data?.events ?? [], [eventsQuery.data]);

  const goToUser = (userId: string) => navigate({ to: "/admin/users/$userId", params: { userId } });

  /* Summary metrics (from the aggregate endpoint) */
  const totalViolations = summaryQuery.data?.totalViolations ?? 0;
  const screenshotAttempts = summaryQuery.data?.screenshotAttempts ?? 0;
  const uniqueUsers = summaryQuery.data?.uniqueOffendingUsers ?? 0;
  const activeRestrictions = summaryQuery.data?.activeRestrictions ?? 0;

  /* Top offenders from the dedicated endpoint */
  const topOffenders = offendersQuery.data ?? [];

  /* Client-side search (userId) + newest-first sort; type/context are server-side */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => {
        if (!q) return true;
        return e.userId.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [events, search]);

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
          accent="screenshot events"
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
                placeholder="Search user id…"
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
                  {EVENT_TYPE_LABELS[t]}
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
              const active = type === t || (shotOnly && t === "screenshot_attempt");
              const isShot = t === "screenshot_attempt";
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
                  {EVENT_TYPE_LABELS[t]}
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
              <table className="w-full min-w-[860px] text-sm">
                <thead className="border-b border-border bg-surface-alt/40 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">User</th>
                    <th className="px-4 py-3 text-left font-bold">Event type</th>
                    <th className="px-4 py-3 text-left font-bold">Context</th>
                    <th className="px-4 py-3 text-left font-bold">IP</th>
                    <th className="px-4 py-3 text-left font-bold">Device</th>
                    <th className="px-4 py-3 text-left font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eventsQuery.isLoading ? (
                    <tr>
                      <td colSpan={6}>
                        <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                          Loading violations…
                        </p>
                      </td>
                    </tr>
                  ) : eventsQuery.isError ? (
                    <tr>
                      <td colSpan={6}>
                        <p className="px-6 py-16 text-center text-sm text-error">
                          {(eventsQuery.error as Error)?.message ?? "Failed to load events."}
                        </p>
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
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
            {offendersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : topOffenders.length === 0 ? (
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
                  <Avatar id={o.userName ?? o.userEmail ?? o.userId} />
                  <div className="min-w-0 flex-1">
                    {o.userName || o.userEmail ? (
                      <>
                        <div className="truncate text-xs font-semibold text-foreground">
                          {o.userName ?? o.userEmail}
                        </div>
                        {o.userName && o.userEmail ? (
                          <div className="truncate text-[11px] text-muted-foreground">
                            {o.userEmail}
                          </div>
                        ) : (
                          <div className="truncate text-[11px] text-muted-foreground">
                            {o.screenshotAttempts} screenshot
                            {o.screenshotAttempts === 1 ? "" : "s"}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="truncate text-xs font-semibold text-foreground">
                          Deleted user
                        </div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {shortId(o.userId)}
                        </div>
                      </>
                    )}
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
          <Avatar id={e.userId} />
          <div className="min-w-0">
            <div className="truncate font-mono text-xs font-semibold text-foreground">
              {shortId(e.userId)}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">User ID</div>
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
          {e.contextLabel}
        </span>
        <div className="font-mono text-xs text-muted-foreground">
          {e.contextId}
          {e.page != null ? ` · p.${e.page}` : ""}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.ip}</td>
      <td className="px-4 py-3 font-mono text-xs text-foreground">{shortId(e.device)}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{formatTimestamp(e.createdAt)}</td>
    </tr>
  );
}
