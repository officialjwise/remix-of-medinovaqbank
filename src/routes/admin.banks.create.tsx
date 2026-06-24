import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import type { Difficulty, ExamType } from "@/types";

export const Route = createFileRoute("/admin/banks/create")({
  head: () => ({
    meta: [
      { title: "Admin · Create Bank — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateBankPage,
});

const SUBJECTS = [
  "Internal Medicine",
  "Surgery",
  "OB/GYN",
  "Paediatrics",
  "Pharmacology",
  "Pathology",
  "Radiology",
  "Psychiatry",
  "Anatomy",
];
const EXAM_TYPES: ExamType[] = ["USMLE", "PLAB", "MDCN", "MEDICAL COUNCIL", "GENERAL"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

function CreateBankPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    subject: "Internal Medicine",
    examType: "USMLE" as ExamType,
    description: "",
    difficulty: "Intermediate" as Difficulty,
    isActive: true,
    isFree: false,
    topics: "",
  });
  const [saving, setSaving] = useState(false);

  function save() {
    if (!form.name.trim()) {
      toast.error("Bank name is required");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      toast.success(`Created "${form.name}"`);
      navigate({ to: "/admin/banks" });
    }, 500);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/banks"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Banks
      </Link>

      <header className="mt-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create New Question Bank</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define the metadata for a new bank. You can add questions next via upload or manual entry.
        </p>
      </header>

      <section className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <Field label="Bank Name" required>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Cardiology Board Review"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Subject">
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Exam Type">
            <select
              value={form.examType}
              onChange={(e) => setForm({ ...form, examType: e.target.value as ExamType })}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {EXAM_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description shown on the bank card…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>

        <Field label="Topics (comma-separated)">
          <input
            value={form.topics}
            onChange={(e) => setForm({ ...form, topics: e.target.value })}
            placeholder="Cardiology, Pulmonology, Endocrinology"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {DIFFICULTIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span>{form.isActive ? "Active" : "Inactive"}</span>
            </label>
          </Field>
          <Field label="Access">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
              />
              <span>{form.isFree ? "Free preview" : "Paid"}</span>
            </label>
          </Field>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Link
          to="/admin/banks"
          className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
        >
          <X className="h-4 w-4" /> Cancel
        </Link>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-bold text-white shadow-md disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Create Bank"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-error">*</span>}
      </span>
      {children}
    </label>
  );
}