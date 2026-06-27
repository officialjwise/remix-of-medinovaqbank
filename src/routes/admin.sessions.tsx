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
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useActiveSessions,
  useSuspiciousSessions,
  useTerminateSession,
  type DeviceSession,
} from "@/api/admin-sessions.api";

/**
 * Local view-model types for the historical "All Sessions" and "Quiz Sessions"
 * tabs. The backend currently exposes only the live device-session monitor
 * (active + suspicious); there is NO historical login-session or quiz-session
 * list endpoint, so those tabs render an empty state (GAP). These types are
 * kept so the detail drawer continues to compile for all tab variants.
 */
export interface LoginSession {
  id: string;
  publicId: string;
  userId: string;
  userName: string;
  email: string;
  initials: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  city: string;
  country: string;
  loginAt: string;
  lastActivityMinAgo: number;
  durationMin: number;
  activity: "idle" | "in-quiz" | "browsing";
  bankName?: string;
  progress?: number;
  status: "active" | "ended";
  trial: boolean;
  suspicious?: boolean;
}

export interface AdminQuizSession {
  id: string;
  publicId: string;
  userId: string;
  userName: string;
  initials: string;
  bankId: string;
  bankName: string;
  mode: "TUTOR" | "QUIZ";
  scorePct: number;
  questionsAnswered: number;
  totalQuestions: number;
  status: "completed" | "in-progress" | "abandoned";
  durationMin: number;
  date: string;
}

