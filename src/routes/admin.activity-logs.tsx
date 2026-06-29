import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import React, { useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Download, Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useActivityLogs,
  exportActivityLogsCsv,
  type ActivityLogListParams,
  type ActivityLogVM,
} from "@/api/activity-logs.api";

export const Route = createFileRoute("/admin/activity-logs")({
  beforeLoad: () => requirePermission("audit-logs.read"),
  head: () => ({
    meta: [
      { title: "Admin · Activity Logs — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActivityLogsPage,
});

const PAGE_SIZE = 20;

function shortId(id: string | null) {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 10)}…` : id;
}

const Avatar = React.memo(function Avatar({ label }: { label: string }) {
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
});

function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [actionRaw, setActionRaw] = useState("");
  const [entityTypeRaw, setEntityTypeRaw] = useState("");
  const [exporting, setExporting] = useState(false);

  const action = useDebounce(actionRaw, 300);
  const entityType = useDebounce(entityTypeRaw, 300);

  const params: ActivityLogListParams = {
    page,
    limit: PAGE_SIZE,
    sortBy: "createdAt",
    sortOrder: "desc",
    action: action || undefined,
    entityType: entityType || undefined,
  };

  const logsQuery = useActivityLogs(params);

  /* Reset to page 1 when filters change */
  const filterKey = `${action}|${entityType}`;
  const lastKey = React.useRef(filterKey);
  if (lastKey.current !== filterKey) {
    lastKey.current = filterKey;
    if (page !== 1) setPage(1);
  }

  const logs = logsQuery.data?.logs ?? [];
  const total = logsQuery.data?.total ?? 0;
  const totalPages = logsQuery.data?.totalPages ?? 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportActivityLogsCsv({
        sortBy: "createdAt",
        sortOrder: "desc",
        action: action || undefined,
        entityType: entityType || undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-md">
          <Activity className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Activity logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tamper-evident record of admin and system actions across the platform.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={actionRaw}
              onChange={(e) => setActionRaw(e.target.value)}
              placeholder="Filter by action…"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={entityTypeRaw}
              onChange={(e) => setEntityTypeRaw(e.target.value)}
              placeholder="Filter by entity type…"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-surface-alt text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Time</th>
                <th className="px-4 py-3 text-left font-bold">Actor</th>
                <th className="px-4 py-3 text-left font-bold">Action</th>
                <th className="px-4 py-3 text-left font-bold">Entity</th>
                <th className="px-4 py-3 text-left font-bold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logsQuery.isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <p className="flex items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading activity…
                    </p>
                  </td>
                </tr>
              ) : logsQuery.isError ? (
                <tr>
                  <td colSpan={5}>
                    <p className="py-16 text-center text-sm text-error">
                      {(logsQuery.error as Error)?.message ?? "Failed to load activity logs."}
                    </p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No activity matches these filters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => <LogRow key={log.id} log={log} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {total} event{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || logsQuery.isLoading}
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
              disabled={page >= totalPages || logsQuery.isLoading}
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

function LogRow({ log }: { log: ActivityLogVM }) {
  const actorLabel = log.actorName ?? "System";
  return (
    <tr className="hover:bg-surface-alt/50">
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(log.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar label={actorLabel} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{actorLabel}</p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {shortId(log.actorId)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-foreground">{log.action}</td>
      <td className="px-4 py-3">
        <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-xs">
          {log.entityType}
          {log.entityId ? `:${shortId(log.entityId)}` : ""}
        </code>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress ?? "—"}</td>
    </tr>
  );
}
