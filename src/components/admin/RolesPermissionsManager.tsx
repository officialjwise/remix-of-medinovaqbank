import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Lock, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  CRUD_ACTIONS,
  buildResourceMatrix,
  useRoles,
  usePermissions,
  useSetRolePermissions,
  useCreateRole,
  useDeleteRole,
  type CrudAction,
  type ResourceRow,
  type Role,
} from "@/api/rbac.api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const ACTION_LABEL: Record<CrudAction, string> = {
  create: "Create",
  read: "View",
  update: "Edit",
  delete: "Delete",
};

const CATEGORY_LABEL: Record<string, string> = {
  content: "Content",
  users: "Users & Access",
  analytics: "Analytics",
  protection: "Protection",
  billing: "Billing",
  integrations: "Integrations",
  system: "System",
};

/**
 * The single source-of-truth RBAC editor: a resource × CRUD permission matrix
 * per role. super_admin is shown locked (never editable); the built-in admin
 * role and any custom roles are editable. Custom roles can be created (with a
 * permission selection) and deleted. Saving replaces the role's entire grant.
 */
export function RolesPermissionsManager() {
  const rolesQuery = useRoles();
  const permsQuery = usePermissions();
  const setPerms = useSetRolePermissions();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  const allRoles = rolesQuery.data ?? [];
  const matrix = useMemo(() => buildResourceMatrix(permsQuery.data ?? []), [permsQuery.data]);

  // Editable roles = everything except super_admin (shown locked separately).
  const editableRoles = allRoles.filter((r) => r.key !== "super_admin");
  const superAdmin = allRoles.find((r) => r.key === "super_admin");

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);

  useEffect(() => {
    if (!activeKey && editableRoles.length > 0) setActiveKey(editableRoles[0].key);
  }, [activeKey, editableRoles]);

  const activeRole = editableRoles.find((r) => r.key === activeKey) ?? null;

  if (rolesQuery.isLoading || permsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl border border-border bg-surface-alt/50" />
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface-alt/50" />
      </div>
    );
  }

  if (rolesQuery.isError) {
    return (
      <div className="rounded-xl border border-error/30 bg-error-light/40 p-4 text-sm text-error">
        {rolesQuery.error instanceof Error ? rolesQuery.error.message : "Failed to load roles."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Super admin — locked. */}
      <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Super Admin</p>
            <p className="text-xs text-muted-foreground">
              Full, unrestricted access
              {superAdmin
                ? ` · ${superAdmin.members} member${superAdmin.members === 1 ? "" : "s"}`
                : ""}
              . Provisioned out-of-band and not editable.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
          <Lock className="h-3 w-3" /> Locked
        </span>
      </div>

      {/* Role pills + create. */}
      <div className="flex flex-wrap items-center gap-2">
        {editableRoles.map((r) => (
          <button
            key={r.key}
            onClick={() => {
              setActiveKey(r.key);
              setCreating(false);
            }}
            className={`group inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
              activeKey === r.key && !creating
                ? "border-[#2BC97F] bg-[#2BC97F]/10 text-foreground"
                : "border-border bg-surface text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            }`}
          >
            {r.name}
            <span className="rounded-full bg-surface-alt px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {r.members}
            </span>
            {r.builtIn && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/70">
                built-in
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setCreating(true)}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3.5 py-2 text-sm font-semibold transition-colors ${
            creating
              ? "border-[#2BC97F] bg-[#2BC97F]/10 text-foreground"
              : "border-border bg-surface text-foreground hover:bg-surface-alt"
          }`}
        >
          <Plus className="h-4 w-4" /> New role
        </button>
      </div>

      {creating ? (
        <CreateRoleForm
          matrix={matrix}
          pending={createRole.isPending}
          onCancel={() => setCreating(false)}
          onCreate={(name, description, permissionKeys) =>
            createRole.mutate(
              { name, description, permissionKeys },
              {
                onSuccess: (role) => {
                  toast.success(`Role "${role.name}" created`);
                  setCreating(false);
                  setActiveKey(role.key);
                },
                onError: (e) =>
                  toast.error(e instanceof Error ? e.message : "Failed to create role"),
              },
            )
          }
        />
      ) : activeRole ? (
        <RoleEditor
          key={activeRole.key}
          role={activeRole}
          matrix={matrix}
          saving={setPerms.isPending}
          onSave={(permissionKeys) =>
            setPerms.mutate(
              { key: activeRole.key, permissionKeys },
              {
                onSuccess: () => toast.success(`Saved permissions for ${activeRole.name}`),
                onError: (e) =>
                  toast.error(e instanceof Error ? e.message : "Failed to save permissions"),
              },
            )
          }
          onDelete={!activeRole.builtIn ? () => setConfirmDelete(activeRole) : undefined}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No editable roles yet — create one above.</p>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete role "${confirmDelete?.name ?? ""}"?`}
        description={
          confirmDelete && confirmDelete.members > 0
            ? `This role has ${confirmDelete.members} member(s). Reassign them to another role first.`
            : "This permanently removes the custom role and its permission grants."
        }
        confirmLabel="Delete role"
        variant="destructive"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const role = confirmDelete;
          if (!role) return;
          deleteRole.mutate(role.key, {
            onSuccess: () => {
              toast.success(`Role "${role.name}" deleted`);
              setConfirmDelete(null);
              setActiveKey(null);
            },
            onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete role"),
          });
        }}
      />
    </div>
  );
}

