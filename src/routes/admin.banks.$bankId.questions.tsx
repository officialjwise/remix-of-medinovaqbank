import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Upload, Edit, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { getQuestionsForBank } from "@/data/questions";
import type { Difficulty, Question, QuestionOption } from "@/types";

export const Route = createFileRoute("/admin/banks/$bankId/questions")({
  head: () => ({ meta: [{ title: "Admin · Questions — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminBankQuestions,
});

const OPT_KEYS = ["A", "B", "C", "D", "E"] as const;
type OptKey = (typeof OPT_KEYS)[number];

interface QuestionDraft {
  id?: string;
  stem: string;
  imageUrl?: string;
  difficulty: Difficulty;
  topic: string;
  tags: string[];
  options: QuestionOption[];
  correctKey: OptKey;
  whyCorrect: string;
}

const empty = (): QuestionDraft => ({
  stem: "",
  difficulty: "Intermediate",
  topic: "",
  tags: [],
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ],
  correctKey: "A",
  whyCorrect: "",
});

function AdminBankQuestions() {
  const { bankId } = Route.useParams();
  const navigate = useNavigate();
  const bank = questionBanks.find((b) => b.id === bankId);
  const seedQuestions = useMemo(() => getQuestionsForBank(bankId, 12), [bankId]);
  const [draft, setDraft] = useState<QuestionDraft | null>(null);
  const [tagInput, setTagInput] = useState("");

  if (!bank) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted-foreground">Bank not found.</p>
        <Link to="/admin/banks" className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline">← Back to banks</Link>
      </div>
    );
  }

  const onEdit = (q: Question) => {
    setDraft({
      id: q.id,
      stem: q.stem,
      difficulty: q.difficulty,
      topic: q.topic,
      tags: [],
      options: q.options,
      correctKey: q.correctKey,
      whyCorrect: q.whyCorrect,
    });
  };

  const addOption = () => {
    if (!draft || draft.options.length >= 5) return;
    const next = OPT_KEYS[draft.options.length];
    setDraft({ ...draft, options: [...draft.options, { key: next, text: "" }] });
  };

  const removeOption = (key: OptKey) => {
    if (!draft || draft.options.length <= 2) return;
    const filtered = draft.options.filter((o) => o.key !== key).map((o, i) => ({ ...o, key: OPT_KEYS[i] }));
    setDraft({
      ...draft,
      options: filtered,
      correctKey: draft.correctKey === key ? filtered[0].key : draft.correctKey,
    });
  };

  const save = () => {
    if (!draft) return;
    if (!draft.stem.trim()) { toast.error("Question text is required"); return; }
    if (draft.options.some((o) => !o.text.trim())) { toast.error("All options must have text"); return; }
    if (!draft.options.find((o) => o.key === draft.correctKey)) { toast.error("Mark exactly one option as correct"); return; }
    toast.success(draft.id ? "Question updated" : "Question created");
    setDraft(null);
  };

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
        <div className="flex gap-2">
          <button
            onClick={() => navigate({ to: "/admin/banks/$bankId/upload", params: { bankId } })}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            <Upload className="h-4 w-4" /> Upload CSV/XLSX
          </button>
          <button onClick={() => setDraft(empty())} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" /> Add Question
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[40px_1fr_80px_80px_120px_120px_80px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>#</span>
          <span>Question</span>
          <span className="text-center">Opts</span>
          <span className="text-center">Correct</span>
          <span>Difficulty</span>
          <span>Topic</span>
          <span className="text-right">Actions</span>
        </div>
        {seedQuestions.map((q, i) => (
          <div key={q.id} className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[40px_1fr_80px_80px_120px_120px_80px] md:items-center md:gap-4">
            <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
            <span className="truncate text-sm text-foreground" title={q.stem}>{q.stem}</span>
            <span className="text-center font-mono text-xs text-muted-foreground">{q.options.length}</span>
            <span className="text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-light text-xs font-bold text-success">{q.correctKey}</span></span>
            <span className="text-xs text-muted-foreground">{q.difficulty}</span>
            <span className="truncate text-xs text-muted-foreground">{q.topic}</span>
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => onEdit(q)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Edit"><Edit className="h-4 w-4" /></button>
              <button onClick={() => toast.success("Question deleted")} className="rounded-md p-1.5 text-error hover:bg-error-light" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10" onClick={() => setDraft(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-base font-bold text-foreground">{draft.id ? "Edit Question" : "Add Question"}</h3>
              <button onClick={() => setDraft(null)} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"><X className="h-4 w-4" /></button>
            </header>
            <div className="p-5 space-y-4">
              <Field label="Question Text">
                <textarea rows={4} value={draft.stem} onChange={(e) => setDraft({ ...draft, stem: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
              </Field>

              <Field label="Image URL (optional)">
                <input value={draft.imageUrl ?? ""} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm" placeholder="https://…" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Difficulty">
                  <select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}
                    className="h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm">
                    {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Topic">
                  <input value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
                </Field>
              </div>

              <Field label="Tags">
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-2">
                  {draft.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      {t}
                      <button type="button" onClick={() => setDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) })}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        e.preventDefault();
                        setDraft({ ...draft, tags: [...draft.tags, tagInput.trim()] });
                        setTagInput("");
                      }
                    }}
                    placeholder="Type and press Enter…"
                    className="flex-1 min-w-[8rem] bg-transparent text-sm outline-none"
                  />
                </div>
              </Field>

              <div>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Options</span>
                <div className="space-y-2">
                  {draft.options.map((o) => (
                    <div key={o.key} className="flex items-center gap-2">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-surface-alt text-sm font-bold text-foreground">{o.key}</span>
                      <input value={o.text} onChange={(e) => setDraft({ ...draft, options: draft.options.map((x) => x.key === o.key ? { ...x, text: e.target.value } : x) })}
                        className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm" />
                      <label className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <input type="radio" name="correct" checked={draft.correctKey === o.key} onChange={() => setDraft({ ...draft, correctKey: o.key })} />
                        Correct
                      </label>
                      {draft.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(o.key)} className="rounded-md p-1.5 text-error hover:bg-error-light"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
                {draft.options.length < 5 && (
                  <button type="button" onClick={addOption} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" /> Add Option
                  </button>
                )}
              </div>

              <Field label="Base Explanation (optional)">
                <textarea rows={3} value={draft.whyCorrect} onChange={(e) => setDraft({ ...draft, whyCorrect: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
              </Field>
            </div>
            <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button onClick={() => setDraft(null)} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">Cancel</button>
              <button onClick={save} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Save Question</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
