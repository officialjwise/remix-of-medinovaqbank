import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { useState } from "react";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useExamTypes } from "@/api/exam-types.api";
import { useCategories } from "@/api/categories.api";
import { useCreateBank, toBackendDifficulty, type DisplayDifficulty } from "@/api/banks.api";

export const Route = createFileRoute("/admin/banks/create")({
  beforeLoad: () => requirePermission("question-banks.create"),
  head: () => ({
    meta: [
      { title: "Admin · Create Bank — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateBankPage,
});

const DIFFICULTIES: DisplayDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

function CreateBankPage() {
  const navigate = useNavigate();
  const { data: examTypes = [] } = useExamTypes();
  const { data: categories = [] } = useCategories();
  const createBank = useCreateBank();
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    examTypeIds: [] as string[],
    description: "",
    difficulty: "Intermediate" as DisplayDifficulty,
    isActive: true,
    isFree: false,
  });

  function toggleExamType(id: string) {
    setForm((f) => ({
      ...f,
      examTypeIds: f.examTypeIds.includes(id)
        ? f.examTypeIds.filter((x) => x !== id)
        : [...f.examTypeIds, id],
    }));
  }

  const saving = createBank.isPending;

  function save() {
    if (!form.name.trim()) {
      toast.error("Bank name is required");
      return;
    }
    if (!form.categoryId) {
      toast.error("Select a subject (category)");
      return;
    }
    if (form.examTypeIds.length === 0) {
      toast.error("Select at least one exam type");
      return;
    }
    createBank.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        examTypeIds: form.examTypeIds,
        difficulty: toBackendDifficulty(form.difficulty),
        // isFree (free preview) maps to NON-public; paid banks are public.
        isPublic: !form.isFree,
      },
      {
        onSuccess: (bank) => {
          toast.success(`Created "${bank.name}"`);
          navigate({ to: "/admin/banks" });
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create bank"),
      },
    );
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create New Question Bank
        </h2>
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

        <Field label="Subject (Category)" required>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm sm:max-w-xs"
          >
            <option value="" disabled>
              Select a category…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Exam Types <span className="text-error">*</span>
            </span>
            <Link
              to="/admin/exam-types"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              <Plus className="h-3 w-3" /> Add new exam type
            </Link>
          </div>
          {examTypes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-surface-alt/40 px-3 py-3 text-xs text-muted-foreground">
              No active exam types yet.{" "}
              <Link to="/admin/exam-types" className="font-semibold text-accent hover:underline">
                Create one first
              </Link>
              .
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {examTypes.map((et) => {
                const on = form.examTypeIds.includes(et.id);
                return (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => toggleExamType(et.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      on
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: et.color }} />
                    {et.name}
                  </button>
                );
              })}
            </div>
          )}
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

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm({ ...form, difficulty: e.target.value as DisplayDifficulty })
              }
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {DIFFICULTIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-error">*</span>}
      </span>
      {children}
    </label>
  );
}
