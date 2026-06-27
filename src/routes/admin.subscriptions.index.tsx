import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, MoreHorizontal, X, Calendar, Ban } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useAdminSubscriptions,
  useCancelSubscription,
  useExtendSubscription,
  PLAN_LABELS,
  type AdminSubscription,
  type BackendSubscriptionPlan,
  type BackendSubscriptionStatus,
} from "@/api/admin-subscriptions.api";

export const Route = createFileRoute("/admin/subscriptions/")({
  head: () => ({
    meta: [
      { title: "Admin · Subscriptions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSubscriptions,
});

const PLAN_OPTIONS: Array<{ value: "All" | BackendSubscriptionPlan; label: string }> = [
  { value: "All", label: "All" },
  { value: "monthly", label: "Monthly" },
  { value: "three_months", label: "3 Months" },
  { value: "six_months", label: "6 Months" },
  { value: "twelve_months", label: "12 Months" },
  { value: "free_trial", label: "Free Trial" },
];

const STATUS_OPTIONS: Array<{ value: "All" | BackendSubscriptionStatus; label: string }> = [
  { value: "All", label: "All" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

function AdminSubscriptions() {
  const [plan, setPlan] = useState<"All" | BackendSubscriptionPlan>("All");
  const [status, setStatus] = useState<"All" | BackendSubscriptionStatus>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, isError, error } = useAdminSubscriptions({
    plan: plan === "All" ? undefined : plan,
    status: status === "All" ? undefined : status,
    limit: 100,
  });

  const rows = useMemo(() => data?.subscriptions ?? [], [data]);

  // Date filtering is client-side (the query DTO has no date range).
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const startDay = r.startDate.slice(0, 10);
      if (from && startDay < from) return false;
      if (to && startDay > to) return false;
      return true;
    });
  }, [rows, from, to]);

  const now = new Date();
  const billable = (r: AdminSubscription) =>
    r.status === "active" || r.status === "expired" || r.status === "cancelled";
  const thisMonth = filtered
    .filter(
      (r) =>
        billable(r) &&
        new Date(r.startDate).getMonth() === now.getMonth() &&
        new Date(r.startDate).getFullYear() === now.getFullYear(),
    )
    .reduce((a, r) => a + r.amountPaid, 0);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = filtered
    .filter(
      (r) =>
        billable(r) &&
        new Date(r.startDate).getMonth() === lastMonthDate.getMonth() &&
        new Date(r.startDate).getFullYear() === lastMonthDate.getFullYear(),
    )
    .reduce((a, r) => a + r.amountPaid, 0);
  const allTime = filtered.reduce((a, r) => a + r.amountPaid, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Subscriptions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {data?.total ?? rows.length} subscriptions
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
          options={PLAN_OPTIONS}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={STATUS_OPTIONS}
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
        <div className="hidden grid-cols-[1.6fr_120px_100px_110px_110px_110px_60px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>User</span>
          <span>Plan</span>
          <span className="text-right">Amount</span>
          <span>Start</span>
          <span>End</span>
          <span>Status</span>
          <span></span>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((s) => <SubscriptionRow key={s.id} row={s} />)
        )}
      </div>
    </div>
  );
}

function SubscriptionRow({ row }: { row: AdminSubscription }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [extend, setExtend] = useState(false);
  const [cancel, setCancel] = useState(false);

  const cancelMut = useCancelSubscription();
  const extendMut = useExtendSubscription();

  const isCancellable = row.status === "active" || row.status === "trial";

  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[1.6fr_120px_100px_110px_110px_110px_60px] md:items-center md:gap-4">
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-semibold text-foreground">{row.userId}</p>
        <p className="truncate text-[11px] text-muted-foreground">User ID</p>
      </div>
      <span className="text-sm text-foreground">{row.planLabel}</span>
      <span className="text-right font-mono text-sm font-bold tabular-nums text-foreground">
        {row.currency} {row.amountPaid}
      </span>
      <span className="text-xs text-muted-foreground">{row.startDate.slice(0, 10)}</span>
      <span className="text-xs text-muted-foreground">{row.endDate.slice(0, 10)}</span>
      <span>
        <StatusPill status={row.status} label={row.statusLabel} />
      </span>
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
                label="Extend Subscription"
                onClick={() => {
                  setExtend(true);
                  setOpen(false);
                }}
              />
              {isCancellable && (
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
      {extend && (
        <ExtendModal
          row={row}
          busy={extendMut.isPending}
          onClose={() => setExtend(false)}
          onSave={(days, reason) => {
            extendMut.mutate(
              { id: row.id, input: { days, reason: reason || undefined } },
              {
                onSuccess: () => {
                  toast.success("Subscription extended");
                  setExtend(false);
                },
                onError: (e) => toast.error((e as Error).message),
              },
            );
          }}
        />
      )}
      <ConfirmDialog
        open={cancel}
        title="Cancel this subscription?"
        description={
          <>
            This will end this user's{" "}
            <span className="font-semibold text-foreground">{row.planLabel}</span> plan immediately.
          </>
        }
        confirmLabel="Cancel Subscription"
        cancelLabel="Keep Active"
        variant="destructive"
        typedConfirmation="CANCEL"
        onConfirm={() => {
          cancelMut.mutate(row.id, {
            onSuccess: () => {
              toast.success("Subscription cancelled");
              setCancel(false);
            },
            onError: (e) => toast.error((e as Error).message),
          });
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

function StatusPill({ status, label }: { status: BackendSubscriptionStatus; label: string }) {
  const cls =
    status === "active"
      ? "bg-success-light text-success"
      : status === "trial"
        ? "bg-accent/10 text-accent"
        : status === "cancelled"
          ? "bg-warning-light text-warning"
          : "bg-surface-alt text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
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
  options: ReadonlyArray<{ value: string; label: string }>;
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
          <option key={o.value} value={o.value}>
            {o.label}
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

function LoadingState() {
  return (
    <div className="px-5 py-16 text-center">
      <p className="text-sm text-muted-foreground">Loading subscriptions…</p>
    </div>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="px-5 py-16 text-center">
      <p className="text-sm text-error">{message ?? "Failed to load subscriptions."}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-16 text-center">
      <p className="text-sm text-muted-foreground">No subscriptions match your filters.</p>
    </div>
  );
}

function DetailsModal({ row, onClose }: { row: AdminSubscription; onClose: () => void }) {
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
          <DetailRow label="User ID" value={row.userId} mono />
          <DetailRow label="Plan" value={row.planLabel} />
          <DetailRow label="Amount" value={`${row.currency} ${row.amountPaid}`} />
          <DetailRow label="Start" value={row.startDate.slice(0, 10)} />
          <DetailRow label="End" value={row.endDate.slice(0, 10)} />
          <DetailRow label="Days remaining" value={String(row.daysRemaining)} />
          <DetailRow label="Status" value={row.statusLabel} />
          {row.cancelledAt && (
            <DetailRow label="Cancelled at" value={row.cancelledAt.slice(0, 10)} />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-1.5 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`truncate text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ExtendModal({
  row,
  busy,
  onClose,
  onSave,
}: {
  row: AdminSubscription;
  busy: boolean;
  onClose: () => void;
  onSave: (days: number, reason: string) => void;
}) {
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState("");
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
          <h3 className="text-base font-bold text-foreground">Extend subscription</h3>
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
            {row.planLabel} · ends {row.endDate.slice(0, 10)}
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Days to add
            </span>
            <input
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 0))}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Reason (optional)
            </span>
            <input
              type="text"
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
            disabled={busy}
            onClick={() => onSave(days, reason)}
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
