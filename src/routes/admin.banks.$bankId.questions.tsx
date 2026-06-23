import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Plus, Upload, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { getQuestionsForBank } from "@/data/questions";

export const Route = createFileRoute("/admin/banks/$bankId/questions")({
  head: () => ({ meta: [{ title: "Admin · Questions — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminBankQuestions,
});

function AdminBankQuestions() {
  const { bankId } = Route.useParams();
  const navigate = useNavigate();
  const bank = questionBanks.find((b) => b.id === bankId);
  const seedQuestions = useMemo(() => getQuestionsForBank(bankId, 12), [bankId]);

  if (!bank) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted-foreground">Bank not found.</p>
        <Link to="/admin/banks" className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline">← Back to banks</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/banks" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Banks
          </Link>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{bank.name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{bank.questionCount.toLocaleString()} total questions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate({ to: "/admin/banks/$bankId/upload", params: { bankId } })}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            <Upload className="h-4 w-4" /> Upload CSV/XLSX
          </button>
          <button
            onClick={() => navigate({ to: "/admin/banks/$bankId/questions/new", params: { bankId } })}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" /> Add Question
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[40px_1fr_80px_80px_120px_120px_120px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>#</span>
          <span>Question</span>
          <span className="text-center">Opts</span>
          <span className="text-center">Correct</span>
          <span>Difficulty</span>
          <span>Topic</span>
          <span className="text-right">Actions</span>
        </div>
        {seedQuestions.map((q, i) => (
          <div key={q.id} className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[40px_1fr_80px_80px_120px_120px_120px] md:items-center md:gap-4">
            <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
            <span className="truncate text-sm text-foreground" title={q.stem}>{q.stem}</span>
            <span className="text-center font-mono text-xs text-muted-foreground">{q.options.length}</span>
            <span className="text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-light text-xs font-bold text-success">{q.correctKey}</span></span>
            <span className="text-xs text-muted-foreground">{q.difficulty}</span>
            <span className="truncate text-xs text-muted-foreground">{q.topic}</span>
            <div className="flex items-center justify-end gap-1">
              <Link
                to="/admin/banks/$bankId/questions/$questionId"
                params={{ bankId, questionId: q.id }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                aria-label="Edit"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                onClick={() => toast.success("Question deleted")}
                className="rounded-md p-1.5 text-error hover:bg-error-light"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
