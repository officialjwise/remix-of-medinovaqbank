import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Admin · Analytics — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminAnalytics,
});

const dau = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  v: 320 + Math.round(Math.sin(i / 2) * 60 + i * 8),
}));
const conversion = [
  { name: "Trial → Paid", v: 22 },
  { name: "Monthly → Quarterly", v: 14 },
  { name: "Quarterly → 6m+", v: 9 },
];

function AdminAnalytics() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Analytics</h2>
      <p className="mt-1 text-sm text-muted-foreground">Engagement, retention, and conversion across the cohort.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Daily Active Users (last 14 days)">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={dau}>
                <CartesianGrid stroke="hsl(var(--border))" />
                <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Conversion Rates (%)">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={conversion} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={150} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="v" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
