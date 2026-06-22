import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Download, Search } from "lucide-react";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Admin · Audit Logs — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AuditLogsPage,
});

interface AuditEntry {
  id: string;
  actor: string;
  actorRole: "ADMIN" | "SUPER_ADMIN" | "SYSTEM";
  action: string;
  target: string;
  ip: string;
  at: string;
  severity: "info" | "warning" | "critical";
}

const verbs = ["created", "updated", "deleted", "suspended", "reactivated", "exported", "logged in", "rotated"];
const targets = ["bank:cardiology-essentials", "user:akua.mensah@example.gh", "plan:12-months", "subscription:sub_4f2", "api-key:mqb_live_8a3f", "settings:ai", "settings:system"];

const seed: AuditEntry[] = Array.from({ length: 30 }, (_, i) => ({
  id: `a-${i + 1}`,
  actor: ["You (super.admin)", "kofi.admin", "ama.admin", "system"][i % 4],
  actorRole: i % 4 === 0 ? "SUPER_ADMIN" : i % 4 === 3 ? "SYSTEM" : "ADMIN",
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

function AuditLogsPage() {
  const [query, setQuery] = useState("");
  const [sev, setSev] = useState<"all" | AuditEntry["severity"]>("all");

  const filtered = seed.filter(
    (e) =>
      (sev === "all" || e.severity === sev) &&
      (query === "" || e.action.includes(query.toLowerCase()) || e.target.includes(query.toLowerCase()) || e.actor.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div>
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white shadow-md">
          <Activity className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Audit logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tamper-evident record of admin and system actions. {seed.length} events in the last 30 days.
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{e.actor}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{e.actorRole}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.action}</td>
                  <td className="px-4 py-3"><code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-xs">{e.target}</code></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.ip}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sevStyle[e.severity]}`}>
                      {e.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No events match these filters.</p>}
      </div>
    </div>
  );
}
