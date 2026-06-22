import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/subscriptions")({
  head: () => ({ meta: [{ title: "Admin · Subscriptions — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminSubscriptions,
});

const subs = [
  { id: "p-1", user: "Akua Mensah", email: "akua@example.com", plan: "12 Months", amount: 799, status: "Active", date: "2025-12-01", ref: "PSK-9F2A1B" },
  { id: "p-2", user: "Kwame Boateng", email: "kwame@example.com", plan: "Monthly", amount: 129, status: "Active", date: "2026-02-22", ref: "PSK-7C8E33" },
  { id: "p-3", user: "Adjoa Owusu", email: "adjoa@example.com", plan: "3 Months", amount: 299, status: "Active", date: "2026-03-15", ref: "PSK-AA901D" },
  { id: "p-4", user: "Kofi Adu", email: "kofi@example.com", plan: "6 Months", amount: 499, status: "Refunded", date: "2025-11-04", ref: "PSK-2D77E1" },
  { id: "p-5", user: "Esi Quaye", email: "esi@example.com", plan: "Monthly", amount: 129, status: "Failed", date: "2026-04-09", ref: "PSK-1F4422" },
];

function AdminSubscriptions() {
  const total = subs.filter((s) => s.status === "Active").reduce((acc, s) => acc + s.amount, 0);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Subscriptions</h2>
          <p className="mt-1 text-sm text-muted-foreground">All Paystack transactions and active plans</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Active MRR</p>
          <p className="text-lg font-bold tracking-tight text-foreground">GHS {total.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[1.5fr_140px_120px_120px_140px_120px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>User</span>
          <span>Plan</span>
          <span className="text-right">Amount</span>
          <span>Date</span>
          <span>Reference</span>
          <span>Status</span>
        </div>
        {subs.map((s) => (
          <div key={s.id} className="grid grid-cols-1 gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[1.5fr_140px_120px_120px_140px_120px] md:items-center md:gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{s.user}</p>
              <p className="truncate text-xs text-muted-foreground">{s.email}</p>
            </div>
            <span className="text-sm text-foreground">{s.plan}</span>
            <span className="text-right font-mono text-sm font-bold tabular-nums text-foreground">GHS {s.amount}</span>
            <span className="text-xs text-muted-foreground">{s.date}</span>
            <span className="font-mono text-xs text-muted-foreground">{s.ref}</span>
            <span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                s.status === "Active" ? "bg-success-light text-success" :
                s.status === "Refunded" ? "bg-warning-light text-warning" : "bg-error-light text-error"
              }`}>{s.status}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
