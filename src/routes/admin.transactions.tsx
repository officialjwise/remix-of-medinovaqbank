import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({
    meta: [
      { title: "Admin · Transactions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransactionsPage,
});

interface Tx {
  id: string;
  ref: string;
  user: string;
  email: string;
  amount: number;
  plan: string;
  status: "successful" | "pending" | "failed" | "refunded";
  channel: "card" | "mobile_money" | "bank";
  date: string;
}

const seed: Tx[] = Array.from({ length: 24 }, (_, i) => {
  const statuses: Tx["status"][] = [
    "successful",
    "successful",
    "successful",
    "successful",
    "pending",
    "failed",
    "refunded",
  ];
  const channels: Tx["channel"][] = ["card", "mobile_money", "bank"];
  const plans = ["Monthly", "3 Months", "6 Months", "12 Months"];
  const prices: Record<string, number> = {
    Monthly: 99,
    "3 Months": 249,
    "6 Months": 449,
    "12 Months": 799,
  };
  const plan = plans[i % plans.length];
  return {
    id: `tx-${i + 1}`,
    ref: `PSK_${(1700000000 + i * 12345).toString(36).toUpperCase()}`,
    user: ["Akua Mensah", "Kwame Owusu", "Ama Boateng", "Yaw Asante", "Esi Appiah"][i % 5],
    email: `user${i + 1}@example.gh`,
    amount: prices[plan],
    plan,
    status: statuses[i % statuses.length],
    channel: channels[i % channels.length],
    date: new Date(Date.now() - i * 18 * 3600 * 1000).toISOString(),
  };
});

const statusStyle: Record<Tx["status"], string> = {
  successful: "bg-success-light text-success",
  pending: "bg-warning-light text-warning",
  failed: "bg-error-light text-error",
  refunded: "bg-surface-alt text-muted-foreground",
};

function TransactionsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Tx["status"]>("all");

  const filtered = seed.filter(
    (t) =>
      (status === "all" || t.status === status) &&
      (query === "" ||
        t.ref.toLowerCase().includes(query.toLowerCase()) ||
        t.user.toLowerCase().includes(query.toLowerCase()) ||
        t.email.toLowerCase().includes(query.toLowerCase())),
  );

  const totalRevenue = seed
    .filter((t) => t.status === "successful")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All Paystack payment events. {seed.length} transactions tracked.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card
          label="Successful"
          value={`${seed.filter((t) => t.status === "successful").length}`}
          sub={`GHS ${totalRevenue.toLocaleString()}`}
        />
        <Card
          label="Pending"
          value={`${seed.filter((t) => t.status === "pending").length}`}
          sub="Awaiting confirmation"
        />
        <Card
          label="Failed / refunded"
          value={`${seed.filter((t) => t.status === "failed" || t.status === "refunded").length}`}
          sub="Manual review"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Reference, name, email…"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <button
          onClick={() => alert("CSV export — mock")}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
        >
          <Download className="h-4 w-4" /> Export CSV
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
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-surface-alt/50">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{t.ref}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{t.user}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">{t.plan}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">GHS {t.amount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.channel.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(t.date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No transactions match these filters.
          </p>
        )}
      </div>
    </div>
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
