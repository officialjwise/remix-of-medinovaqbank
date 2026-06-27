import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useTransactions,
  exportTransactionsCsv,
  type BackendPaymentStatus,
  type TransactionVM,
} from "@/api/transactions.api";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({
    meta: [
      { title: "Admin · Transactions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransactionsPage,
});

const statusStyle: Record<BackendPaymentStatus, string> = {
  success: "bg-success-light text-success",
  pending: "bg-warning-light text-warning",
  failed: "bg-error-light text-error",
};

const STATUS_LABEL: Record<BackendPaymentStatus, string> = {
  success: "Successful",
  pending: "Pending",
  failed: "Failed",
};

function TransactionsPage() {
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebounce(rawQuery, 250);
  const [status, setStatus] = useState<"all" | BackendPaymentStatus>("all");
  const [exporting, setExporting] = useState(false);

  const params = useMemo(
    () => ({
      search: query || undefined,
      status: status === "all" ? undefined : status,
      limit: 100,
    }),
    [query, status],
  );

  const { data, isLoading, isError, error } = useTransactions(params);
  const transactions = data?.transactions ?? [];

  const summary = useMemo(() => {
    const successful = transactions.filter((t) => t.status === "success");
    return {
      successCount: successful.length,
      revenue: successful.reduce((s, t) => s + Number(t.amount), 0),
      pending: transactions.filter((t) => t.status === "pending").length,
      failed: transactions.filter((t) => t.status === "failed").length,
    };
  }, [transactions]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportTransactionsCsv(params);
      toast.success("Transactions exported to CSV");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All Paystack payment events.{" "}
          {data ? `${data.total.toLocaleString()} transactions tracked.` : "Loading…"}
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card
          label="Successful"
          value={`${summary.successCount}`}
          sub={`GHS ${summary.revenue.toLocaleString()}`}
        />
        <Card label="Pending" value={`${summary.pending}`} sub="Awaiting confirmation" />
        <Card label="Failed" value={`${summary.failed}`} sub="Manual review" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Reference or email…"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="success">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Reference</th>
                <th className="px-4 py-3 text-left font-bold">User</th>
                <th className="px-4 py-3 text-left font-bold">Plan</th>
                <th className="px-4 py-3 text-right font-bold">Amount</th>
                <th className="px-4 py-3 text-left font-bold">Channel</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading transactions…</p>
        )}
        {isError && (
          <p className="py-12 text-center text-sm text-error">
            {error instanceof Error ? error.message : "Failed to load transactions."}
          </p>
        )}
        {!isLoading && !isError && transactions.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No transactions match these filters.
          </p>
        )}
      </div>
    </div>
  );
}

function TxRow({ tx }: { tx: TransactionVM }) {
  return (
    <tr className="hover:bg-surface-alt/50">
      <td className="px-4 py-3 font-mono text-xs text-foreground">{tx.reference}</td>
      <td className="px-4 py-3">
        <p className="font-semibold text-foreground">{tx.userName}</p>
        <p className="text-xs text-muted-foreground">{tx.userEmail}</p>
      </td>
      <td className="px-4 py-3 text-foreground">{tx.planLabel}</td>
      <td className="px-4 py-3 text-right font-bold text-foreground">
        {tx.currency} {Number(tx.amount).toLocaleString()}
      </td>
      <td className="px-4 py-3 capitalize text-muted-foreground">{tx.channelLabel}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle[tx.status]}`}
        >
          {STATUS_LABEL[tx.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(tx.createdAt).toLocaleString()}
      </td>
    </tr>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
