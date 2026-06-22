import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Ban, Mail, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users/$userId")({
  head: () => ({ meta: [{ title: "Admin · User Detail — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: UserDetail,
});

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "active" | "suspended";
  specialty: string;
  institution: string;
  country: string;
  joinedAt: string;
  lastSeenAt: string;
  plan: string;
  planEndsAt: string | null;
  totalSessions: number;
  totalQuestions: number;
  averageScore: number;
}

function getMockUser(id: string): MockUser {
  return {
    id,
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
}

function UserDetail() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(getMockUser(userId));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div>
      <Link
        to="/admin/users"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left: profile card */}
        <aside className="flex-shrink-0 lg:w-72">
          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-card)]">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-2xl font-bold text-white">
              {initials}
            </span>
            <h2 className="mt-4 text-lg font-bold text-foreground">{user.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0E7C7B]">
                {user.role}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  user.status === "active" ? "bg-success-light text-success" : "bg-error-light text-error"
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

          <div className="mt-4 space-y-2">
            <button
              onClick={() => toast.success(`Password reset email sent to ${user.email}`)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-alt"
            >
              <Mail className="h-4 w-4" /> Send password reset
            </button>
            <button
              onClick={() => setConfirmSuspend(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-warning/30 bg-warning-light/40 px-4 py-2.5 text-sm font-semibold text-warning hover:bg-warning-light"
            >
              {user.status === "active" ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              {user.status === "active" ? "Suspend account" : "Reactivate account"}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-error/30 bg-error-light/40 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error-light"
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          </div>
        </aside>

        {/* Right: stats + tabs */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total sessions" value={String(user.totalSessions)} />
            <Stat label="Questions answered" value={user.totalQuestions.toLocaleString()} />
            <Stat label="Average score" value={`${user.averageScore}%`} accent />
          </div>

          {/* Subscription */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-[#0E7C7B]" /> Subscription
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-alt p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Plan</p>
                <p className="mt-1 text-base font-bold text-foreground">{user.plan}</p>
              </div>
              <div className="rounded-xl bg-surface-alt p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Renews / ends</p>
                <p className="mt-1 text-base font-bold text-foreground">
                  {user.planEndsAt ? new Date(user.planEndsAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => toast("Override saved (mock)")}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 py-2 text-sm font-semibold text-white"
            >
              Override end date
            </button>
          </section>

          {/* Activity timeline */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-bold text-foreground">Recent activity</h3>
            <ol className="mt-4 space-y-3 border-l border-border pl-5">
              {[
                { t: "2h ago", e: "Completed Cardiology Essentials — 82%" },
                { t: "1d ago", e: "Updated profile (specialty)" },
                { t: "3d ago", e: "Started Pharmacology Rapid Review" },
                { t: "2 wk ago", e: "Subscribed to 12 Months plan (Paystack)" },
              ].map((row) => (
                <li key={row.t} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#2BC97F] ring-4 ring-background" />
                  <p className="text-sm text-foreground">{row.e}</p>
                  <p className="text-xs text-muted-foreground">{row.t}</p>
                </li>
              ))}
            </ol>
          </section>
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
          setUser({ ...user, status: user.status === "active" ? "suspended" : "active" });
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
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="truncate text-right text-sm font-medium text-foreground">{v}</dd>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${accent ? "bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] bg-clip-text text-transparent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
