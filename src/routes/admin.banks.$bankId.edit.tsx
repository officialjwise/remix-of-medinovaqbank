import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useExamTypes } from "@/api/exam-types.api";
import { useCategories } from "@/api/categories.api";
import {
  useAdminBank,
  useUpdateBank,
  useDeleteBank,
  toBackendDifficulty,
  type DisplayDifficulty,
} from "@/api/banks.api";

export const Route = createFileRoute("/admin/banks/$bankId/edit")({
  beforeLoad: () => requirePermission("question-banks.update"),
  head: () => ({
    meta: [{ title: "Admin · Edit Bank — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: EditBankPage,
});

const DIFFICULTIES: DisplayDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

interface EditForm {
  name: string;
  categoryId: string;
  /** Selected exam-type name (single) — submitted as a one-element examTypeIds. */
  examType: string;
  description: string;
  difficulty: DisplayDifficulty;
  isActive: boolean;
  isFree: boolean;
}

function EditBankPage() {
  const { bankId } = useParams({ from: "/admin/banks/$bankId/edit" });
  const navigate = useNavigate();
  const { data: bank, isLoading, isError } = useAdminBank(bankId);
  const { data: examTypes = [] } = useExamTypes();
  const { data: categories = [] } = useCategories();
  const updateBank = useUpdateBank();
  const deleteBank = useDeleteBank();

  const [form, setForm] = useState<EditForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Hydrate the form once the bank loads.
  useEffect(() => {
    if (!bank) return;
    setForm({
      name: bank.name,
      categoryId: bank.categoryId,
      examType: bank.examType,
      description: bank.description,
      difficulty: bank.difficulty,
      isActive: bank.isActive,
      isFree: bank.isFree,
    });
  }, [bank]);

  if (isLoading || (!bank && !isError)) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-alt" />
        <div className="mt-6 h-96 animate-pulse rounded-2xl border border-border bg-surface-alt/40" />
      </div>
    );
  }

  if (isError || !bank || !form) {
    return (
      <div className="p-12 text-center">
        <p className="text-lg font-bold">Bank not found</p>
        <Link to="/admin/banks" className="mt-3 inline-block text-sm font-semibold text-accent">
          ← Back to Banks
        </Link>
      </div>
    );
  }

  function save() {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.categoryId) return toast.error("Select a subject (category)");
    // Map the single selected exam-type name back to its id (when resolvable).
    const matchedExamType = examTypes.find((et) => et.name === form.examType);
    updateBank.mutate(
      {
        id: bankId,
        input: {
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          difficulty: toBackendDifficulty(form.difficulty),
          isActive: form.isActive,
          // isFree (free preview) maps to NON-public; paid banks are public.
          isPublic: !form.isFree,
          // Only replace associations when we can resolve an id from the list.
          ...(matchedExamType ? { examTypeIds: [matchedExamType.id] } : {}),
        },
      },
      {
        onSuccess: (updated) => {
          toast.success(`Updated "${updated.name}"`);
          navigate({ to: "/admin/banks" });
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update bank"),
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

      <header className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Bank</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {bank.questionCount.toLocaleString()} questions
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
          <Field label="Subject (Category)">
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {/* Preserve the bank's current category even if it's inactive/missing from the list. */}
              {form.categoryId && !categories.some((c) => c.id === form.categoryId) && (
                <option value={form.categoryId}>{bank.subject}</option>
              )}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
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

        <div className="grid gap-5 sm:grid-cols-3">
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
          disabled={updateBank.isPending}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-bold text-white shadow-md disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {updateBank.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${bank.name}"?`}
        description="This will deactivate the bank so it no longer appears to learners. You can re-activate it later."
        variant="destructive"
        typedConfirmation="DELETE"
        confirmLabel="Delete bank"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteBank.mutate(bankId, {
            onSuccess: () => {
              toast.success("Bank deleted");
              navigate({ to: "/admin/banks" });
            },
            onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete bank"),
          });
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