/* ───────────── The resource × CRUD matrix (shared by editor + create) ───────────── */
function PermissionMatrix({
  matrix,
  selected,
  onToggle,
}: {
  matrix: ResourceRow[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  // Group rows by category for section headers.
  const groups: Array<[string, ResourceRow[]]> = [];
  for (const row of matrix) {
    const last = groups[groups.length - 1];
    if (last && last[0] === row.category) last[1].push(row);
    else groups.push([row.category, [row]]);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-alt/50">
            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Resource
            </th>
            {CRUD_ACTIONS.map((a) => (
              <th
                key={a}
                className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground"
              >
                {ACTION_LABEL[a]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(([category, rows]) => (
            <CategoryGroup
              key={category}
              category={category}
              rows={rows}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryGroup({
  category,
  rows,
  selected,
  onToggle,
}: {
  category: string;
  rows: ResourceRow[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-border bg-surface-alt/30">
        <td
          colSpan={1 + CRUD_ACTIONS.length}
          className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70"
        >
          {CATEGORY_LABEL[category] ?? category}
        </td>
      </tr>
      {rows.map((row) => (
        <tr
          key={row.resource}
          className="border-b border-border/60 last:border-0 hover:bg-surface-alt/30"
        >
          <td className="px-4 py-2.5 font-medium text-foreground">{row.label}</td>
          {CRUD_ACTIONS.map((action) => {
            const key = row.cells[action];
            return (
              <td key={action} className="px-3 py-2.5 text-center">
                {key ? (
                  <Checkbox
                    checked={selected.has(key)}
                    onClick={() => onToggle(key)}
                    label={`${row.label} ${ACTION_LABEL[action]}`}
                  />
                ) : (
                  <span className="text-muted-foreground/30">—</span>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function Checkbox({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-5 w-5 items-center justify-center rounded transition-colors ${
        checked
          ? "bg-[#2BC97F] text-white"
          : "border border-border bg-surface hover:border-[#2BC97F]/50"
      }`}
    >
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ───────────── Edit an existing role ───────────── */
function RoleEditor({
  role,
  matrix,
  saving,
  onSave,
  onDelete,
}: {
  role: Role;
  matrix: ResourceRow[];
  saving: boolean;
  onSave: (permissionKeys: string[]) => void;
  onDelete?: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions));
  useEffect(() => setSelected(new Set(role.permissions)), [role]);

  const allKeys = useMemo(
    () => matrix.flatMap((r) => Object.values(r.cells)),
    [matrix],
  ) as string[];

  const dirty = useMemo(() => {
    if (selected.size !== role.permissions.length) return true;
    return role.permissions.some((k) => !selected.has(k));
  }, [selected, role.permissions]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">{role.name}</h3>
          <p className="text-xs text-muted-foreground">
            {selected.size} of {allKeys.length} permissions · {role.members} member
            {role.members === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelected(new Set(allKeys))}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            Clear
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-error/30 bg-error-light/30 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error-light/50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </header>

      <PermissionMatrix matrix={matrix} selected={selected} onToggle={toggle} />

      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => onSave([...selected])}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </section>
  );
}

/* ───────────── Create a custom role ───────────── */
function CreateRoleForm({
  matrix,
  pending,
  onCancel,
  onCreate,
}: {
  matrix: ResourceRow[];
  pending: boolean;
  onCancel: () => void;
  onCreate: (name: string, description: string, permissionKeys: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allKeys = useMemo(
    () => matrix.flatMap((r) => Object.values(r.cells)),
    [matrix],
  ) as string[];

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">New custom role</h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Role name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Content Editor"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-[#2BC97F]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Description <span className="font-normal text-muted-foreground/60">(optional)</span>
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this role is for"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-[#2BC97F]"
          />
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">
          Choose permissions ({selected.size} of {allKeys.length})
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelected(new Set(allKeys))}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>

      <PermissionMatrix matrix={matrix} selected={selected} onToggle={toggle} />

      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!name.trim() || pending}
          onClick={() => onCreate(name.trim(), description.trim(), [...selected])}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Creating…" : "Create role"}
        </button>
      </div>
    </section>
  );
}
