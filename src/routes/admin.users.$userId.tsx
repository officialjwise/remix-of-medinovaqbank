import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Ban, Mail, ShieldCheck, Trash2, UserCheck, Activity, BarChart3, Clock, CreditCard, PlayCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/users/$userId")({
  head: () => ({ meta: [{ title: "Admin · User Detail — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: UserDetail,
});

// Mock user data
const user = {
  id: "mock-id",
  name: "Dr. Akua Mensah",
  email: "akua.mensah@example.gh",
  role: "USER",
  status: "active",
  specialty: "Internal Medicine",
  institution: "Korle Bu Teaching Hospital",
  country: "Ghana",
  joinedAt: "2025-01-12",
  lastSeenAt: "2026-06-21T14:32:00Z",
  plan: "12 Months",
  planEndsAt: "2027-01-12",
  totalSessions: 47,
  totalQuestions: 1284,
  averageScore: 78,
};

const activityData = [
  { t: "2h ago", e: "Completed Cardiology Essentials — 82%" },
  { t: "1d ago", e: "Updated profile (specialty)" },
  { t: "3d ago", e: "Started Pharmacology Rapid Review" },
  { t: "2 wk ago", e: "Subscribed to 12 Months plan (Paystack)" },
];

const performanceData = [
  { month: "Jan", score: 65 },
  { month: "Feb", score: 68 },
  { month: "Mar", score: 71 },
  { month: "Apr", score: 75 },
  { month: "May", score: 77 },
  { month: "Jun", score: 78 },
];

const sessionsData = [
  { id: "1", bank: "Cardiology Essentials", date: "Today", score: "82%", status: "Completed" },
  { id: "2", bank: "Pharmacology Rapid Review", date: "3 days ago", score: "-", status: "In Progress" },
  { id: "3", bank: "Neurology Mastery", date: "Last week", score: "74%", status: "Completed" },
];

const subscriptionsData = [
  { id: "sub-1", plan: "12 Months", amount: "GHS 799", date: "2026-01-12", status: "Active" },
  { id: "sub-2", plan: "Trial", amount: "GHS 0", date: "2025-01-12", status: "Expired" },
];

function UserDetail() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  
  const [fingerprint, setFingerprint] = useState("chr-win-9x8f72..."); // Mock fingerprint

  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "sessions", label: "Quiz Sessions", icon: PlayCircle },
    { id: "performance", label: "Performance", icon: BarChart3 },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "activity", label: "Activity Log", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left Sidebar */}
        <aside className="flex-shrink-0 lg:w-80 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
            <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white shadow-lg">
              {initials}
            </span>
            <h2 className="mt-4 text-xl font-bold text-foreground">{user.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20">
                {user.role}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                  user.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"
                }`}
              >
                {user.status}
              </span>
            </div>

            <dl className="mt-6 space-y-3 border-t border-border pt-5 text-left text-sm">
              <Row k="Specialty" v={user.specialty} />
              <Row k="Institution" v={user.institution} />
              <Row k="Country" v={user.country} />
              <Row k="Joined" v={new Date(user.joinedAt).toLocaleDateString()} />
              <Row k="Last seen" v={new Date(user.lastSeenAt).toLocaleString()} />
            </dl>
          </div>
          
          {/* Device Fingerprint for Trial Users */}
          {user.plan === "Trial" && (
            <div className="rounded-2xl border border-warning/20 bg-warning/5 p-5 shadow-lg">
              <h3 className="text-sm font-bold text-warning mb-2">Device Lock (Trial)</h3>
              <p className="text-xs text-muted-foreground mb-3 break-all font-mono">
                {fingerprint || "No device registered"}
              </p>
              <button 
                onClick={() => { setFingerprint(""); toast.success("Device lock cleared. User can now log in from a new device."); }}
                disabled={!fingerprint}
                className="w-full rounded-lg bg-warning/20 py-2 text-xs font-semibold text-warning hover:bg-warning/30 disabled:opacity-50 transition-colors"
              >
                Clear Device Fingerprint
              </button>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={() => toast.success(`Password reset email sent to ${user.email}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold hover:bg-surface-alt transition-colors"
            >
              <Mail className="h-4 w-4" /> Send password reset
            </button>
            <button
              onClick={() => setConfirmSuspend(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning hover:bg-warning/20 transition-colors"
            >
              {user.status === "active" ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              {user.status === "active" ? "Suspend account" : "Reactivate account"}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error hover:bg-error/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          </div>
        </aside>

        {/* Right Main Area */}
        <div className="min-w-0 flex-1 flex flex-col space-y-6">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 rounded-xl bg-surface p-1 shadow-sm overflow-x-auto scrollbar-none border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Areas */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat label="Total sessions" value={String(user.totalSessions)} />
                  <Stat label="Questions answered" value={user.totalQuestions.toLocaleString()} />
                  <Stat label="Average score" value={`${user.averageScore}%`} accent />
                </div>
                
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <h3 className="text-base font-bold text-foreground mb-4">Quick Insights</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <p>User is highly active and consistently scores above the platform average. Their strongest subject is <strong>Pharmacology</strong>, while they struggle slightly with <strong>Cardiology</strong>.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sessions" && (
              <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-alt/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-5 py-3">Bank</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessionsData.map(s => (
                      <tr key={s.id} className="hover:bg-surface-alt/30 transition-colors">
                        <td className="px-5 py-4 font-semibold text-foreground">{s.bank}</td>
                        <td className="px-5 py-4 text-muted-foreground">{s.date}</td>
                        <td className="px-5 py-4 font-medium">{s.score}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            s.status === "Completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "performance" && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-6">Score Progression</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0E7C7B" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#0E7C7B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', color: 'var(--color-foreground)' }}
                        itemStyle={{ color: '#0E7C7B', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#0E7C7B" strokeWidth={3} fill="url(#gScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "subscriptions" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Current Plan</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{user.plan}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Ends on {new Date(user.planEndsAt!).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center justify-center rounded-xl border border-border bg-surface p-5 border-dashed hover:border-accent/50 transition-colors cursor-pointer group">
                    <div className="text-center">
                      <CreditCard className="mx-auto h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
                      <p className="mt-2 text-sm font-semibold text-foreground group-hover:text-accent">Grant Override</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-alt/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-5 py-3">Plan</th>
                        <th className="px-5 py-3">Amount</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {subscriptionsData.map(s => (
                        <tr key={s.id}>
                          <td className="px-5 py-4 font-semibold">{s.plan}</td>
                          <td className="px-5 py-4">{s.amount}</td>
                          <td className="px-5 py-4 text-muted-foreground">{s.date}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              s.status === "Active" ? "bg-success/10 text-success" : "bg-surface-alt text-muted-foreground"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4">Activity Timeline</h3>
                <div className="relative pl-4 border-l-2 border-border space-y-6">
                  {activityData.map((row, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-surface" />
                      <p className="text-sm font-medium text-foreground">{row.e}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.t}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSuspend}
        title={user.status === "active" ? "Suspend this user?" : "Reactivate this user?"}
        description={
          user.status === "active"
            ? "They will be signed out and unable to start new quiz sessions until reactivated."
            : "They will be able to sign in again immediately."
        }
        variant={user.status === "active" ? "destructive" : "default"}
        confirmLabel={user.status === "active" ? "Suspend" : "Reactivate"}
        onCancel={() => setConfirmSuspend(false)}
        onConfirm={() => {
          setConfirmSuspend(false);
          toast.success("Account status updated");
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Permanently delete this user?"
        description={
          <span>
            This deletes <strong>{user.name}</strong>'s account, sessions, and subscription history.
            This cannot be undone.
          </span>
        }
        variant="destructive"
        typedConfirmation="DELETE"
        confirmLabel="Delete account"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          toast.success("User deleted");
          navigate({ to: "/admin/users" });
        }}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="truncate text-right text-sm font-medium text-foreground">{v}</dd>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm relative overflow-hidden">
      {accent && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground relative z-10">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tracking-tight relative z-10 ${accent ? "text-primary drop-shadow-sm" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
