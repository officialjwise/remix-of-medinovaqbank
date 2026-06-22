import { createFileRoute } from "@tanstack/react-router";
import { Edit, Plus, Trash2 } from "lucide-react";
import { questionBanks } from "@/data/banks";

export const Route = createFileRoute("/admin/banks")({
  head: () => ({ meta: [{ title: "Admin · Banks — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminBanks,
});

function AdminBanks() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Question Banks</h2>
          <p className="mt-1 text-sm text-muted-foreground">{questionBanks.length} banks · manage content & metadata</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" /> New Bank
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[1.5fr_140px_120px_100px_120px_100px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Bank</span>
          <span>Subject</span>
          <span>Difficulty</span>
          <span className="text-right">Questions</span>
          <span className="text-right">Sessions</span>
          <span></span>
        </div>
        {questionBanks.map((b) => (
          <div key={b.id} className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[1.5fr_140px_120px_100px_120px_100px] md:items-center md:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`h-8 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-b ${b.subjectColor}`} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
                <p className="truncate text-xs text-muted-foreground">{b.description}</p>
              </div>
            </div>
            <span className="text-xs text-foreground">{b.subject}</span>
            <span>
              <span className="inline-flex rounded-full border border-border bg-surface-alt px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {b.difficulty}
              </span>
            </span>
            <span className="text-right font-mono text-sm font-bold tabular-nums text-foreground">{b.questionCount.toLocaleString()}</span>
            <span className="text-right font-mono text-sm tabular-nums text-muted-foreground">{b.sessionsCount.toLocaleString()}</span>
            <div className="flex items-center justify-end gap-1">
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Edit">
                <Edit className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1.5 text-error hover:bg-error-light" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
