import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CreditCard, Library, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin · Dashboard — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

const signups = [
  { d: "Mon", v: 24 }, { d: "Tue", v: 31 }, { d: "Wed", v: 28 }, { d: "Thu", v: 42 },
  { d: "Fri", v: 38 }, { d: "Sat", v: 47 }, { d: "Sun", v: 53 },
];
const revenue = [
  { d: "Wk 1", v: 8200 }, { d: "Wk 2", v: 9400 }, { d: "Wk 3", v: 11200 },
  { d: "Wk 4", v: 12800 }, { d: "Wk 5", v: 14100 },
];

function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Overview</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Real-time metrics across users, content, and revenue.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total Users" value="3,482" trend="+12% MoM" icon={<Users className="h-4 w-4" />} />
        <Stat label="Active Subs" value="1,254" trend="+8% MoM" icon={<CreditCard className="h-4 w-4" />} accent="text-success" />
        <Stat label="Question Banks" value="9" trend="+2 new" icon={<Library className="h-4 w-4" />} />
        <Stat label="MRR" value="GHS 312,460" trend="+14% MoM" icon={<TrendingUp className="h-4 w-4" />} accent="text-accent" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Signups (last 7 days)">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={signups}>
                <CartesianGrid stroke="hsl(var(--border))" />
                <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Bar dataKey="v" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Revenue (GHS, last 5 weeks)">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={revenue}>
                <CartesianGrid stroke="hsl(var(--border))" />
                <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => `GHS ${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="v" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, trend, icon, accent = "text-foreground" }: { label: string; value: string; trend: string; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-surface-alt ${accent}`}>{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-success">{trend}</p>
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