export const Route = createFileRoute("/admin/sessions")({
  head: () => ({
    meta: [{ title: "Admin · Sessions — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
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

function Pill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "error" | "primary" | "muted";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    error: "bg-error/10 text-error border border-error/20",
    primary: "bg-primary/10 text-primary border border-primary/20",
    muted: "bg-surface-alt text-muted-foreground border border-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
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
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F]"
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-6 py-16 text-center text-sm text-muted-foreground">{message}</div>;
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
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

function FilterSelect({
  value,
  onChange,
  options,
  optionLabels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  optionLabels?: (v: string) => string;
}) {
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
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt ${tones[tone]}`}
        >
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

/**
 * Helpers to adapt the real backend `DeviceSession` (active sessions monitor)
 * into the display primitives the table/drawer expect. The DTO carries the
 * user's name/email (joined server-side); we show those, never the raw UUID.
 */
/** Initials from a human label ("Jane Doe" → "JD", "a@b.com" → "A"). */
function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (
    label
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 2)
      .toUpperCase() || "??"
  );
}

/** Map free-text `currentActivity` to the structured UI activity enum. */
function deviceActivity(a: string): LoginSession["activity"] {
  const v = a.toLowerCase();
  if (v.includes("quiz")) return "in-quiz";
  if (v.includes("idle")) return "idle";
  return "browsing";
}

// Drawer payload: a unified view object.
// - "device": real backend active session (DeviceSession)
// - "login":  mock historical login session (All Sessions tab)
// - "quiz":   mock quiz session (Quiz Sessions tab)
interface DrawerDevice {
  kind: "device";
  data: DeviceSession;
}
interface DrawerLogin {
  kind: "login";
  data: LoginSession;
}
interface DrawerQuiz {
  kind: "quiz";
  data: AdminQuizSession;
}
type DrawerPayload = DrawerDevice | DrawerLogin | DrawerQuiz;

function AdminSessionsPage() {
  const [tab, setTab] = useState<Tab>("Active Sessions");
  const [drawer, setDrawer] = useState<DrawerPayload | null>(null);
  const [forceLogout, setForceLogout] = useState<DeviceSession | null>(null);

  // Real backend data for KPIs + active monitor.
  const activeQuery = useActiveSessions();
  const suspiciousQuery = useSuspiciousSessions();
  const terminate = useTerminateSession();

  const activeCount = activeQuery.data?.total ?? activeQuery.data?.sessions.length ?? 0;
  const suspiciousCount = suspiciousQuery.data?.total ?? suspiciousQuery.data?.sessions.length ?? 0;

  // GAP: backend has no "sessions today" / "quiz in progress" aggregates on the
  // sessions module — shown as 0 until those endpoints exist (no mock).
  const sessionsToday = 0;
  const quizInProgress = 0;

  const handleTerminate = () => {
    if (!forceLogout) return;
    terminate.mutate(forceLogout.id, {
      onSuccess: () => toast.success("Session terminated"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to terminate session"),
    });
    setForceLogout(null);
    setDrawer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Session Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor active logins, historical sessions, quiz activity, and device security across the
          platform.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Active Sessions"
          value={activeQuery.isLoading ? "…" : activeCount}
          icon={Activity}
          tone="success"
          live
          accent="live now"
        />
        <KpiCard
          label="Sessions Today"
          value={sessionsToday}
          icon={Globe}
          tone="primary"
          accent="logins in last 24h"
        />
        <KpiCard
          label="Quizzes In Progress"
          value={quizInProgress}
          icon={Monitor}
          tone="warning"
          accent="currently being taken"
        />
        <KpiCard
          label="Suspicious Flags"
          value={suspiciousQuery.isLoading ? "…" : suspiciousCount}
          icon={ShieldAlert}
          tone="error"
          accent="needs review"
        />
      </div>

      {/* Device & trial controls */}
      <DeviceTrialControls suspiciousCount={suspiciousCount} />

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
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#0E7C7B]" />
            )}
          </button>
        ))}
      </div>

      {tab === "Active Sessions" && (
        <ActiveSessionsView
          query={activeQuery}
          onView={(s) => setDrawer({ kind: "device", data: s })}
          onForceLogout={setForceLogout}
        />
      )}
      {tab === "All Sessions" && (
        <AllSessionsView onView={(s) => setDrawer({ kind: "login", data: s })} />
      )}
      {tab === "Quiz Sessions" && (
        <QuizSessionsView onView={(s) => setDrawer({ kind: "quiz", data: s })} />
      )}

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
              This will force this session to log out from{" "}
              <strong className="text-foreground">
                {forceLogout.browser ?? forceLogout.deviceType ?? "this device"}
                {forceLogout.os ? ` · ${forceLogout.os}` : ""}
              </strong>{" "}
              ({forceLogout.locationLabel}). They can sign in again on their bound device.
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

type ActiveSessionsQuery = ReturnType<typeof useActiveSessions>;

function ActiveSessionsView({
  query,
  onView,
  onForceLogout,
}: {
  query: ActiveSessionsQuery;
  onView: (s: DeviceSession) => void;
  onForceLogout: (s: DeviceSession) => void;
}) {
  const [searchRaw, setSearchRaw] = useState("");
  const [activity, setActivity] = useState("All");
  const search = useDebounce(searchRaw, 250);

  const { data, isLoading, isError, error } = query;

  // Client-side filter over the loaded page (server search is not wired into the
  // shared hook's query key here; filtering the active page keeps the UI snappy).
  const rows = useMemo(() => {
    const sessions = data?.sessions ?? [];
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (activity !== "All" && deviceActivity(s.currentActivity) !== activity) return false;
      if (!q) return true;
      return (
        s.userId.toLowerCase().includes(q) ||
        (s.city ?? "").toLowerCase().includes(q) ||
        (s.country ?? "").toLowerCase().includes(q) ||
        (s.ipAddress ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, activity]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          value={searchRaw}
          onChange={setSearchRaw}
          placeholder="Search by user, city, or IP…"
        />
        <FilterSelect
          value={activity}
          onChange={setActivity}
          options={ACTIVITY_OPTIONS}
          optionLabels={(v) =>
            v === "All" ? "All activity" : activityLabel(v as LoginSession["activity"], "")
          }
        />
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
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState message="Loading active sessions…" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8}>
                    <div className="px-6 py-16 text-center text-sm text-error">
                      {error instanceof Error ? error.message : "Failed to load active sessions."}
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState message="No active sessions match these filters." />
                  </td>
                </tr>
              ) : (
                rows.map((s) => {
                  const activity = deviceActivity(s.currentActivity);
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-border last:border-0 transition-colors hover:bg-surface-alt/30 ${s.isSuspicious ? "bg-error/[0.04]" : ""}`}
                    >
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <Avatar initials={initialsFromLabel(s.userLabel)} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold text-foreground">
                                {s.userLabel}
                              </span>
                              {s.isSuspicious && <Pill tone="error">⚑ Flagged</Pill>}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {s.userEmail ?? s.deviceType ?? "Unknown device"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <div className="text-foreground">{s.browser ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.os ?? "—"}</div>
                        <Fingerprintish value={s.deviceFingerprint} />
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-1 text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.locationLabel}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {s.ipAddress ?? "—"}
                        </div>
                      </td>
                      <td className={td}>
                        <div className="text-foreground">{formatTime(s.loginAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          active {timeAgo(s.lastActivityMinAgo)}
                        </div>
                      </td>
                      <td className={`${td} max-w-[220px]`}>
                        <span className="text-muted-foreground">{activityLabel(activity)}</span>
                      </td>
                      <td className={`${td} tabular-nums text-foreground`}>
                        {minutesToHm(s.durationMin)}
                      </td>
                      <td className={td}>
                        {s.isActive ? (
                          <Pill tone="success">Active</Pill>
                        ) : (
                          <Pill tone="muted">Ended</Pill>
                        )}
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
                  );
                })
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

// GAP: no historical login-session list endpoint exists yet. Until one does,
// this tab renders an empty state (live sessions are under "Active Sessions").
function AllSessionsView(_props: { onView: (s: LoginSession) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <EmptyState message="Historical session history isn't available yet. Use the Active Sessions tab for live device monitoring." />
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

// GAP: no admin quiz-session list endpoint exists yet — renders an empty state.
function QuizSessionsView(_props: { onView: (s: AdminQuizSession) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <EmptyState message="Per-user quiz session history isn't available yet." />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Device & Trial controls                                             */
/* ------------------------------------------------------------------ */

function DeviceTrialControls({ suspiciousCount }: { suspiciousCount: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Trial device locks — GAP: no trial-device-lock listing endpoint yet. */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] lg:col-span-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">Trial device locks</h3>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Trial accounts are bound to a single device. Clearing a lock lets the user re-bind on next
          login.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Trial device locks are managed per user from the user detail screen.
        </p>
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Session detail drawer                                               */
/* ------------------------------------------------------------------ */

function DrawerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm text-foreground">{children}</span>
    </div>
  );
}

function drawerInitials(payload: DrawerPayload): string {
  if (payload.kind === "device") return initialsFromLabel(payload.data.userLabel);
  return payload.data.initials;
}

function drawerTitle(payload: DrawerPayload): string {
  if (payload.kind === "device") return payload.data.userLabel;
  return payload.data.userName;
}

function drawerSubtitle(payload: DrawerPayload): string {
  if (payload.kind === "device") return payload.data.userEmail ?? payload.data.locationLabel;
  if (payload.kind === "login") return payload.data.email;
  return `Quiz session · ${payload.data.id}`;
}

function SessionDrawer({
  payload,
  onClose,
  onForceLogout,
}: {
  payload: DrawerPayload;
  onClose: () => void;
  onForceLogout: (s: DeviceSession) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex h-full w-full max-w-md animate-in slide-in-from-right flex-col bg-surface shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar initials={drawerInitials(payload)} />
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-foreground">
                {drawerTitle(payload)}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {drawerSubtitle(payload)}
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
          {payload.kind === "device" ? (
            <DeviceDrawerBody s={payload.data} />
          ) : payload.kind === "login" ? (
            <LoginDrawerBody s={payload.data} />
          ) : (
            <QuizDrawerBody s={payload.data} />
          )}
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
          {payload.kind === "device" && payload.data.isActive && (
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
  return (
    <h4 className="mb-1 mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground first:mt-0">
      {children}
    </h4>
  );
}

function DeviceDrawerBody({ s }: { s: DeviceSession }) {
  const activity = deviceActivity(s.currentActivity);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {s.isActive ? <Pill tone="success">Active</Pill> : <Pill tone="muted">Ended</Pill>}
        {s.isSuspicious && <Pill tone="error">⚑ Flagged</Pill>}
      </div>

      {s.isSuspicious && s.suspiciousReasons.length > 0 && (
        <>
          <SectionTitle>Why flagged</SectionTitle>
          <ul className="space-y-1 text-sm text-foreground">
            {s.suspiciousReasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
                {reason}
              </li>
            ))}
          </ul>
        </>
      )}

      <SectionTitle>Device</SectionTitle>
      <DrawerRow label="Type">{s.deviceType ?? "—"}</DrawerRow>
      <DrawerRow label="Browser">{s.browser ?? "—"}</DrawerRow>
      <DrawerRow label="OS">{s.os ?? "—"}</DrawerRow>
      <DrawerRow label="Fingerprint">
        <span className="font-mono text-xs">{s.deviceFingerprint}</span>
      </DrawerRow>

      <SectionTitle>Location</SectionTitle>
      <DrawerRow label="City">{s.city ?? "—"}</DrawerRow>
      <DrawerRow label="Region">{s.region ?? "—"}</DrawerRow>
      <DrawerRow label="Country">{s.country ?? "—"}</DrawerRow>
      <DrawerRow label="IP address">
        <span className="font-mono text-xs">{s.ipAddress ?? "—"}</span>
      </DrawerRow>

      <SectionTitle>Session</SectionTitle>
      <DrawerRow label="User ID">
        <span className="font-mono text-xs">{s.userId}</span>
      </DrawerRow>
      <DrawerRow label="Logged in">{formatDateTime(s.loginAt)}</DrawerRow>
      <DrawerRow label="Last activity">{timeAgo(s.lastActivityMinAgo)}</DrawerRow>
      <DrawerRow label="Duration">{minutesToHm(s.durationMin)}</DrawerRow>
      <DrawerRow label="Activity">{activityLabel(activity)}</DrawerRow>
    </div>
  );
}

function LoginDrawerBody({ s }: { s: LoginSession }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {s.status === "active" ? (
          <Pill tone="success">Active</Pill>
        ) : (
          <Pill tone="muted">Ended</Pill>
        )}
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
          <span
            className={`font-mono font-bold tabular-nums ${scoreTone(s.scorePct) === "success" ? "text-success" : scoreTone(s.scorePct) === "warning" ? "text-warning" : "text-error"}`}
          >
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
