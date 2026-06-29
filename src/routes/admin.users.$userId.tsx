import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Activity,
  PlayCircle,
  BarChart3,
  CreditCard,
  Monitor,
  Clock,
  MapPin,
  Calendar,
  Pencil,
  Mail,
  Smartphone,
  Flag,
  Ban,
  UserCheck,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useRoles } from "@/api/rbac.api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  EditUserModal,
  ComposeEmailModal,
  FlagAccountModal,
} from "@/components/admin/UserActionModals";
import {
  useAdminUserDetail,
  useAdminUserSessions,
  useAdminUserSubscriptions,
  useAdminUserActivity,
  useUpdateAdminUser,
  useUpdateAdminUserRole,
  useDeleteAdminUser,
  useSuspendUser,
  useReactivateUser,
  useBanUser,
  useFlagUser,
  toBackendRole,
  type AdminUserVM,
  type AdminUserDetailVM,
  type AdminUserStatus,
  type DisplayRole,
  type BackendAdminSession,
  type BackendSubscriptionSummary,
  type BackendActivityLog,
  type BackendSubscriptionPlan,
  type BackendSessionMode,
  type BackendSessionStatus,
  type BackendSubscriptionStatus,
} from "@/api/admin-users.api";

export const Route = createFileRoute("/admin/users/$userId")({
  beforeLoad: () => requirePermission("users.read"),
  head: () => ({
    meta: [
      { title: "Admin · User Detail — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UserDetail,
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColor(pct: number) {
  return pct >= 80 ? "text-success" : pct >= 60 ? "text-warning" : "text-error";
}

const PLAN_LABEL: Record<string, string> = {
  monthly: "Monthly",
  three_months: "3-Month",
  six_months: "6-Month",
  twelve_months: "12-Month",
  free_trial: "Trial",
};

/** Friendly label for a plan key, humanizing unknown/custom keys. */
function planLabel(key: string): string {
  return PLAN_LABEL[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const SUB_STATUS_TONE: Record<BackendSubscriptionStatus, string> = {
  active: "bg-success/10 text-success",
  trial: "bg-warning/10 text-warning",
  expired: "bg-surface-alt text-muted-foreground",
  cancelled: "bg-error/10 text-error",
};

const STATUS_TONE: Record<AdminUserStatus, string> = {
  active: "bg-success/10 text-success border border-success/20",
  suspended: "bg-error/10 text-error border border-error/20",
  banned: "bg-error/10 text-error border border-error/20",
  flagged: "bg-warning/10 text-warning border border-warning/20",
};

function StatusPill({ status }: { status: AdminUserStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_TONE[status]}`}
    >
      {status}
    </span>
  );
}

function RolePill({ role, roleKey }: { role: DisplayRole; roleKey?: string | null }) {
  const tone =
    role === "SUPER_ADMIN"
      ? "bg-primary/10 text-primary border border-primary/20"
      : role === "ADMIN"
        ? "bg-accent/10 text-accent border border-accent/20"
        : "bg-surface-alt text-muted-foreground border border-border";
  // A custom role keeps ADMIN rank but shows its own name.
  const label = roleKey ? roleKey.replace(/[-_]/g, " ") : role.replace("_", " ");
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "sessions", label: "Quiz Sessions", icon: PlayCircle },
  { id: "billing", label: "Subscription", icon: CreditCard },
  { id: "activity", label: "Activity Log", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function UserDetail() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: detail, isLoading, isError, error } = useAdminUserDetail(userId);

  const updateUser = useUpdateAdminUser();
  const updateRole = useUpdateAdminUserRole();
  const { data: rbacRoles = [] } = useRoles();
  const deleteUser = useDeleteAdminUser();
  const suspendUser = useSuspendUser();
  const reactivateUser = useReactivateUser();
  const banUser = useBanUser();
  const flagUser = useFlagUser();

  const [tab, setTab] = useState<TabId>("overview");
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionModal, setActionModal] = useState<null | "edit" | "email" | "flag">(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted-foreground">Loading user…</p>
        </div>
      </div>
    );
  }

  const isNotFound = isError && error instanceof Error && /404|not found/i.test(error.message);

  if (isNotFound || (!isLoading && !isError && !detail)) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
          <p className="text-base font-bold text-foreground">User not found</p>
          <p className="mt-1 text-sm text-muted-foreground">No account exists for id “{userId}”.</p>
          <Link
            to="/admin/users"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-md hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" /> Back to users
          </Link>
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
          <p className="text-base font-bold text-error">Failed to load user</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
        </div>
      </div>
    );
  }

  const user = detail.user;
  const suspended = user.status === "suspended";
  const banned = user.status === "banned";
  // You cannot moderate your own account (no self-suspend/ban/delete/role-change).
  const isSelf = currentUserId === user.id;
  const daysMember = Math.max(
    1,
    Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000),
  );

  function handleEditSave(patch: { name: string; specialty: string; institution: string }) {
    updateUser.mutate(
      {
        id: userId,
        input: {
          name: patch.name,
          specialty: patch.specialty,
          institution: patch.institution,
        },
      },
      {
        onSuccess: () => toast.success("User updated"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
      },
    );
  }

  // Assign any role: a built-in key ("user" | "admin") or a custom role key.
  function handleAssignRole(roleValue: string, label: string) {
    const current = user.roleKey ?? user.role.toLowerCase();
    if (roleValue === current) return;
    updateRole.mutate(
      { id: userId, role: roleValue },
      {
        onSuccess: () =>
          toast.success(`Role changed to ${label}. The user must sign in again.`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Role change failed"),
      },
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Side panel */}
        <aside className="flex-shrink-0 space-y-4 lg:w-80">
          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-card)]">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="mx-auto h-24 w-24 rounded-2xl object-cover"
              />
            ) : (
              <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white">
                {user.initials}
              </span>
            )}
            <h2 className="mt-4 text-xl font-bold text-foreground">{user.name}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <RolePill role={user.role} roleKey={user.roleKey} />
              <StatusPill status={user.displayStatus} />
              {user.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex rounded-full border border-border bg-surface-alt px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Unverified
                </span>
              )}
            </div>

            <div className="mt-4">
              {detail.activeSubscription ? (
                <span className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                  {planLabel(detail.activeSubscription.plan)} plan
                </span>
              ) : (
                <span className="inline-flex rounded-full border border-border bg-surface-alt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  No active plan
                </span>
              )}
            </div>

            <dl className="mt-6 space-y-3 border-t border-border pt-5 text-left text-sm">
              <InfoRow icon={MapPin} label="Country">
                <span className="text-sm font-medium text-foreground">{user.country || "—"}</span>
              </InfoRow>
              <InfoRow icon={ShieldCheck} label="Specialty">
                <span className="text-sm font-medium text-foreground">{user.specialty || "—"}</span>
              </InfoRow>
              <InfoRow icon={ShieldCheck} label="Institution">
                <span className="text-sm font-medium text-foreground">
                  {user.institution || "—"}
                </span>
              </InfoRow>
              <InfoRow icon={Calendar} label="Member since">
                <span className="text-sm font-medium text-foreground">
                  {fmtDate(user.createdAt)}
                </span>
              </InfoRow>
              <InfoRow icon={Clock} label="Last active">
                <span className="text-sm font-medium text-foreground">
                  {fmtDateTime(user.lastActiveAt)}
                </span>
              </InfoRow>
            </dl>
          </div>

          {/* Quick actions */}
          <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <ActionBtn icon={Pencil} onClick={() => setActionModal("edit")}>
              Edit profile
            </ActionBtn>
            <ActionBtn icon={Mail} onClick={() => setActionModal("email")}>
              Send email
            </ActionBtn>
            {isSelf ? (
              <p className="rounded-lg bg-surface-alt px-3 py-2.5 text-center text-xs text-muted-foreground">
                This is your own account — moderation actions are disabled.
              </p>
            ) : (
              <>
                {user.role === "SUPER_ADMIN" ? (
                  <p className="rounded-lg bg-surface-alt px-3 py-2.5 text-center text-xs text-muted-foreground">
                    Super admin — managed outside the dashboard.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border bg-surface-alt/40 px-3 py-2.5">
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Shield className="h-3.5 w-3.5" /> Role
                    </label>
                    <select
                      value={user.roleKey ?? user.role.toLowerCase()}
                      onChange={(e) => {
                        const value = e.target.value;
                        const opt = e.target.selectedOptions[0];
                        handleAssignRole(value, opt?.text ?? value);
                      }}
                      disabled={updateRole.isPending}
                      className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground outline-none focus:border-accent disabled:opacity-60"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      {rbacRoles
                        .filter((r) => !r.builtIn)
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.name} (custom)
                          </option>
                        ))}
                    </select>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                      Custom roles are configured in System Settings → Roles &amp; Permissions.
                      Changing a role signs the user out so they pick up new permissions.
                    </p>
                  </div>
                )}
                <ActionBtn
                  icon={Flag}
                  tone={user.isFlagged ? "warning" : "default"}
                  onClick={() => setActionModal("flag")}
                >
                  {user.isFlagged ? "Flagged ✓" : "Flag account"}
                </ActionBtn>
                <ActionBtn
                  icon={suspended ? UserCheck : Ban}
                  tone="warning"
                  onClick={() => {
                    if (suspended || banned) {
                      reactivateUser.mutate(userId, {
                        onSuccess: () => toast.success("Account reactivated"),
                        onError: (e) =>
                          toast.error(e instanceof Error ? e.message : "Reactivation failed"),
                      });
                    } else {
                      setConfirmSuspend(true);
                    }
                  }}
                >
                  {suspended || banned ? "Reactivate account" : "Suspend account"}
                </ActionBtn>
                {!banned && (
                  <ActionBtn icon={ShieldAlert} tone="error" onClick={() => setConfirmBan(true)}>
                    Ban account
                  </ActionBtn>
                )}
                <ActionBtn icon={Trash2} tone="error" onClick={() => setConfirmDelete(true)}>
                  Delete account
                </ActionBtn>
              </>
            )}
          </div>

          {/* Account standing */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                <ShieldAlert className="h-4 w-4 text-warning" /> Account standing
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${detail.suspiciousLoginCount > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}
              >
                {detail.suspiciousLoginCount} suspicious
              </span>
            </div>

            {user.isFlagged && (
              <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold text-warning">
                  <Flag className="h-3.5 w-3.5" /> Flagged for review
                </p>
                {user.flagReason && (
                  <p className="mt-1 text-xs text-muted-foreground">{user.flagReason}</p>
                )}
                {user.flaggedAt && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Since {fmtDateTime(user.flaggedAt)}
                  </p>
                )}
              </div>
            )}

            {(suspended || banned) && user.statusReason && (
              <div className="mt-3 rounded-lg border border-error/30 bg-error/5 p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold text-error">
                  <Ban className="h-3.5 w-3.5" /> {banned ? "Banned" : "Suspended"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{user.statusReason}</p>
              </div>
            )}

            {!user.isFlagged && !suspended && !banned && (
              <p className="mt-3 text-xs text-muted-foreground">Account in good standing.</p>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col space-y-6">
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-[var(--shadow-card)] scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  tab === t.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
            {tab === "overview" && <OverviewTab detail={detail} daysMember={daysMember} />}
            {tab === "sessions" && <SessionsTab userId={userId} />}
            {tab === "billing" && <BillingTab detail={detail} userId={userId} />}
            {tab === "activity" && <ActivityTab userId={userId} />}
          </div>
        </div>
      </div>

      {/* Quick-action modals */}
      {actionModal === "edit" && (
        <EditUserModal
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            specialty: user.specialty,
            institution: user.institution,
            role: user.role,
            status: user.status,
          }}
          onClose={() => setActionModal(null)}
          onSave={(patch) => {
            handleEditSave({
              name: patch.name ?? user.name,
              specialty: patch.specialty ?? user.specialty,
              institution: patch.institution ?? user.institution,
            });
            // Role lives behind its own endpoint — fire it when it changed.
            if (patch.role && patch.role !== user.role) {
              const display = patch.role as DisplayRole;
              handleAssignRole(toBackendRole(display), display.replace("_", " "));
            }
          }}
        />
      )}
      {actionModal === "email" && (
        <ComposeEmailModal
          user={{ id: user.id, name: user.name, email: user.email }}
          onClose={() => setActionModal(null)}
        />
      )}
      {actionModal === "flag" && (
        <FlagAccountModal
          user={{ id: user.id, name: user.name, email: user.email }}
          onClose={() => setActionModal(null)}
          onFlag={(reason) =>
            flagUser.mutate(
              { id: userId, reason },
              {
                onError: (e) => toast.error(e instanceof Error ? e.message : "Flagging failed"),
              },
            )
          }
        />
      )}

      <ConfirmDialog
        open={confirmSuspend}
        title="Suspend this user?"
        description="They will be signed out and unable to start new quiz sessions until reactivated."
        variant="destructive"
        confirmLabel="Suspend"
        onCancel={() => setConfirmSuspend(false)}
        onConfirm={() => {
          setConfirmSuspend(false);
          suspendUser.mutate(
            { id: userId },
            {
              onSuccess: () => toast.success("Account suspended"),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Suspend failed"),
            },
          );
        }}
      />

      <ConfirmDialog
        open={confirmBan}
        title="Ban this user?"
        description={
          <span>
            This permanently bars <strong>{user.name}</strong> from the platform. They can be
            reactivated later if needed.
          </span>
        }
        variant="destructive"
        confirmLabel="Ban account"
        onCancel={() => setConfirmBan(false)}
        onConfirm={() => {
          setConfirmBan(false);
          banUser.mutate(
            { id: userId },
            {
              onSuccess: () => toast.success("Account banned"),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Ban failed"),
            },
          );
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Permanently delete this user?"
        description={
          <span>
            This deletes <strong>{user.name}</strong>'s account, quiz sessions and subscription
            history. This cannot be undone.
          </span>
        }
        variant="destructive"
        typedConfirmation="DELETE"
        confirmLabel="Delete account"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteUser.mutate(userId, {
            onSuccess: () => {
              toast.success("User deleted");
              navigate({ to: "/admin/users" });
            },
            onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
          });
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function OverviewTab({ detail, daysMember }: { detail: AdminUserDetailVM; daysMember: number }) {
  const user = detail.user;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quiz sessions" value={detail.sessionCount.toLocaleString()} />
        <StatCard label="Subscriptions" value={detail.subscriptionCount.toLocaleString()} accent />
        <StatCard label="Transactions" value={detail.transactionCount.toLocaleString()} />
        <StatCard label="Days as member" value={daysMember.toLocaleString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription status */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-bold text-foreground">Subscription</h3>
          {detail.activeSubscription ? (
            <div className="mt-4 space-y-3">
              <Row label="Plan" value={planLabel(detail.activeSubscription.plan)} bold />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUB_STATUS_TONE[detail.activeSubscription.status]}`}
                >
                  {detail.activeSubscription.status}
                </span>
              </div>
              <Row label="Started" value={fmtDate(detail.activeSubscription.startDate)} />
              <Row label="Ends" value={fmtDate(detail.activeSubscription.endDate)} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No active subscription.</p>
          )}
        </div>

        {/* Account info */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-bold text-foreground">Account</h3>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Sign-in provider" value={user.provider} />
            <Row label="Email verified" value={user.isEmailVerified ? "Yes" : "No"} />
            <Row label="Trial questions used" value={user.trialQuestionsUsed.toLocaleString()} />
            <Row label="Suspicious logins" value={detail.suspiciousLoginCount.toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quiz sessions                                                       */
/* ------------------------------------------------------------------ */

const SESSION_MODE_TONE: Record<BackendSessionMode, string> = {
  tutor: "bg-primary/10 text-primary",
  quiz: "bg-warning/10 text-warning",
};

const SESSION_STATUS_TONE: Record<BackendSessionStatus, string> = {
  completed: "bg-success/10 text-success",
  in_progress: "bg-warning/10 text-warning",
  abandoned: "bg-error/10 text-error",
};

function SessionsTab({ userId }: { userId: string }) {
  const { data, isLoading, isError, error } = useAdminUserSessions(userId);
  const rows = data?.rows ?? [];

  if (isLoading) return <Loading label="Loading quiz sessions…" />;
  if (isError) return <ErrorState error={error} />;
  if (rows.length === 0)
    return <EmptyState label="No quiz sessions yet" hint="This user hasn't started any quizzes." />;

  const sorted = [...rows].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  return (
    <TableCard head={["Mode", "Score", "Questions", "Correct", "Status", "Started"]}>
      {sorted.map((s: BackendAdminSession) => (
        <tr key={s.id} className="hover:bg-surface-alt/40">
          <td className="px-5 py-4">
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SESSION_MODE_TONE[s.mode]}`}
            >
              {s.mode}
            </span>
          </td>
          <td
            className={`px-5 py-4 font-mono text-sm font-bold tabular-nums ${s.scorePercentage != null ? scoreColor(s.scorePercentage) : "text-muted-foreground"}`}
          >
            {s.scorePercentage != null ? `${Math.round(s.scorePercentage)}%` : "—"}
          </td>
          <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
            {s.answeredCount}/{s.totalQuestions}
          </td>
          <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">{s.correctCount}</td>
          <td className="px-5 py-4">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SESSION_STATUS_TONE[s.status]}`}
            >
              {s.status.replace("_", " ")}
            </span>
          </td>
          <td className="px-5 py-4 text-sm text-muted-foreground">{fmtDateTime(s.startedAt)}</td>
        </tr>
      ))}
    </TableCard>
  );
}

/* ------------------------------------------------------------------ */
/* Billing / Subscriptions                                            */
/* ------------------------------------------------------------------ */

function BillingTab({ detail, userId }: { detail: AdminUserDetailVM; userId: string }) {
  const { data, isLoading, isError, error } = useAdminUserSubscriptions(userId);
  const rows = data?.rows ?? [];
  const active = detail.activeSubscription;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Current plan
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {active ? planLabel(active.plan) : "None"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {active ? `Ends ${fmtDate(active.endDate)}` : "No active subscription"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Total subscriptions
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {detail.subscriptionCount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {detail.transactionCount.toLocaleString()} payment transaction
            {detail.transactionCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground">Subscription history</h3>
        {isLoading ? (
          <Loading label="Loading subscriptions…" />
        ) : isError ? (
          <ErrorState error={error} />
        ) : rows.length === 0 ? (
          <EmptyState label="No subscriptions" hint="This user has never subscribed." />
        ) : (
          <TableCard head={["Plan", "Amount", "Start", "End", "Status"]}>
            {[...rows]
              .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
              .map((s: BackendSubscriptionSummary) => (
                <tr key={s.id} className="hover:bg-surface-alt/40">
                  <td className="px-5 py-4 font-semibold text-foreground">{planLabel(s.plan)}</td>
                  <td className="px-5 py-4 text-sm tabular-nums text-foreground">
                    {s.currency} {Number(s.amountPaid).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {fmtDate(s.startDate)}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{fmtDate(s.endDate)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUB_STATUS_TONE[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
          </TableCard>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity log                                                        */
/* ------------------------------------------------------------------ */

function ActivityTab({ userId }: { userId: string }) {
  const { data, isLoading, isError, error } = useAdminUserActivity(userId);
  const rows = data?.rows ?? [];

  if (isLoading) return <Loading label="Loading activity…" />;
  if (isError) return <ErrorState error={error} />;
  if (rows.length === 0)
    return <EmptyState label="No activity" hint="No audit-trail entries recorded." />;

  const sorted = [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-base font-bold text-foreground">Activity log</h3>
      <div className="relative space-y-5 border-l-2 border-border pl-4">
        {sorted.map((e: BackendActivityLog) => (
          <div key={e.id} className="relative">
            <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-surface" />
            <p className="text-sm font-medium text-foreground">
              {e.action}
              {e.entityType ? ` · ${e.entityType}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {[e.actorName, e.ipAddress].filter(Boolean).join(" · ") || "system"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI bits                                                       */
/* ------------------------------------------------------------------ */

function BackLink() {
  return (
    <Link
      to="/admin/users"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> All users
    </Link>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm capitalize text-foreground ${bold ? "font-bold" : "font-semibold"}`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Monitor;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  children,
  onClick,
  tone = "default",
}: {
  icon: typeof Pencil;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "warning" | "error";
}) {
  const cls =
    tone === "warning"
      ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
      : tone === "error"
        ? "border-error/30 bg-error/10 text-error hover:bg-error/20"
        : "border-border bg-surface text-foreground hover:bg-surface-alt";
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${cls}`}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-extrabold tracking-tight tabular-nums ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function TableCard({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-surface-alt/40 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-5 py-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold text-error">
        {error instanceof Error ? error.message : "Failed to load."}
      </p>
    </div>
  );
}

function EmptyState({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
