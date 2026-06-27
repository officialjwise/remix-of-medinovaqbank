import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Download, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  useReports,
  useRunReport,
  useScheduleReport,
  exportReportCsv,
  type ReportVM,
  type ReportRunResultVM,
} from "@/api/reports.api";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [{ title: "Admin · Reports — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: ReportsPage,
});

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ReportsPage() {
  const reportsQuery = useReports();
  const [scheduleFor, setScheduleFor] = useState<ReportVM | null>(null);
  const [runResult, setRunResult] = useState<ReportRunResultVM | null>(null);

  const reports = reportsQuery.data ?? [];

  return (
    <div>
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pre-built reports for finance, growth, and content teams. Schedule for email delivery or
          export on demand.
        </p>
      </header>

      {reportsQuery.isLoading ? (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reports…
        </div>
      ) : reportsQuery.isError ? (
        <p className="mt-10 text-center text-sm text-error">
          {(reportsQuery.error as Error)?.message ?? "Failed to load reports."}
        </p>
      ) : reports.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No reports defined yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onScheduled={() => setScheduleFor(r)}
              onRan={setRunResult}
            />
          ))}
        </div>
      )}

      {scheduleFor && <ScheduleModal report={scheduleFor} onClose={() => setScheduleFor(null)} />}
      {runResult && <RunResultModal result={runResult} onClose={() => setRunResult(null)} />}
    </div>
  );
}

function ReportCard({
  report,
  onScheduled,
  onRan,
}: {
  report: ReportVM;
  onScheduled: () => void;
  onRan: (r: ReportRunResultVM) => void;
}) {
  const runMutation = useRunReport();
  const [exporting, setExporting] = useState(false);

  const handleRun = () => {
    runMutation.mutate(report.id, {
      onSuccess: (result) => {
        toast.success(`${report.name} computed`);
        onRan(result);
      },
      onError: (err) => toast.error((err as Error)?.message ?? "Failed to run report"),
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReportCsv(report.id, report.name);
      toast.success("CSV downloaded");
    } catch (err) {
      toast.error((err as Error)?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <article className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgb(14_124_123_/_0.18)]">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B]/10 to-[#2BC97F]/15 text-[#0E7C7B]">
        <FileText className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-bold text-foreground">{report.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{report.description}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {report.typeLabel}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Last run · {relativeTime(report.lastRunAt)}
        </span>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleRun}
          disabled={runMutation.isPending}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] text-xs font-semibold text-white disabled:opacity-60"
        >
          {runMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Run now
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          title="Export latest CSV"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={onScheduled}
          title="Schedule email delivery"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function ScheduleModal({ report, onClose }: { report: ReportVM; onClose: () => void }) {
  const scheduleMutation = useScheduleReport();
  const [frequency, setFrequency] = useState("weekly");
  const [recipients, setRecipients] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = recipients
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      toast.error("Add at least one recipient email");
      return;
    }
    scheduleMutation.mutate(
      { id: report.id, input: { frequency: frequency.trim(), recipients: emails, isActive: true } },
      {
        onSuccess: () => {
          toast.success(`${report.name} scheduled (${frequency})`);
          onClose();
        },
        onError: (err) => toast.error((err as Error)?.message ?? "Failed to save schedule"),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Schedule report</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{report.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-surface-alt"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              A named frequency or a cron expression (e.g. <code>0 6 * * 1</code>).
            </p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Recipients
            </label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="finance@example.com, growth@example.com"
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Comma- or newline-separated email addresses.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {scheduleMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RunResultModal({ result, onClose }: { result: ReportRunResultVM; onClose: () => void }) {
  const headers = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Report result</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Computed {new Date(result.computedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-surface-alt"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          {result.rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No data returned for this report.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-alt text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.rows.map((row, i) => (
                  <tr key={i}>
                    {headers.map((h) => (
                      <td key={h} className="px-4 py-2.5 text-foreground">
                        {String(row[h])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
