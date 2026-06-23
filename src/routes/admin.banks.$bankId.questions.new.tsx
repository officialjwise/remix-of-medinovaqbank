import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { getQuestionsForBank } from "@/data/questions";
import type { Difficulty, QuestionOption } from "@/types";

const OPT_KEYS = ["A", "B", "C", "D", "E"] as const;
type OptKey = (typeof OPT_KEYS)[number];

interface QuestionDraft {
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

export const Route = createFileRoute("/admin/banks/$bankId/questions/new")({
  head: () => ({ meta: [{ title: "Admin · New Question — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: NewQuestionPage,
});

function NewQuestionPage() {
  const { bankId } = useParams({ from: "/admin/banks/$bankId/questions/new" });
  return <QuestionEditor bankId={bankId} initial={empty()} mode="new" />;
}

export function QuestionEditor({
  bankId,
  initial,
  mode,
}: {
  bankId: string;
  initial: QuestionDraft;
  mode: "new" | "edit";
}) {
  const navigate = useNavigate();
  const bank = questionBanks.find((b) => b.id === bankId);
  const [draft, setDraft] = useState<QuestionDraft>(initial);
  const [tagInput, setTagInput] = useState("");

  const valid = useMemo(
    () =>
      !!draft.stem.trim() &&
      draft.options.every((o) => o.text.trim()) &&
      !!draft.options.find((o) => o.key === draft.correctKey),
    [draft],
  );

  function save() {
    if (!valid) {
      toast.error("Please fill the stem, every option, and mark a correct answer.");
      return;
    }
    toast.success(mode === "new" ? "Question created" : "Question updated");
    navigate({ to: "/admin/banks/$bankId/questions", params: { bankId } });
  }

  function addOption() {
    if (draft.options.length >= 5) return;
    setDraft({ ...draft, options: [...draft.options, { key: OPT_KEYS[draft.options.length], text: "" }] });
  }

  function removeOption(key: OptKey) {
    if (draft.options.length <= 2) return;
    const filtered = draft.options.filter((o) => o.key !== key).map((o, i) => ({ ...o, key: OPT_KEYS[i] }));
    setDraft({
      ...draft,
      options: filtered,
      correctKey: draft.correctKey === key ? filtered[0].key : draft.correctKey,
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/banks/$bankId/questions" params={{ bankId }} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to questions
      </Link>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {mode === "new" ? "Add a new question" : "Edit question"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{bank?.name ?? "Question bank"}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <Field label="Question stem">
            <textarea
              rows={5}
              value={draft.stem}
              onChange={(e) => setDraft({ ...draft, stem: e.target.value })}
              placeholder="A 45-year-old man presents with…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>

          <Field label="Image URL (optional)">
            <input
              value={draft.imageUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
              placeholder="https://…"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Options
            </span>
            <div className="space-y-2">
              {draft.options.map((o) => (
                <div key={o.key} className="flex items-center gap-2">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-surface-alt text-sm font-bold text-foreground">
                    {o.key}
                  </span>
                  <input
                    value={o.text}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        options: draft.options.map((x) => (x.key === o.key ? { ...x, text: e.target.value } : x)),
                      })
                    }
                    className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
                  />
                  <label className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <input
                      type="radio"
                      name="correct"
                      checked={draft.correctKey === o.key}
                      onChange={() => setDraft({ ...draft, correctKey: o.key })}
                    />
                    Correct
                  </label>
                  {draft.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(o.key)} className="rounded-md p-1.5 text-error hover:bg-error-light">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {draft.options.length < 5 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Add option
              </button>
            )}
          </div>

          <Field label="Explanation">
            <textarea
              rows={4}
              value={draft.whyCorrect}
              onChange={(e) => setDraft({ ...draft, whyCorrect: e.target.value })}
              placeholder="Explain why the correct answer is right…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Metadata</h3>
            <div className="mt-3 space-y-3">
              <Field label="Difficulty">
                <select
                  value={draft.difficulty}
                  onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm"
                >
                  {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Topic">
                <input
                  value={draft.topic}
                  onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                  placeholder="e.g. Acid-base"
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                />
              </Field>
              <Field label="Tags">
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-2">
                  {draft.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      {t}
                      <button type="button" onClick={() => setDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) })}>×</button>
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
                    placeholder="Add tag…"
                    className="flex-1 min-w-[6rem] bg-transparent text-sm outline-none"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <button
              type="button"
              onClick={save}
              disabled={!valid}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode === "new" ? "Create question" : "Save changes"}
            </button>
            <Link
              to="/admin/banks/$bankId/questions"
              params={{ bankId }}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              Cancel
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
