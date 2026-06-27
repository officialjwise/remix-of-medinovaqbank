import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  Activity,
  UserPlus,
  Hourglass,
  CreditCard,
  UserMinus,
  Search,
  Download,
  Eye,
  Pencil,
  Mail,
  Ban,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  Flag,
  X,
  UserCheck,
  ShieldBan,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";
import {
  EditUserModal,
  ComposeEmailModal,
  FlagAccountModal,
} from "@/components/admin/UserActionModals";
import {
  useAdminUsers,
  useAdminUserStats,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useSuspendUser,
  useReactivateUser,
  useBanUser,
  useFlagUser,
  useBulkUserAction,
  exportUsersCsv,
  type AdminUserVM,
  type AdminUserStatus,
  type DisplayRole,
  type BackendUserRole,
  type AdminUserListParams,
} from "@/api/admin-users.api";

export const Route = createFileRoute("/admin/users/")({
  head: () => ({
    meta: [{ title: "Admin · Users — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsers,
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

function relTime(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

type SortKey = "name" | "specialty" | "role" | "status" | "country" | "createdAt" | "lastActiveAt";

const STATUS_TONE: Record<AdminUserStatus, string> = {
  active: "bg-success/10 text-success border border-success/20",
  flagged: "bg-warning/10 text-warning border border-warning/20",
  suspended: "bg-error/10 text-error border border-error/20",
  banned: "bg-error/10 text-error border border-error/20",
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

function RolePill({ role }: { role: DisplayRole }) {
  const tone =
    role === "SUPER_ADMIN"
      ? "bg-primary/10 text-primary border border-primary/20"
      : "bg-surface-alt text-muted-foreground border border-border";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}
    >
      {role.replace("_", " ")}
    </span>
  );
}

const GRID =
  "grid-cols-[40px_minmax(220px,2fr)_140px_120px_110px_minmax(120px,1fr)_120px_120px_minmax(180px,220px)]";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AdminUsers() {
  const navigate = useNavigate();

  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 250);

  const [role, setRole] = useState<"All" | DisplayRole>("All");
  const [active, setActive] = useState<"All" | "active" | "inactive">("All");

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<AdminUserVM | null>(null);
  const [exporting, setExporting] = useState(false);

  const listParams = useMemo<AdminUserListParams>(() => {
    const roleFilter: BackendUserRole | undefined =
      role === "All" ? undefined : role === "SUPER_ADMIN" ? "super_admin" : "user";
    return {
      search: search || undefined,
      role: roleFilter,
      isActive: active === "All" ? undefined : active === "active",
      sortBy: sortKey,
      sortOrder: sortDir,
      limit: 100,
    };
  }, [search, role, active, sortKey, sortDir]);

  const { data, isLoading, isError, error } = useAdminUsers(listParams);
  const { data: stats } = useAdminUserStats();
  const users = data?.users ?? [];

  const deleteMutation = useDeleteAdminUser();
  const bulkMutation = useBulkUserAction();

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const allOnPageSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  function toggleAll() {
    if (allOnPageSelected) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulk(action: "suspend" | "ban" | "reactivate" | "delete") {
    const userIds = [...selected];
    bulkMutation.mutate(
      { action, userIds },
      {
        onSuccess: (res) => {
          toast.success(`${res.affected} user${res.affected === 1 ? "" : "s"} ${action}d`);
          setSelected(new Set());
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk action failed"),
      },
    );
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportUsersCsv(listParams);
      toast.success("Users exported to CSV");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} matching accounts` : "Loading…"}
          </p>
        </div>
      </div>

      {/* Summary cards (from /admin/users/stats) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard icon={Users} label="Total users" value={stats?.total ?? 0} />
        <SummaryCard icon={Activity} label="Active" value={stats?.active ?? 0} tone="success" />
        <SummaryCard
          icon={UserPlus}
          label="New (30d)"
          value={stats?.newLast30Days ?? 0}
          tone="accent"
        />
        <SummaryCard icon={Hourglass} label="Trial" value={stats?.trial ?? 0} tone="warning" />
        <SummaryCard
          icon={CreditCard}
          label="Subscribed"
          value={stats?.subscribed ?? 0}
          tone="success"
        />
        <SummaryCard
          icon={UserMinus}
          label="Suspended / banned"
          value={(stats?.suspended ?? 0) + (stats?.banned ?? 0)}
          tone="error"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search name, email or institution…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt transition-colors disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <FilterSelect
          label="Role"
          value={role}
          onChange={(v) => setRole(v as typeof role)}
          options={["All", "USER", "SUPER_ADMIN"]}
        />
        <FilterSelect
          label="Account"
          value={active}
          onChange={(v) => setActive(v as typeof active)}
          options={["All", "active", "inactive"]}
        />
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 animate-in fade-in">
          <span className="text-sm font-bold text-accent">{selected.size} selected</span>
          <span className="flex-1" />
          <BulkBtn onClick={() => runBulk("reactivate")} tone="success">
            Reactivate
          </BulkBtn>
          <BulkBtn onClick={() => runBulk("suspend")} tone="warning">
            Suspend
          </BulkBtn>
          <BulkBtn onClick={() => runBulk("ban")} tone="error">
            Ban
          </BulkBtn>
          <BulkBtn onClick={() => runBulk("delete")} tone="error">
            Delete
          </BulkBtn>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <div className="min-w-[1184px]">
            {/* Header row */}
            <div
              className={`grid ${GRID} items-center gap-3 border-b border-border bg-surface-alt/40 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground`}
            >
              <button
                onClick={toggleAll}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Select all"
              >
                {allOnPageSelected ? (
                  <CheckSquare className="h-4 w-4 text-accent" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <SortHead label="User" k="name" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHead
                label="Specialty"
                k="specialty"
                sortKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <SortHead label="Role" k="role" sortKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHead
                label="Status"
                k="status"
                sortKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <SortHead
                label="Country"
                k="country"
                sortKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <SortHead
                label="Registered"
                k="createdAt"
                sortKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <SortHead
                label="Last active"
                k="lastActiveAt"
                sortKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <span className="text-right">·</span>
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                Loading users…
              </div>
            ) : isError ? (
              <div className="px-4 py-16 text-center text-sm text-error">
                {error instanceof Error ? error.message : "Failed to load users."}
              </div>
            ) : users.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-semibold text-foreground">No users found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  selected={selected.has(u.id)}
                  onToggle={() => toggleOne(u.id)}
                  onView={() => navigate({ to: "/admin/users/$userId", params: { userId: u.id } })}
                  onDelete={() => setDeleteTarget(u)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Permanently delete this user?"
        description={
          deleteTarget ? (
            <span>
              This deletes <strong>{deleteTarget.name}</strong>'s account, quiz sessions and
              subscription history. This cannot be undone.
            </span>
          ) : undefined
        }
        variant="destructive"
        typedConfirmation={deleteTarget?.name}
        confirmLabel="Delete account"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          try {
            await deleteMutation.mutateAsync(target.id);
            toast.success(`${target.name} deleted`);
            setDeleteTarget(null);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
          }
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

function UserRow({
  user: u,
  selected,
  onToggle,
  onView,
  onDelete,
}: {
  user: AdminUserVM;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`grid ${GRID} h-[76px] items-center gap-3 border-b border-border px-4 transition-colors ${
        selected ? "bg-accent/5" : "hover:bg-surface-alt/40"
      }`}
    >
      <button
        onClick={onToggle}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Select row"
      >
        {selected ? (
          <CheckSquare className="h-4 w-4 text-accent" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
          {u.initials}
        </span>
        <div className="min-w-0">
          <button
            onClick={onView}
            className="block truncate text-left text-sm font-semibold text-foreground hover:text-accent"
          >
            {u.name}
          </button>
          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
        </div>
      </div>

      <span className="truncate text-sm text-muted-foreground">{u.specialty || "—"}</span>
      <span>
        <RolePill role={u.role} />
      </span>
      <span>
        <StatusPill status={u.displayStatus} />
      </span>
      <span className="truncate text-sm text-muted-foreground">{u.country || "—"}</span>
      <span className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</span>
      <span className="text-xs text-muted-foreground">{relTime(u.lastActiveAt)}</span>

      <div className="flex justify-end">
        <RowActions user={u} onView={onView} onDelete={onDelete} />
      </div>
    </div>
  );
}

function RowActions({
  user,
  onView,
  onDelete,
}: {
  user: AdminUserVM;
  onView: () => void;
  onDelete: () => void;
}) {
  const [modal, setModal] = useState<null | "edit" | "email" | "flag">(null);

  const updateMutation = useUpdateAdminUser();
  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();
  const banMutation = useBanUser();
  const flagMutation = useFlagUser();

  const isSuspended = user.status === "suspended" || user.status === "banned";

  return (
    <div className="inline-flex items-center gap-1 text-left">
      {user.isFlagged && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning"
          title={user.flagReason ?? "Flagged for review"}
        >
          <Flag className="h-3 w-3" /> Flagged
        </span>
      )}

      <IconBtn title="View profile" onClick={onView}>
        <Eye className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Edit profile" onClick={() => setModal("edit")}>
        <Pencil className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Send email" onClick={() => setModal("email")}>
        <Mail className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Flag account" onClick={() => setModal("flag")}>
        <Flag className="h-4 w-4" />
      </IconBtn>

      {isSuspended ? (
        <IconBtn
          title="Reactivate"
          tone="success"
          disabled={reactivateMutation.isPending}
          onClick={() =>
            reactivateMutation.mutate(user.id, {
              onSuccess: () => toast.success(`${user.name} reactivated`),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
            })
          }
        >
          {reactivateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
        </IconBtn>
      ) : (
        <IconBtn
          title="Suspend"
          tone="warning"
          disabled={suspendMutation.isPending}
          onClick={() =>
            suspendMutation.mutate(
              { id: user.id },
              {
                onSuccess: () => toast.success(`${user.name} suspended`),
                onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
              },
            )
          }
        >
          {suspendMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
        </IconBtn>
      )}

      <IconBtn
        title="Ban"
        tone="error"
        disabled={banMutation.isPending}
        onClick={() =>
          banMutation.mutate(
            { id: user.id },
            {
              onSuccess: () => toast.success(`${user.name} banned`),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
            },
          )
        }
      >
        {banMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldBan className="h-4 w-4" />
        )}
      </IconBtn>

      <IconBtn title="Delete" tone="error" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </IconBtn>

      {modal === "edit" && (
        <EditUserModal
          user={user}
          onClose={() => setModal(null)}
          onSave={(patch) =>
            updateMutation.mutate(
              {
                id: user.id,
                input: {
                  name: patch.name,
                  specialty: patch.specialty,
                  institution: patch.institution,
                },
              },
              {
                onSuccess: () => toast.success("Profile updated"),
                onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
              },
            )
          }
        />
      )}
      {modal === "email" && <ComposeEmailModal user={user} onClose={() => setModal(null)} />}
      {modal === "flag" && (
        <FlagAccountModal
          user={user}
          onClose={() => setModal(null)}
          onFlag={(reason) =>
            flagMutation.mutate(
              { id: user.id, reason },
              {
                onSuccess: () => toast.success(`${user.name} flagged for review`),
                onError: (e) => toast.error(e instanceof Error ? e.message : "Flag failed"),
              },
            )
          }
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI bits                                                       */
/* ------------------------------------------------------------------ */

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "error" | "accent";
}) {
  const toneCls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : tone === "error"
          ? "bg-error/10 text-error"
          : tone === "accent"
            ? "bg-accent/10 text-accent"
            : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-2xl font-extrabold tracking-tight tabular-nums text-foreground">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
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
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium normal-case tracking-normal text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "All" ? "All" : o.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortHead({
  label,
  k,
  sortKey,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === k;
  return (
    <button
      onClick={() => onSort(k)}
      className={`group flex items-center gap-1 font-bold uppercase tracking-widest hover:text-foreground ${
        align === "right" ? "justify-end" : ""
      }`}
    >
      {label}
      <span
        className={`flex flex-col ${active ? "text-accent" : "text-muted-foreground/30 group-hover:text-muted-foreground"}`}
      >
        <ChevronUp
          className={`-mb-1 h-2.5 w-2.5 ${active && dir === "asc" ? "opacity-100" : "opacity-40"}`}
        />
        <ChevronDown
          className={`h-2.5 w-2.5 ${active && dir === "desc" ? "opacity-100" : "opacity-40"}`}
        />
      </span>
    </button>
  );
}

function BulkBtn({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "default" | "success" | "warning" | "error";
}) {
  const cls =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
        : tone === "error"
          ? "border-error/30 bg-error/10 text-error hover:bg-error/20"
          : "border-border bg-surface text-foreground hover:bg-surface-alt";
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  tone = "default",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  tone?: "default" | "success" | "warning" | "error";
  disabled?: boolean;
}) {
  const toneCls =
    tone === "success"
      ? "text-muted-foreground hover:bg-success/10 hover:text-success"
      : tone === "warning"
        ? "text-muted-foreground hover:bg-warning/10 hover:text-warning"
        : tone === "error"
          ? "text-muted-foreground hover:bg-error/10 hover:text-error"
          : "text-muted-foreground hover:bg-surface-alt hover:text-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneCls}`}
    >
      {children}
    </button>
  );
}
