import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flag, Eye, Check, Power, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export const Route = createFileRoute("/admin/flags")({
  head: () => ({
    meta: [
      { title: "Admin · Flagged Questions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminFlags,
});

type FlagType = "Incorrect Answer" | "Typo / Wording" | "Outdated" | "Ambiguous" | "Other";

interface FlagRow {
  id: string;
  questionId: string;
  bankName: string;
  stem: string;
  flagType: FlagType;
  note: string;
  user: string;
  email: string;
  date: string;
  status: "Open" | "Reviewed" | "Cleared";
}

const seed: FlagRow[] = [
  {
    id: "f-1",
    questionId: "q-im-014",
    bankName: "Internal Medicine Shelf",
    stem: "A 56-year-old man with crushing chest pain radiating to the left arm…",
    flagType: "Incorrect Answer",
    note: "Option B should be the correct answer based on STEMI localization for inferior leads.",
    user: "Akua Mensah",
    email: "akua@example.com",
    date: "2026-04-22",
    status: "Open",
  },
  {
    id: "f-2",
    questionId: "q-pharm-027",
    bankName: "Pharmacology Core",
    stem: "Which of the following is the mechanism of action of metformin?",
    flagType: "Typo / Wording",
    note: "Stem says 'metaformin' instead of 'metformin'.",
    user: "Kwame Boateng",
    email: "kwame@example.com",
    date: "2026-04-21",
    status: "Open",
  },
  {
    id: "f-3",
    questionId: "q-surgery-009",
    bankName: "Surgery Core",
    stem: "After a road traffic accident, a 34-year-old presents with…",
    flagType: "Ambiguous",
    note: "Two options could plausibly be correct.",
    user: "Adjoa Owusu",
    email: "adjoa@example.com",
    date: "2026-04-19",
    status: "Reviewed",
  },
  {
    id: "f-4",
    questionId: "q-paeds-031",
    bankName: "Paediatrics",
    stem: "Vaccination schedule recommended at age 9 months in Ghana…",
    flagType: "Outdated",
    note: "GHS schedule was updated in 2024.",
    user: "Esi Quaye",
    email: "esi@example.com",
    date: "2026-04-15",
    status: "Open",
  },
  {
    id: "f-5",
    questionId: "q-obgyn-022",
    bankName: "Obstetrics & Gynaecology",
    stem: "A 28-year-old G2P1 at 38 weeks GA presents with…",
    flagType: "Other",
    note: "Image is not loading on mobile.",
    user: "Yaw Asante",
    email: "yaw@example.com",
    date: "2026-04-12",
    status: "Cleared",
  },
];

const FLAG_TYPES: ("All" | FlagType)[] = [
  "All",
  "Incorrect Answer",
  "Typo / Wording",
  "Outdated",
  "Ambiguous",
  "Other",
];
const STATUSES = ["All", "Open", "Reviewed", "Cleared"] as const;

function AdminFlags() {
  const [rows, setRows] = useState<FlagRow[]>(seed);
  const [type, setType] = useState<(typeof FLAG_TYPES)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Open");
  const [details, setDetails] = useState<FlagRow | null>(null);
  const [deactivate, setDeactivate] = useState<FlagRow | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (type !== "All" && r.flagType !== type) return false;
        if (status !== "All" && r.status !== status) return false;
        return true;
      }),
    [rows, type, status],
  );

  const update = (id: string, patch: Partial<FlagRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Flagged Questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {rows.length} reports
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Type"
            value={type}
            onChange={(v) => setType(v as typeof type)}
            options={FLAG_TYPES}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={STATUSES as readonly string[]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <Check className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-base font-bold text-foreground">No flags match these filters</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try changing the type or status filter.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
                      <Flag className="h-3 w-3" /> {r.flagType}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{r.bankName}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {r.questionId}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-foreground">
                    {r.stem}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">"{r.note}"</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Reported by <span className="font-semibold text-foreground">{r.user}</span> ·{" "}
                    {r.date}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.status === "Open"
                      ? "bg-warning-light text-warning"
                      : r.status === "Reviewed"
                        ? "bg-accent/10 text-accent"
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
                {r.status !== "Cleared" && (
                  <button
                    onClick={() => {
                      update(r.id, { status: "Cleared" });
                      toast.success("Flag cleared");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
                  >
                    <Check className="h-3.5 w-3.5" /> Clear Flag
                  </button>
                )}
                <button
                  onClick={() => setDeactivate(r)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-error/30 bg-error-light/40 px-3 text-xs font-semibold text-error hover:bg-error-light"
                >
                  <Power className="h-3.5 w-3.5" /> Deactivate Question
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {details && (
        <DetailsModal
          row={details}
          onClose={() => setDetails(null)}
          onMarkReviewed={() => {
            update(details.id, { status: "Reviewed" });
            toast.success("Marked as reviewed");
            setDetails(null);
          }}
        />
      )}

      <ConfirmDialog
        open={deactivate !== null}
        title="Deactivate question?"
        description={
          deactivate ? (
            <>
              This will hide question <code className="font-mono">{deactivate.questionId}</code>{" "}
              from all users until it is reactivated.
            </>
          ) : null
        }
        confirmLabel="Deactivate"
        cancelLabel="Keep Active"
        variant="destructive"
        onConfirm={() => {
          if (!deactivate) return;
          update(deactivate.id, { status: "Reviewed" });
          toast.success("Question deactivated");
          setDeactivate(null);
        }}
        onCancel={() => setDeactivate(null)}
      />
    </div>
  );
}

function DetailsModal({
  row,
  onClose,
  onMarkReviewed,
}: {
  row: FlagRow;
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
              {row.flagType}
            </span>
            <span className="rounded-full bg-surface-alt px-2 py-0.5 font-mono text-muted-foreground">
              {row.questionId}
            </span>
            <span className="text-muted-foreground">{row.bankName}</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Question
            </p>
            <p className="mt-1 text-sm text-foreground">{row.stem}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Reporter Note
            </p>
            <p className="mt-1 rounded-lg border-l-4 border-warning bg-warning-light/40 p-3 text-sm text-foreground">
              "{row.note}"
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Reported By
              </p>
              <p className="mt-0.5 font-semibold text-foreground">{row.user}</p>
              <p className="text-xs text-muted-foreground">{row.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Date
              </p>
              <p className="mt-0.5 font-semibold text-foreground">{row.date}</p>
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
          {row.status === "Open" && (
            <button
              onClick={onMarkReviewed}
              className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
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
