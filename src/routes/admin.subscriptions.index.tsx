import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, MoreHorizontal, X, Calendar, Ban } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export const Route = createFileRoute("/admin/subscriptions/")({
  head: () => ({
    meta: [
      { title: "Admin · Subscriptions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSubscriptions,
});

interface SubRow {
  id: string;
  user: string;
  email: string;
  plan: "Monthly" | "3 Months" | "6 Months" | "12 Months";
  amount: number;
  start: string;
  end: string;
  status: "Active" | "Cancelled" | "Refunded" | "Failed" | "Expired";
  ref: string;
}

const seed: SubRow[] = [
  {
    id: "p-1",
    user: "Akua Mensah",
    email: "akua@example.com",
    plan: "12 Months",
    amount: 799,
    start: "2025-12-01",
    end: "2026-12-01",
    status: "Active",
    ref: "PSK-9F2A1B",
  },
  {
    id: "p-2",
    user: "Kwame Boateng",
    email: "kwame@example.com",
    plan: "Monthly",
    amount: 129,
    start: "2026-04-22",
    end: "2026-05-22",
    status: "Active",
    ref: "PSK-7C8E33",
  },
  {
    id: "p-3",
    user: "Adjoa Owusu",
    email: "adjoa@example.com",
    plan: "3 Months",
    amount: 299,
    start: "2026-03-15",
    end: "2026-06-15",
    status: "Active",
    ref: "PSK-AA901D",
  },
  {
    id: "p-4",
    user: "Kofi Adu",
    email: "kofi@example.com",
    plan: "6 Months",
    amount: 499,
    start: "2025-11-04",
    end: "2026-05-04",
    status: "Refunded",
    ref: "PSK-2D77E1",
  },
  {
    id: "p-5",
    user: "Esi Quaye",
    email: "esi@example.com",
    plan: "Monthly",
    amount: 129,
    start: "2026-04-09",
    end: "2026-05-09",
    status: "Failed",
    ref: "PSK-1F4422",
  },
  {
    id: "p-6",
    user: "Nana Appiah",
    email: "nana@example.com",
    plan: "12 Months",
    amount: 799,
    start: "2025-07-15",
    end: "2026-07-15",
    status: "Active",
    ref: "PSK-3B11C2",
  },
  {
    id: "p-7",
    user: "Yaw Asante",
    email: "yaw@example.com",
    plan: "3 Months",
    amount: 299,
    start: "2026-02-10",
    end: "2026-05-10",
    status: "Cancelled",
    ref: "PSK-8E55F0",
  },
  {
    id: "p-8",
    user: "Efua Asare",
    email: "efua@example.com",
    plan: "Monthly",
    amount: 129,
    start: "2026-04-01",
    end: "2026-05-01",
    status: "Active",
    ref: "PSK-44A0B7",
  },
];

const PLANS = ["All", "Monthly", "3 Months", "6 Months", "12 Months"] as const;
const STATUSES = ["All", "Active", "Cancelled", "Refunded", "Failed", "Expired"] as const;

function AdminSubscriptions() {
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<SubRow[]>(seed);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (plan !== "All" && r.plan !== plan) return false;
      if (status !== "All" && r.status !== status) return false;
      if (from && r.start < from) return false;
      if (to && r.start > to) return false;
      return true;
    });
  }, [rows, plan, status, from, to]);

  const now = new Date();
  const thisMonth = filtered
    .filter(
      (r) =>
        r.status === "Active" &&
        new Date(r.start).getMonth() === now.getMonth() &&
        new Date(r.start).getFullYear() === now.getFullYear(),
    )
    .reduce((a, r) => a + r.amount, 0);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = filtered
    .filter(
      (r) =>
        r.status === "Active" &&
        new Date(r.start).getMonth() === lastMonthDate.getMonth() &&
        new Date(r.start).getFullYear() === lastMonthDate.getFullYear(),
    )
    .reduce((a, r) => a + r.amount, 0);
  const allTime = filtered.filter((r) => r.status !== "Failed").reduce((a, r) => a + r.amount, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Subscriptions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {rows.length} transactions
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <RevenueCard label="This month" value={thisMonth} />
        <RevenueCard label="Last month" value={lastMonth} />
        <RevenueCard label="All time" value={allTime} accent />
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <FilterSelect
          label="Plan"
          value={plan}
          onChange={(v) => setPlan(v as typeof plan)}
          options={PLANS as readonly string[]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={STATUSES as readonly string[]}
        />
        <FilterDate label="From" value={from} onChange={setFrom} />
        <FilterDate label="To" value={to} onChange={setTo} />
        {(plan !== "All" || status !== "All" || from || to) && (
          <button
            type="button"
            onClick={() => {
              setPlan("All");
              setStatus("All");
              setFrom("");
              setTo("");
            }}
            className="ml-auto inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[1.5fr_120px_100px_110px_110px_110px_140px_60px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>User</span>
          <span>Plan</span>
          <span className="text-right">Amount</span>
          <span>Start</span>
          <span>End</span>
          <span>Status</span>
          <span>Reference</span>
          <span></span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((s) => (
            <SubscriptionRow
              key={s.id}
              row={s}
              onUpdate={(updated) =>
                setRows((rs) => rs.map((r) => (r.id === updated.id ? updated : r)))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function SubscriptionRow({ row, onUpdate }: { row: SubRow; onUpdate: (r: SubRow) => void }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [override, setOverride] = useState(false);
  const [cancel, setCancel] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[1.5fr_120px_100px_110px_110px_110px_140px_60px] md:items-center md:gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{row.user}</p>
        <p className="truncate text-xs text-muted-foreground">{row.email}</p>
      </div>
      <span className="text-sm text-foreground">{row.plan}</span>
      <span className="text-right font-mono text-sm font-bold tabular-nums text-foreground">
        GHS {row.amount}
      </span>
      <span className="text-xs text-muted-foreground">{row.start}</span>
      <span className="text-xs text-muted-foreground">{row.end}</span>
      <span>
        <StatusPill status={row.status} />
      </span>
      <span className="font-mono text-xs text-muted-foreground">{row.ref}</span>
      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          aria-label="Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
              <MenuItem
                icon={<Eye className="h-4 w-4" />}
                label="View Details"
                onClick={() => {
                  setDetails(true);
                  setOpen(false);
                }}
              />
              <MenuItem
                icon={<Calendar className="h-4 w-4" />}
                label="Override End Date"
                onClick={() => {
                  setOverride(true);
                  setOpen(false);
                }}
              />
              {row.status === "Active" && (
                <MenuItem
                  icon={<Ban className="h-4 w-4" />}
                  label="Cancel Subscription"
                  destructive
                  onClick={() => {
                    setCancel(true);
                    setOpen(false);
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>

      {details && <DetailsModal row={row} onClose={() => setDetails(false)} />}
      {override && (
        <OverrideEndDateModal
          row={row}
          onClose={() => setOverride(false)}
          onSave={(end) => {
            onUpdate({ ...row, end });
            toast.success("End date updated");
            setOverride(false);
          }}
        />
      )}
      <ConfirmDialog
        open={cancel}
        title="Cancel this subscription?"
        description={
          <>
            This will end <span className="font-semibold text-foreground">{row.user}</span>'s plan{" "}
            <span className="font-semibold text-foreground">{row.plan}</span> immediately.
          </>
        }
        confirmLabel="Cancel Subscription"
        cancelLabel="Keep Active"
        variant="destructive"
        typedConfirmation="CANCEL"
        onConfirm={() => {
          onUpdate({ ...row, status: "Cancelled" });
          toast.success("Subscription cancelled");
          setCancel(false);
        }}
        onCancel={() => setCancel(false)}
      />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt ${destructive ? "text-error" : "text-foreground"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: SubRow["status"] }) {
  const cls =
    status === "Active"
      ? "bg-success-light text-success"
      : status === "Cancelled"
        ? "bg-warning-light text-warning"
        : status === "Refunded"
          ? "bg-warning-light text-warning"
          : status === "Expired"
            ? "bg-surface-alt text-muted-foreground"
            : "bg-error-light text-error";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function RevenueCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 ${accent ? "border-accent/40 bg-accent/5" : "border-border bg-surface"}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        <span className="text-xs font-semibold text-muted-foreground">GHS </span>
        {value.toLocaleString()}
      </p>
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
    <label className="flex flex-col text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium normal-case tracking-normal text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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

function FilterDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium normal-case tracking-normal text-foreground"
      />
    </label>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-16 text-center">
      <p className="text-sm text-muted-foreground">No transactions match your filters.</p>
    </div>
  );
}

function DetailsModal({ row, onClose }: { row: SubRow; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-foreground">Subscription Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-2 p-5 text-sm">
          <DetailRow label="User" value={row.user} />
          <DetailRow label="Email" value={row.email} />
          <DetailRow label="Plan" value={row.plan} />
          <DetailRow label="Amount" value={`GHS ${row.amount}`} />
          <DetailRow label="Start" value={row.start} />
          <DetailRow label="End" value={row.end} />
          <DetailRow label="Status" value={row.status} />
          <DetailRow label="Paystack Ref" value={row.ref} mono />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border pb-1.5 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function OverrideEndDateModal({
  row,
  onClose,
  onSave,
}: {
  row: SubRow;
  onClose: () => void;
  onSave: (end: string) => void;
}) {
  const [end, setEnd] = useState(row.end);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-foreground">Override end date</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">
            {row.user} · {row.plan}
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              New end date
            </span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            />
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(end)}
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
}
