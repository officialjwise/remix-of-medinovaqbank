import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { requirePermission } from "@/lib/route-guards";
import {
  useBreakdownJobs,
  useBreakdownStatus,
  useGenerateBreakdowns,
} from "@/api/admin-explanations.api";
import { useQuestionBanksLite } from "@/api/questions.api";

export const Route = createFileRoute("/admin/breakdowns")({
  beforeLoad: () => requirePermission("questions.read"),
  head: () => ({
    meta: [
      { title: "Admin · AI Breakdowns — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBreakdowns,
});

function AdminBreakdowns() {
  const { data: jobs, isLoading } = useBreakdownJobs();
  const { data: banks } = useQuestionBanksLite();
  const generate = useGenerateBreakdowns();
  const [bankId, setBankId] = useState("");
  const { data: status } = useBreakdownStatus(bankId || undefined, {
    enabled: !!bankId,
    poll: true,
  });

  const activeJobs = jobs ?? [];
  const staleCount = activeJobs.filter((j) => j.status === "stale").length;

  const run = (id: string | undefined, label: string) =>
    generate.mutate(
      { bankId: id, limit: 1000 },
      {
        onSuccess: () => toast.success(`Breakdown generation started for ${label}`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start generation"),
      },
    );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Breakdowns</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Generate clinical breakdowns per bank and watch progress. A run that stalls (a
            crash/deploy mid-generation) can be resumed here — it continues from the questions still
            missing one.
          </p>
        </div>
      </div>

      {staleCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {staleCount} generation run{staleCount === 1 ? "" : "s"} stalled — click Resume below to
          continue.
        </div>
      )}

      {/* Generate for a bank */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Generate
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Bank</label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select a bank…</option>
              {(banks ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <button
            disabled={!bankId || generate.isPending}
            onClick={() => run(bankId, banks?.find((b) => b.id === bankId)?.name ?? "bank")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Generate breakdowns
          </button>
        </div>
        {bankId && status && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              Total: <strong className="text-foreground">{status.total}</strong>
            </span>
            <span className="text-success">
              With breakdown: <strong>{status.withBreakdown}</strong>
            </span>
            <span className={status.missing > 0 ? "text-warning" : "text-muted-foreground"}>
              Missing: <strong>{status.missing}</strong>
            </span>
          </div>
        )}
      </section>

      {/* Jobs */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Generation jobs
        </h2>
        {isLoading ? (
          <div className="grid place-items-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : activeJobs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No breakdown jobs right now. Start one above.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {activeJobs.map((j) => {
              const pct = j.total ? Math.round((j.done / j.total) * 100) : 0;
              const isStale = j.status === "stale";
              const isDone = j.status === "done";
              return (
                <div
                  key={j.bankId}
                  className="rounded-xl border border-border bg-surface-alt/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{j.bankName}</span>
                      <StatusBadge status={j.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {j.done}/{j.total}
                        {j.failed > 0 ? ` · ${j.failed} failed` : ""}
                      </span>
                      {isStale && (
                        <button
                          disabled={generate.isPending}
                          onClick={() => run(j.bankId === "all" ? undefined : j.bankId, j.bankName)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt disabled:opacity-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Resume
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isStale
                          ? "bg-warning"
                          : isDone
                            ? "bg-success"
                            : "bg-gradient-to-r from-primary to-accent"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: "running" | "done" | "stale" }) {
  const map = {
    running: { label: "Running", cls: "bg-primary/10 text-primary", Icon: Loader2, spin: true },
    done: { label: "Done", cls: "bg-success/10 text-success", Icon: CheckCircle2, spin: false },
    stale: {
      label: "Stalled",
      cls: "bg-warning/10 text-warning",
      Icon: AlertTriangle,
      spin: false,
    },
  } as const;
  const { label, cls, Icon, spin } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} /> {label}
    </span>
  );
}
