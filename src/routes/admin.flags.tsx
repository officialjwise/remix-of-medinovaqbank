import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { useState } from "react";
import { Flag, Eye, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useFlags, useReviewFlag, type FlagReview } from "@/api/flags.api";

export const Route = createFileRoute("/admin/flags")({
  beforeLoad: () => requirePermission("flags.read"),
  head: () => ({
    meta: [
      { title: "Admin · Flagged Questions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminFlags,
});

type StatusFilter = "Open" | "Reviewed" | "All";
const STATUSES: readonly StatusFilter[] = ["Open", "Reviewed", "All"];

/** Map the status filter to the backend `isReviewed` query param. */
function isReviewedFor(status: StatusFilter): boolean | undefined {
  if (status === "Open") return false;
  if (status === "Reviewed") return true;
  return undefined;
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function AdminFlags() {
  const [status, setStatus] = useState<StatusFilter>("Open");
  const [details, setDetails] = useState<FlagReview | null>(null);
  const [dismissTarget, setDismissTarget] = useState<FlagReview | null>(null);

  const { data, isLoading, isError, refetch } = useFlags({
    isReviewed: isReviewedFor(status),
  });
  const reviewMut = useReviewFlag();

  const rows = data?.items ?? [];

  const resolve = (id: string, action: "reviewed" | "cleared" | "dismissed") => {
    reviewMut.mutate(
      { id, action },
      {
        onSuccess: () => {
          const label =
            action === "cleared"
              ? "Flag cleared"
              : action === "dismissed"
                ? "Flag dismissed"
                : "Marked as reviewed";
          toast.success(label);
          setDetails(null);
          setDismissTarget(null);
        },
        onError: () => toast.error("Could not update flag"),
      },
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Flagged Questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${rows.length} report${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            options={STATUSES as readonly string[]}
          />
        </div>
      </div>

      {isError ? (
        <div className="mt-6 rounded-2xl border border-error/30 bg-error-light/40 p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-base font-bold text-foreground">Couldn't load flags</h3>
          <button
            onClick={() => void refetch()}
            className="mt-4 inline-flex h-9 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <Check className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-base font-bold text-foreground">No flags match this filter</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try a different status.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
                      <Flag className="h-3 w-3" /> Flag
                    </span>
                    {r.subject && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{r.subject}</span>
                      </>
                    )}
                    {r.questionId && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {r.questionId.slice(0, 8)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-foreground">
                    {r.stem || "(question unavailable)"}
                  </p>
                  {r.reason && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">"{r.reason}"</p>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Reported by <span className="font-semibold text-foreground">{r.userName}</span>{" "}
                    · {timeAgo(r.createdAt)}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.status === "Open"
                      ? "bg-warning-light text-warning"
                      : "bg-success-light text-success"
                  }`}
                >
                  {r.status}
                </span>
              </header>
              <footer className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                <button
                  onClick={() => setDetails(r)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
                >
                  <Eye className="h-3.5 w-3.5" /> Review
                </button>
                {!r.isReviewed && (
                  <>
                    <button
                      disabled={reviewMut.isPending}
                      onClick={() => resolve(r.id, "cleared")}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Clear Flag
                    </button>
                    <button
                      disabled={reviewMut.isPending}
                      onClick={() => setDismissTarget(r)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-error/30 bg-error-light/40 px-3 text-xs font-semibold text-error hover:bg-error-light disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> Dismiss
                    </button>
                  </>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      {details && (
        <DetailsModal
          row={details}
          pending={reviewMut.isPending}
          onClose={() => setDetails(null)}
          onMarkReviewed={() => resolve(details.id, "reviewed")}
        />
      )}

      <ConfirmDialog
        open={dismissTarget !== null}
        title="Dismiss this flag?"
        description={
          dismissTarget ? (
            <>
              This marks the flag reviewed without clearing the question's flagged banner. The
              question stays flagged for other reviewers.
            </>
          ) : null
        }
        confirmLabel="Dismiss"
        cancelLabel="Keep Open"
        variant="destructive"
        onConfirm={() => {
          if (dismissTarget) resolve(dismissTarget.id, "dismissed");
        }}
        onCancel={() => setDismissTarget(null)}
      />
    </div>
  );
}

function DetailsModal({
  row,
  pending,
  onClose,
  onMarkReviewed,
}: {
  row: FlagReview;
  pending: boolean;
  onClose: () => void;
  onMarkReviewed: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-foreground">Flag Details</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 font-bold uppercase tracking-wide text-warning">
              Flag
            </span>
            {row.questionId && (
              <span className="rounded-full bg-surface-alt px-2 py-0.5 font-mono text-muted-foreground">
                {row.questionId}
              </span>
            )}
            {row.subject && <span className="text-muted-foreground">{row.subject}</span>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Question
            </p>
            <p className="mt-1 text-sm text-foreground">{row.stem || "(question unavailable)"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Reporter Note
            </p>
            <p className="mt-1 rounded-lg border-l-4 border-warning bg-warning-light/40 p-3 text-sm text-foreground">
              {row.reason ? `"${row.reason}"` : "No note provided."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Reported By
              </p>
              <p className="mt-0.5 font-semibold text-foreground">{row.userName}</p>
              {row.userEmail && <p className="text-xs text-muted-foreground">{row.userEmail}</p>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Date
              </p>
              <p className="mt-0.5 font-semibold text-foreground">
                {new Date(row.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Close
          </button>
          {!row.isReviewed && (
            <button
              disabled={pending}
              onClick={onMarkReviewed}
              className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            >
              Mark as Reviewed
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium normal-case tracking-normal text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
