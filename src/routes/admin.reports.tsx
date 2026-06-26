import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [{ title: "Admin · Reports — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: ReportsPage,
});

const reports = [
  {
    id: "rev",
    title: "Revenue Summary",
    desc: "Subscriptions, MRR, ARR, churn — by plan and month.",
    lastRun: "2h ago",
  },
  {
    id: "users",
    title: "User Cohort Analysis",
    desc: "Signup → first session → first paid subscription funnel.",
    lastRun: "1d ago",
  },
  {
    id: "engagement",
    title: "Engagement Report",
    desc: "DAU, WAU, MAU, sessions per user, retention curves.",
    lastRun: "5h ago",
  },
  {
    id: "content",
    title: "Content Performance",
    desc: "Hardest banks, most-flagged questions, mean accuracy by subject.",
    lastRun: "3d ago",
  },
  {
    id: "exam",
    title: "Exam Readiness Report",
    desc: "Per-user readiness scores against USMLE / PLAB / MDCN benchmarks.",
    lastRun: "12h ago",
  },
  {
    id: "ai",
    title: "AI Usage & Cost",
    desc: "Tokens consumed by explanation type, cost per active user.",
    lastRun: "1w ago",
  },
];

function ReportsPage() {
  return (
    <div>
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pre-built reports for finance, growth, and content teams. Schedule for email delivery or
          export on demand.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <article
            key={r.id}
            className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgb(14_124_123_/_0.18)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B]/10 to-[#2BC97F]/15 text-[#0E7C7B]">
              <FileText className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-foreground">{r.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Last run · {r.lastRun}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => toast.message(`Generating ${r.title}…`)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] text-xs font-semibold text-white"
              >
                Run now
              </button>
              <button
                onClick={() => toast.success("Latest CSV downloaded")}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
