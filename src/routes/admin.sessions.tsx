import { createFileRoute } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Fingerprint,
  Globe,
  LogOut,
  MapPin,
  Monitor,
  Search,
  ShieldAlert,
  Smartphone,
  Unlock,
  X,
} from "lucide-react";
import {
  activeSessions,
  adminQuizSessions,
  adminUsers,
  loginSessions,
  type AdminQuizSession,
  type LoginSession,
} from "@/data/adminData";
import { questionBanks } from "@/data/banks";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/admin/sessions")({
  head: () => ({ meta: [{ title: "Admin · Sessions — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminSessionsPage,
});

/* ------------------------------------------------------------------ */
/* Format helpers                                                      */
/* ------------------------------------------------------------------ */

function minutesToHm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function timeAgo(minAgo: number) {
  if (minAgo < 1) return "just now";
  if (minAgo < 60) return `${minAgo} min ago`;
  const h = Math.floor(minAgo / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PER_PAGE_OPTIONS = [10, 20, 50] as const;

/* ------------------------------------------------------------------ */
/* Small shared UI                                                     */
/* ------------------------------------------------------------------ */

const Avatar = React.memo(function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
      {initials}
    </span>
  );
});

function Pill({ tone, children }: { tone: "success" | "warning" | "error" | "primary" | "muted"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    error: "bg-error/10 text-error border border-error/20",
    primary: "bg-primary/10 text-primary border border-primary/20",
    muted: "bg-surface-alt text-muted-foreground border border-border",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function TrialBadge({ trial }: { trial: boolean }) {
  return trial ? <Pill tone="warning">Trial</Pill> : <Pill tone="success">Paid</Pill>;
}

function Fingerprintish({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
      <Fingerprint className="h-3 w-3" />
      {value.slice(0, 12)}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
      <div className="h-full rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F]" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-6 py-16 text-center text-sm text-muted-foreground">{message}</div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function FilterSelect({ value, onChange, options, optionLabels }: { value: string; onChange: (v: string) => void; options: string[]; optionLabels?: (v: string) => string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {optionLabels ? optionLabels(o) : o}
        </option>
      ))}
    </select>
  );
}

function Pagination({
  page,
  totalPages,
  perPage,
  onPage,
  onPerPage,
}: {
  page: number;
  totalPages: number;
  perPage: number;
  onPage: (updater: (p: number) => number) => void;
  onPerPage: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Show</span>
        <select
          value={perPage}
          onChange={(e) => onPerPage(Number(e.target.value))}
          className="h-8 rounded-md border border-border bg-surface px-2 focus:border-primary focus:outline-none"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>per page</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-alt disabled:opacity-50"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-3 font-medium">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => onPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-alt disabled:opacity-50"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const th = "px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground";
const td = "px-4 py-3 align-middle";

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  live,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "warning" | "error" | "primary";
  live?: boolean;
  accent?: string;
}) {
  const tones: Record<string, string> = {
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    primary: "text-primary",
  };
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {live && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
        )}
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      </div>
      {accent && <p className="mt-1 text-xs text-muted-foreground">{accent}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const TABS = ["Active Sessions", "All Sessions", "Quiz Sessions"] as const;
type Tab = (typeof TABS)[number];

// Drawer payload: a unified view object
interface DrawerLogin {
  kind: "login";
  data: LoginSession;
}
interface DrawerQuiz {
  kind: "quiz";
  data: AdminQuizSession;
}
type DrawerPayload = DrawerLogin | DrawerQuiz;

function AdminSessionsPage() {
  const [tab, setTab] = useState<Tab>("Active Sessions");
  const [drawer, setDrawer] = useState<DrawerPayload | null>(null);
  const [forceLogout, setForceLogout] = useState<LoginSession | null>(null);

  const sessionsToday = useMemo(() => {
    const today = new Date().toDateString();
    return loginSessions.filter((s) => new Date(s.loginAt).toDateString() === today).length;
  }, []);
  const quizInProgress = useMemo(() => adminQuizSessions.filter((s) => s.status === "in-progress").length, []);
  const suspiciousSessions = useMemo(() => loginSessions.filter((s) => s.suspicious), []);

  const handleTerminate = () => {
    setForceLogout(null);
    setDrawer(null);
    toast.success("Session terminated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Session Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor active logins, historical sessions, quiz activity, and device security across the platform.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Active Sessions" value={activeSessions.length} icon={Activity} tone="success" live accent="live now" />
        <KpiCard label="Sessions Today" value={sessionsToday} icon={Globe} tone="primary" accent="logins in last 24h" />
        <KpiCard label="Quizzes In Progress" value={quizInProgress} icon={Monitor} tone="warning" accent="currently being taken" />
        <KpiCard label="Suspicious Flags" value={suspiciousSessions.length} icon={ShieldAlert} tone="error" accent="needs review" />
      </div>

      {/* Device & trial controls */}
      <DeviceTrialControls suspiciousCount={suspiciousSessions.length} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#0E7C7B]" />}
          </button>
        ))}
      </div>

      {tab === "Active Sessions" && (
        <ActiveSessionsView onView={(s) => setDrawer({ kind: "login", data: s })} onForceLogout={setForceLogout} />
      )}
      {tab === "All Sessions" && <AllSessionsView onView={(s) => setDrawer({ kind: "login", data: s })} />}
      {tab === "Quiz Sessions" && <QuizSessionsView onView={(s) => setDrawer({ kind: "quiz", data: s })} />}

      {/* Detail drawer */}
      {drawer && (
        <SessionDrawer
          payload={drawer}
          onClose={() => setDrawer(null)}
          onForceLogout={(s) => setForceLogout(s)}
        />
      )}

      {/* Force-logout confirm */}
      <ConfirmDialog
        open={!!forceLogout}
        variant="destructive"
        title="Terminate session?"
        description={
          forceLogout ? (
            <>
              This will force <strong className="text-foreground">{forceLogout.userName}</strong> to log out from{" "}
              <strong className="text-foreground">{forceLogout.device}</strong>. They can sign in again on their bound device.
            </>
          ) : undefined
        }
        confirmLabel="Force logout"
        onCancel={() => setForceLogout(null)}
        onConfirm={handleTerminate}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Active Sessions                                                     */
/* ------------------------------------------------------------------ */

const ACTIVITY_OPTIONS = ["All", "in-quiz", "browsing", "idle"];

function activityLabel(a: LoginSession["activity"], bankName?: string) {
  if (a === "in-quiz") return `Taking quiz: ${bankName ?? "—"}`;
  if (a === "browsing") return "Browsing";
  return "Idle";
}

function ActiveSessionsView({
  onView,
  onForceLogout,
}: {
  onView: (s: LoginSession) => void;
  onForceLogout: (s: LoginSession) => void;
}) {
  const [searchRaw, setSearchRaw] = useState("");
  const [activity, setActivity] = useState("All");
  const search = useDebounce(searchRaw, 250);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeSessions.filter((s) => {
      if (activity !== "All" && s.activity !== activity) return false;
      if (!q) return true;
      return s.userName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
    });
  }, [search, activity]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={searchRaw} onChange={setSearchRaw} placeholder="Search by name, email, or city…" />
        <FilterSelect value={activity} onChange={setActivity} options={ACTIVITY_OPTIONS} optionLabels={(v) => (v === "All" ? "All activity" : activityLabel(v as LoginSession["activity"], ""))} />
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} active</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-border bg-surface-alt/40">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Device</th>
                <th className={th}>Location</th>
                <th className={th}>Login / Activity</th>
                <th className={th}>Current activity</th>
                <th className={th}>Duration</th>
                <th className={th}>Plan</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState message="No active sessions match these filters." />
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-border last:border-0 transition-colors hover:bg-surface-alt/30 ${s.suspicious ? "bg-error/[0.04]" : ""}`}
                  >
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar initials={s.initials} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-foreground">{s.userName}</span>
                            {s.suspicious && <Pill tone="error">⚑ Flagged</Pill>}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <div className="text-foreground">{s.browser}</div>
                      <div className="text-xs text-muted-foreground">{s.os}</div>
                      <Fingerprintish value={s.id} />
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-1 text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.city}, {s.country}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{s.ip}</div>
                    </td>
                    <td className={td}>
                      <div className="text-foreground">{formatTime(s.loginAt)}</div>
                      <div className="text-xs text-muted-foreground">active {timeAgo(s.lastActivityMinAgo)}</div>
                    </td>
                    <td className={`${td} max-w-[220px]`}>
                      {s.activity === "in-quiz" ? (
                        <div className="space-y-1.5">
                          <span className="block truncate text-foreground">{activityLabel(s.activity, s.bankName)}</span>
                          <ProgressBar value={s.progress ?? 0} />
                          <span className="text-xs text-muted-foreground">{s.progress ?? 0}% complete</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{activityLabel(s.activity)}</span>
                      )}
                    </td>
                    <td className={`${td} tabular-nums text-foreground`}>{minutesToHm(s.durationMin)}</td>
                    <td className={td}>
                      <TrialBadge trial={s.trial} />
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView(s)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-alt"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onForceLogout(s)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-error transition-colors hover:border-error/30 hover:bg-error/10"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Force logout
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* All Sessions                                                        */
/* ------------------------------------------------------------------ */

function AllSessionsView({ onView }: { onView: (s: LoginSession) => void }) {
  const [searchRaw, setSearchRaw] = useState("");
  const [device, setDevice] = useState("All");
  const [country, setCountry] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const search = useDebounce(searchRaw, 250);

  const deviceOptions = useMemo(() => ["All", ...Array.from(new Set(loginSessions.map((s) => s.device)))], []);
  const countryOptions = useMemo(() => ["All", ...Array.from(new Set(loginSessions.map((s) => s.country)))], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loginSessions.filter((s) => {
      if (device !== "All" && s.device !== device) return false;
      if (country !== "All" && s.country !== country) return false;
      if (!q) return true;
      return s.userName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [search, device, country]);

  // reset page when filters change
  const filterKey = `${search}|${device}|${country}|${perPage}`;
  const lastKey = React.useRef(filterKey);
  if (lastKey.current !== filterKey) {
    lastKey.current = filterKey;
    if (page !== 1) setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={searchRaw} onChange={setSearchRaw} placeholder="Search by name or email…" />
        <FilterSelect value={device} onChange={setDevice} options={deviceOptions} optionLabels={(v) => (v === "All" ? "All devices" : v)} />
        <FilterSelect value={country} onChange={setCountry} options={countryOptions} optionLabels={(v) => (v === "All" ? "All locations" : v)} />
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} sessions</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-surface-alt/40">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Device</th>
                <th className={th}>Location</th>
                <th className={th}>Login time</th>
                <th className={th}>Duration</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message="No sessions match these filters." />
                  </td>
                </tr>
              ) : (
                pageRows.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 transition-colors hover:bg-surface-alt/30">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar initials={s.initials} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-foreground">{s.userName}</div>
                          <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <div className="text-foreground">{s.browser}</div>
                      <div className="text-xs text-muted-foreground">{s.os}</div>
                    </td>
                    <td className={td}>
                      <div className="text-foreground">{s.city}, {s.country}</div>
                      <div className="font-mono text-xs text-muted-foreground">{s.ip}</div>
                    </td>
                    <td className={`${td} text-muted-foreground`}>{formatDateTime(s.loginAt)}</td>
                    <td className={`${td} tabular-nums text-foreground`}>{minutesToHm(s.durationMin)}</td>
                    <td className={td}>
                      {s.status === "active" ? <Pill tone="success">Active</Pill> : <Pill tone="muted">Ended</Pill>}
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        onClick={() => onView(s)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-alt"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          onPage={setPage}
          onPerPage={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quiz Sessions                                                       */
/* ------------------------------------------------------------------ */

function scoreTone(pct: number): "success" | "warning" | "error" {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function QuizSessionsView({ onView }: { onView: (s: AdminQuizSession) => void }) {
  const [searchRaw, setSearchRaw] = useState("");
  const [bank, setBank] = useState("All");
  const [mode, setMode] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const search = useDebounce(searchRaw, 250);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return adminQuizSessions.filter((s) => {
      if (bank !== "All" && s.bankId !== bank) return false;
      if (mode !== "All" && s.mode !== mode) return false;
      if (status !== "All" && s.status !== status) return false;
      if (!q) return true;
      return s.userName.toLowerCase().includes(q);
    });
  }, [search, bank, mode, status]);

  const filterKey = `${search}|${bank}|${mode}|${status}|${perPage}`;
  const lastKey = React.useRef(filterKey);
  if (lastKey.current !== filterKey) {
    lastKey.current = filterKey;
    if (page !== 1) setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={searchRaw} onChange={setSearchRaw} placeholder="Search by user…" />
        <FilterSelect value={bank} onChange={setBank} options={["All", ...questionBanks.map((b) => b.id)]} optionLabels={(v) => (v === "All" ? "All banks" : questionBanks.find((b) => b.id === v)?.name ?? v)} />
        <FilterSelect value={mode} onChange={setMode} options={["All", "TUTOR", "QUIZ"]} optionLabels={(v) => (v === "All" ? "All modes" : v)} />
        <FilterSelect value={status} onChange={setStatus} options={["All", "completed", "in-progress", "abandoned"]} optionLabels={(v) => (v === "All" ? "All statuses" : v)} />
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} sessions</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-border bg-surface-alt/40">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Bank</th>
                <th className={th}>Mode</th>
                <th className={th}>Score</th>
                <th className={th}>Questions</th>
                <th className={th}>Status</th>
                <th className={th}>Duration</th>
                <th className={th}>Date</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState message="No quiz sessions match these filters." />
                  </td>
                </tr>
              ) : (
                pageRows.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 transition-colors hover:bg-surface-alt/30">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar initials={s.initials} />
                        <span className="truncate font-semibold text-foreground">{s.userName}</span>
                      </div>
                    </td>
                    <td className={`${td} text-foreground`}>{s.bankName}</td>
                    <td className={td}>{s.mode === "TUTOR" ? <Pill tone="primary">TUTOR</Pill> : <Pill tone="warning">QUIZ</Pill>}</td>
                    <td className={td}>
                      {s.status === "completed" ? (
                        <span className={`font-mono text-sm font-bold tabular-nums ${scoreTone(s.scorePct) === "success" ? "text-success" : scoreTone(s.scorePct) === "warning" ? "text-warning" : "text-error"}`}>
                          {s.scorePct}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`${td} tabular-nums text-foreground`}>
                      {s.questionsAnswered}/{s.totalQuestions}
                    </td>
                    <td className={td}>
                      {s.status === "completed" ? (
                        <Pill tone="success">Completed</Pill>
                      ) : s.status === "in-progress" ? (
                        <Pill tone="warning">In progress</Pill>
                      ) : (
                        <Pill tone="muted">Abandoned</Pill>
                      )}
                    </td>
                    <td className={`${td} tabular-nums text-foreground`}>{minutesToHm(s.durationMin)}</td>
                    <td className={`${td} text-muted-foreground`}>{new Date(s.date).toLocaleDateString()}</td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        onClick={() => onView(s)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-alt"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          onPage={setPage}
          onPerPage={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Device & Trial controls                                             */
/* ------------------------------------------------------------------ */

function DeviceTrialControls({ suspiciousCount }: { suspiciousCount: number }) {
  const trialUsers = useMemo(() => adminUsers.filter((u) => u.status === "trial").slice(0, 5), []);
  const [clearTarget, setClearTarget] = useState<(typeof trialUsers)[number] | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Trial device locks */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] lg:col-span-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">Trial device locks</h3>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Trial accounts are bound to a single device. Clearing a lock lets the user re-bind on next login.
        </p>
        <div className="mt-4 space-y-2">
          {trialUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trial users to display.</p>
          ) : (
            trialUsers.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-alt/40 px-3 py-2">
                <Avatar initials={u.initials} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.device}</div>
                  <Fingerprintish value={u.deviceFingerprint} />
                </div>
                <button
                  type="button"
                  onClick={() => setClearTarget(u)}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-alt"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Clear device lock
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Suspicious callout */}
      <div className="rounded-2xl border border-warning/20 bg-warning/[0.06] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">Suspicious activity</h3>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-warning">{suspiciousCount}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {suspiciousCount === 0
            ? "No flagged sessions right now."
            : `${suspiciousCount} session${suspiciousCount === 1 ? "" : "s"} flagged for multiple devices or unusual locations. Review under Active Sessions.`}
        </p>
      </div>

      <ConfirmDialog
        open={!!clearTarget}
        title="Clear device lock?"
        description={
          clearTarget ? (
            <>
              Remove the device binding for <strong className="text-foreground">{clearTarget.name}</strong>. They will be able to
              bind a new device on their next login.
            </>
          ) : undefined
        }
        confirmLabel="Clear lock"
        onCancel={() => setClearTarget(null)}
        onConfirm={() => {
          setClearTarget(null);
          toast.success("Device lock cleared — user can re-bind on next login");
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Session detail drawer                                               */
/* ------------------------------------------------------------------ */

function DrawerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">{children}</span>
    </div>
  );
}

function SessionDrawer({
  payload,
  onClose,
  onForceLogout,
}: {
  payload: DrawerPayload;
  onClose: () => void;
  onForceLogout: (s: LoginSession) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="flex h-full w-full max-w-md animate-in slide-in-from-right flex-col bg-surface shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar initials={payload.data.initials} />
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-foreground">{payload.data.userName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {payload.kind === "login" ? payload.data.email : `Quiz session · ${payload.data.id}`}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {payload.kind === "login" ? <LoginDrawerBody s={payload.data} /> : <QuizDrawerBody s={payload.data} />}
        </div>

        {/* footer */}
        <footer className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={() => toast.info("Opening full user profile…")}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            View full user
          </button>
          {payload.kind === "login" && payload.data.status === "active" && (
            <button
              type="button"
              onClick={() => onForceLogout(payload.data)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-error px-4 text-sm font-semibold text-white hover:bg-error/90"
            >
              <LogOut className="h-4 w-4" />
              Force logout
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-1 mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground first:mt-0">{children}</h4>;
}

function LoginDrawerBody({ s }: { s: LoginSession }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {s.status === "active" ? <Pill tone="success">Active</Pill> : <Pill tone="muted">Ended</Pill>}
        <TrialBadge trial={s.trial} />
        {s.suspicious && <Pill tone="error">⚑ Flagged</Pill>}
      </div>

      <SectionTitle>Device</SectionTitle>
      <DrawerRow label="Browser">{s.browser}</DrawerRow>
      <DrawerRow label="OS">{s.os}</DrawerRow>
      <DrawerRow label="Fingerprint">
        <span className="font-mono text-xs">{s.id}</span>
      </DrawerRow>

      <SectionTitle>Location</SectionTitle>
      <DrawerRow label="City">{s.city}</DrawerRow>
      <DrawerRow label="Country">{s.country}</DrawerRow>
      <DrawerRow label="IP address">
        <span className="font-mono text-xs">{s.ip}</span>
      </DrawerRow>

      <SectionTitle>Session</SectionTitle>
      <DrawerRow label="Logged in">{formatDateTime(s.loginAt)}</DrawerRow>
      <DrawerRow label="Last activity">{timeAgo(s.lastActivityMinAgo)}</DrawerRow>
      <DrawerRow label="Duration">{minutesToHm(s.durationMin)}</DrawerRow>
      <DrawerRow label="Activity">{activityLabel(s.activity, s.bankName)}</DrawerRow>

      {s.activity === "in-quiz" && (
        <>
          <SectionTitle>In-quiz progress</SectionTitle>
          <div className="rounded-xl border border-border bg-surface-alt/40 p-3">
            <div className="mb-2 text-sm font-semibold text-foreground">{s.bankName}</div>
            <ProgressBar value={s.progress ?? 0} />
            <div className="mt-1.5 text-xs text-muted-foreground">{s.progress ?? 0}% complete</div>
          </div>
        </>
      )}
    </div>
  );
}

function QuizDrawerBody({ s }: { s: AdminQuizSession }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {s.mode === "TUTOR" ? <Pill tone="primary">TUTOR</Pill> : <Pill tone="warning">QUIZ</Pill>}
        {s.status === "completed" ? (
          <Pill tone="success">Completed</Pill>
        ) : s.status === "in-progress" ? (
          <Pill tone="warning">In progress</Pill>
        ) : (
          <Pill tone="muted">Abandoned</Pill>
        )}
      </div>

      <SectionTitle>Quiz</SectionTitle>
      <DrawerRow label="Bank">{s.bankName}</DrawerRow>
      <DrawerRow label="Mode">{s.mode}</DrawerRow>
      <DrawerRow label="Score">
        {s.status === "completed" ? (
          <span className={`font-mono font-bold tabular-nums ${scoreTone(s.scorePct) === "success" ? "text-success" : scoreTone(s.scorePct) === "warning" ? "text-warning" : "text-error"}`}>
            {s.scorePct}%
          </span>
        ) : (
          "—"
        )}
      </DrawerRow>
      <DrawerRow label="Questions">
        {s.questionsAnswered}/{s.totalQuestions}
      </DrawerRow>

      <SectionTitle>Progress</SectionTitle>
      <div className="rounded-xl border border-border bg-surface-alt/40 p-3">
        <ProgressBar value={Math.round((s.questionsAnswered / s.totalQuestions) * 100)} />
        <div className="mt-1.5 text-xs text-muted-foreground">
          {s.questionsAnswered} of {s.totalQuestions} answered
        </div>
      </div>

      <SectionTitle>Meta</SectionTitle>
      <DrawerRow label="Duration">{minutesToHm(s.durationMin)}</DrawerRow>
      <DrawerRow label="Date">{new Date(s.date).toLocaleString()}</DrawerRow>
    </div>
  );
}
