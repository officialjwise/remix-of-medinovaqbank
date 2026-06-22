import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Edit, Plus, Trash2, FileText, Upload, Eye, Power } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import type { Difficulty, ExamType } from "@/types";

export const Route = createFileRoute("/admin/banks")({
  head: () => ({ meta: [{ title: "Admin · Banks — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminBanks,
});

interface BankDraft {
  id?: string;
  name: string;
  subject: string;
  examType: ExamType;
  description: string;
  difficulty: Difficulty;
  isActive: boolean;
}

const emptyDraft: BankDraft = {
  name: "",
  subject: "Internal Medicine",
  examType: "USMLE",
  description: "",
  difficulty: "Intermediate",
  isActive: true,
};

const SUBJECTS = ["Internal Medicine", "Surgery", "OB/GYN", "Paediatrics", "Pharmacology", "Pathology", "Radiology", "Psychiatry", "Anatomy"];
const EXAM_TYPES: ExamType[] = ["USMLE", "PLAB", "MDCN", "MEDICAL COUNCIL", "GENERAL"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

function AdminBanks() {
  const [draft, setDraft] = useState<BankDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const onNew = () => setDraft({ ...emptyDraft });
  const onEdit = (id: string) => {
    const b = questionBanks.find((x) => x.id === id)!;
    setDraft({
      id: b.id,
      name: b.name,
      subject: b.subject,
      examType: b.examType,
      description: b.description,
      difficulty: b.difficulty,
      isActive: true,
    });
  };

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    toast.success(draft.id ? `Updated "${draft.name}"` : `Created "${draft.name}"`);
    setDraft(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Question Banks</h2>
          <p className="mt-1 text-sm text-muted-foreground">{questionBanks.length} banks · manage content & metadata</p>
        </div>
        <button onClick={onNew} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" /> New Bank
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[1.5fr_140px_120px_100px_120px_180px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Bank</span>
          <span>Subject</span>
          <span>Difficulty</span>
          <span className="text-right">Questions</span>
          <span className="text-right">Sessions</span>
          <span className="text-right">Actions</span>
        </div>
        {questionBanks.map((b) => (
          <div key={b.id} className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[1.5fr_140px_120px_100px_120px_180px] md:items-center md:gap-4">
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
              <Link to="/admin/banks/$bankId/questions" params={{ bankId: b.id }} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="View questions" title="Questions">
                <FileText className="h-4 w-4" />
              </Link>
              <Link to="/admin/banks/$bankId/upload" params={{ bankId: b.id }} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Bulk upload" title="Upload">
                <Upload className="h-4 w-4" />
              </Link>
              <button onClick={() => toast.success(`Toggled "${b.name}"`)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Toggle active" title="Toggle active">
                <Power className="h-4 w-4" />
              </button>
              <button onClick={() => onEdit(b.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Edit" title="Edit">
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => setConfirmDelete(b.id)} className="rounded-md p-1.5 text-error hover:bg-error-light" aria-label="Delete" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {draft && (
        <Modal title={draft.id ? "Edit Bank" : "Create Bank"} onClose={() => setDraft(null)}>
          <div className="space-y-4">
            <Field label="Name">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject">
                <select value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm">
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Exam Type">
                <select value={draft.examType} onChange={(e) => setDraft({ ...draft, examType: e.target.value as ExamType })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm">
                  {EXAM_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Difficulty">
                <select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm">
                  {DIFFICULTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm">
                  <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
                  <span>{draft.isActive ? "Active" : "Inactive"}</span>
                </label>
              </Field>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setDraft(null)} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">Cancel</button>
            <button onClick={save} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Save Bank</button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal title="Delete bank?" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the bank and all its questions. This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(null)} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">Cancel</button>
            <button onClick={() => { toast.success("Bank deleted"); setConfirmDelete(null); }} className="inline-flex h-10 items-center rounded-lg bg-error px-4 text-sm font-semibold text-white hover:bg-error/90">
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground">
            <Eye className="h-4 w-4 rotate-45" />
          </button>
        </header>
        <div className="p-5">{children}</div>
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
