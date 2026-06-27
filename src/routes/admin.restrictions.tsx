import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  LockOpen,
  Search,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useRestrictions,
  useLiftRestriction,
  type Restriction,
  type RestrictionStatus,
} from "@/api/protection.api";

export const Route = createFileRoute("/admin/restrictions")({
  head: () => ({
    meta: [
      { title: "Admin · Restrictions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RestrictionsPage,
});

const PER_PAGE = 15;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Unlocking…";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
}

const Avatar = React.memo(function Avatar({ id }: { id: string }) {
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
      {id.slice(0, 2).toUpperCase()}
    </span>
  );
});

function StatusPill({ status }: { status: RestrictionStatus }) {
  const map: Record<RestrictionStatus, { tone: string; label: string }> = {
    active: { tone: "bg-error/10 text-error", label: "Active" },
    expired: { tone: "bg-surface-alt text-muted-foreground", label: "Expired" },
    lifted: { tone: "bg-warning/10 text-warning", label: "Lifted" },
  };
  const { tone, label } = map[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "error" | "warning" | "muted" | "primary";
}) {
  const tones: Record<string, string> = {
    error: "text-error",
    warning: "text-warning",
    muted: "text-muted-foreground",
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
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function RestrictionsPage() {
  // Access is enforced by the parent `/admin` route guard (SUPER_ADMIN only,
  // after auth-store hydration). A render-time role check here would flash a
  // "Super Admin only" panel during hydration, so we don't repeat it.
  return <RestrictionsContent />;
}

function RestrictionsContent() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useRestrictions({ limit: 100 });
  const liftMut = useLiftRestriction();

  const restrictions = useMemo(() => data?.restrictions ?? [], [data]);

  const [status, setStatus] = useState<"all" | RestrictionStatus>("all");
  const [searchRaw, setSearchRaw] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchRaw, 250);

  /* 1s tick to drive live countdowns */
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(
    () => ({
      active: restrictions.filter((r) => r.status === "active").length,
      expired: restrictions.filter((r) => r.status === "expired").length,
      lifted: restrictions.filter((r) => r.status === "lifted").length,
      total: restrictions.length,
    }),
    [restrictions],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restrictions
      .filter((r) => {
        if (status !== "all" && r.status !== status) return false;
        if (!q) return true;
        return r.userId.toLowerCase().includes(q) || (r.notes ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.restrictedAt).getTime() - new Date(a.restrictedAt).getTime());
  }, [restrictions, status, search]);

  /* Reset page on filter change */
  const filterKey = `${status}|${search}`;
  const lastKey = React.useRef(filterKey);
  if (lastKey.current !== filterKey) {
    lastKey.current = filterKey;
    if (page !== 1) setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const goToUser = (userId: string) => navigate({ to: "/admin/users/$userId", params: { userId } });

  const handleLift = (r: Restriction) => {
    liftMut.mutate(r.id, {
      onSuccess: () => toast.success("Restriction lifted"),
      onError: (e) => toast.error((e as Error).message),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-md">
          <Lock className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Restrictions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts locked out for repeated content-protection violations. Lift a restriction early
            to restore access immediately.
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Active" value={counts.active} icon={ShieldAlert} tone="error" />
        <SummaryCard label="Expired" value={counts.expired} icon={Timer} tone="muted" />
        <SummaryCard label="Lifted" value={counts.lifted} icon={LockOpen} tone="warning" />
        <SummaryCard label="Total" value={counts.total} icon={Lock} tone="primary" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="lifted">Lifted</option>
          <option value="expired">Expired</option>
        </select>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Search user id or notes…"
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} restriction{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="border-b border-border bg-surface-alt/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-bold">User</th>
                <th className="px-4 py-3 text-left font-bold">Reason</th>
                <th className="px-4 py-3 text-left font-bold">Strikes</th>
                <th className="px-4 py-3 text-left font-bold">Restricted at</th>
                <th className="px-4 py-3 text-left font-bold">Unlock at</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Source</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                      Loading restrictions…
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8}>
                    <p className="px-6 py-16 text-center text-sm text-error">
                      {(error as Error)?.message ?? "Failed to load restrictions."}
                    </p>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                      No restrictions match these filters.
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const remaining = new Date(r.unlockAt).getTime() - Date.now();
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-surface-alt/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar id={r.userId} />
                          <div className="min-w-0">
                            <div className="truncate font-mono text-xs font-semibold text-foreground">
                              {shortId(r.userId)}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              User ID
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[260px] text-foreground">
                        {r.reasonLabel}
                        {r.notes ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {r.notes}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-foreground">{r.strikes}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(r.restrictedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-error">
                            <Timer className="h-3.5 w-3.5" />
                            {formatCountdown(remaining)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(r.unlockAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            r.manual
                              ? "bg-primary/10 text-primary"
                              : "bg-surface-alt text-muted-foreground"
                          }`}
                        >
                          {r.manual ? "Manual" : "Auto"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleLift(r)}
                              disabled={liftMut.isPending}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-success transition-colors hover:border-success/30 hover:bg-success/10 disabled:opacity-50"
                            >
                              <LockOpen className="h-3.5 w-3.5" />
                              Lift early
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => goToUser(r.userId)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-alt"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View user
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
  );
}
