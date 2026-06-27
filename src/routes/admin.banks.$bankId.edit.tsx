import { createFileRoute, Link, useNavigate, useParams, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Difficulty } from "@/types";
import { useExamTypes } from "@/api/exam-types.api";

export const Route = createFileRoute("/admin/banks/$bankId/edit")({
  head: () => ({
    meta: [{ title: "Admin · Edit Bank — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  loader: ({ params }) => {
    const bank = questionBanks.find((b) => b.id === params.bankId);
    if (!bank) throw notFound();
    return { bank };
  },
  component: EditBankPage,
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <p className="text-lg font-bold">Bank not found</p>
      <Link to="/admin/banks" className="mt-3 inline-block text-sm font-semibold text-accent">
        ← Back to Banks
      </Link>
    </div>
  ),
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
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

function EditBankPage() {
  const { bankId } = useParams({ from: "/admin/banks/$bankId/edit" });
  const navigate = useNavigate();
  const bank = questionBanks.find((b) => b.id === bankId)!;
  const { data: examTypes = [] } = useExamTypes();

  const [form, setForm] = useState({
    name: bank.name,
    subject: bank.subject,
    examType: bank.examType as string,
    description: bank.description,
    difficulty: bank.difficulty,
    isActive: true,
    isFree: bank.isFree,
    topics: bank.topics.join(", "),
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    if (!form.name.trim()) return toast.error("Name is required");
    toast.success(`Updated "${form.name}"`);
    navigate({ to: "/admin/banks" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/banks"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Banks
      </Link>

      <header className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Bank</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {bank.questionCount.toLocaleString()} questions · {bank.sessionsCount.toLocaleString()}{" "}
            sessions
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-error/30 bg-error-light/40 px-3 text-sm font-semibold text-error hover:bg-error-light"
        >
          <Trash2 className="h-4 w-4" /> Delete bank
        </button>
      </header>

      <section className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <Field label="Bank Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Exam Type">
            <select
              value={form.examType}
              onChange={(e) => setForm({ ...form, examType: e.target.value })}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {/* Preserve the bank's current value even if it isn't in the dynamic list. */}
              {form.examType && !examTypes.some((et) => et.name === form.examType) && (
                <option value={form.examType}>{form.examType}</option>
              )}
              {examTypes.map((et) => (
                <option key={et.id} value={et.name}>
                  {et.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>

        <Field label="Topics (comma-separated)">
          <input
            value={form.topics}
            onChange={(e) => setForm({ ...form, topics: e.target.value })}
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
              {DIFFICULTIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
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
          className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-bold text-white shadow-md"
        >
          <Save className="h-4 w-4" /> Save changes
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${bank.name}"?`}
        description="This will permanently remove the bank and all its questions. This action cannot be undone."
        variant="destructive"
        typedConfirmation="DELETE"
        confirmLabel="Delete bank"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          toast.success("Bank deleted");
          navigate({ to: "/admin/banks" });
        }}
      />
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
