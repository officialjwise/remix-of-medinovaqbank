import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import type { Difficulty } from "@/types";

export const Route = createFileRoute("/admin/questions/create")({
  head: () => ({
    meta: [
      { title: "Admin · Create Question — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateQuestion,
});

const KEYS = ["A", "B", "C", "D", "E"] as const;
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

function CreateQuestion() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bankId: questionBanks[0]?.id ?? "",
    topic: "",
    difficulty: "Intermediate" as Difficulty,
    stem: "",
    options: { A: "", B: "", C: "", D: "", E: "" } as Record<string, string>,
    correctKey: "A",
    whyCorrect: "",
    whyWrong: { A: "", B: "", C: "", D: "", E: "" } as Record<string, string>,
    keyPoint: "",
  });

  function save() {
    if (!form.stem.trim()) return toast.error("Question stem is required");
    if (Object.values(form.options).filter((o) => o.trim()).length < 2)
      return toast.error("Add at least two options");
    toast.success("Question created");
    navigate({ to: "/admin/questions" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/questions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Questions
      </Link>

      <header className="mt-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Question</h2>
      </header>

      <section className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Bank">
            <select
              value={form.bankId}
              onChange={(e) => setForm({ ...form, bankId: e.target.value })}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {questionBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Topic">
            <input
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g. Cardiology"
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {DIFFICULTIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Question stem">
          <textarea
            rows={5}
            value={form.stem}
            onChange={(e) => setForm({ ...form, stem: e.target.value })}
            placeholder="Clinical vignette…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>

        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Options · select the correct answer
          </span>
          <div className="space-y-2">
            {KEYS.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface font-bold">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correctKey === k}
                    onChange={() => setForm({ ...form, correctKey: k })}
                    className="sr-only"
                  />
                  <span className={form.correctKey === k ? "text-success" : ""}>{k}</span>
                </label>
                <input
                  value={form.options[k]}
                  onChange={(e) =>
                    setForm({ ...form, options: { ...form.options, [k]: e.target.value } })
                  }
                  placeholder={`Option ${k}`}
                  className="h-11 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            ))}
          </div>
        </div>

        <Field label="Why the correct answer is correct">
          <textarea
            rows={3}
            value={form.whyCorrect}
            onChange={(e) => setForm({ ...form, whyCorrect: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>

        <Field label="Clinical pearl / key point">
          <input
            value={form.keyPoint}
            onChange={(e) => setForm({ ...form, keyPoint: e.target.value })}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>
      </section>

      <div className="mt-6 flex justify-end gap-2">
        <Link to="/admin/questions" className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">
          <X className="h-4 w-4" /> Cancel
        </Link>
        <button
          onClick={save}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-bold text-white shadow-md"
        >
          <Save className="h-4 w-4" /> Create Question
        </button>
      </div>
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