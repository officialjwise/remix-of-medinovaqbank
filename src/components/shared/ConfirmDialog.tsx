import { ReactNode, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** If set, user must type this string to enable the confirm button. */
  typedConfirmation?: string;
  /** "destructive" colors the confirm button red. */
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  typedConfirmation,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const matched = !typedConfirmation || typed.trim() === typedConfirmation;
  const destructive = variant === "destructive";

  const handleConfirm = async () => {
    if (!matched) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
      setTyped("");
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    setTyped("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" role="dialog" aria-modal="true" onClick={handleCancel}>
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            {destructive && (
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-error-light text-error">
                <AlertTriangle className="h-5 w-5" />
              </span>
            )}
            <h3 className="mt-1 text-base font-bold text-foreground">{title}</h3>
          </div>
          <button onClick={handleCancel} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-4 px-5 py-4">
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
          {typedConfirmation && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                Type <code className="rounded bg-surface-alt px-1 font-mono text-foreground">{typedConfirmation}</code> to confirm.
              </span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={typedConfirmation}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                autoFocus
              />
            </label>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!matched || submitting}
            className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
              destructive
                ? "bg-error text-white hover:bg-error/90"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
            }`}
          >
            {submitting ? "Working…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
