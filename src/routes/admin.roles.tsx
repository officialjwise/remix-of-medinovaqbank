import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { useRoles, usePermissions, useSetRolePermissions, type Permission } from "@/api/rbac.api";

export const Route = createFileRoute("/admin/roles")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (useAuthStore.getState().user?.role !== "SUPER_ADMIN") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  head: () => ({
    meta: [{ title: "Admin · Roles — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: RolesPage,
});

function groupByCategory(permissions: Permission[]): Array<[string, Permission[]]> {
  const map = new Map<string, Permission[]>();
  for (const p of permissions) {
    const list = map.get(p.category) ?? [];
    list.push(p);
    map.set(p.category, list);
  }
  return [...map.entries()];
}

function RolesPage() {
  const rolesQuery = useRoles();
  const permsQuery = usePermissions();
  const setPerms = useSetRolePermissions();

  const roles = rolesQuery.data ?? [];
  const permissions = permsQuery.data ?? [];

  const [activeKey, setActiveKey] = useState<string | null>(null);
  /** Local draft of the selected role's permission keys (saved via PATCH). */
  const [draft, setDraft] = useState<string[]>([]);

  // Pick the first role once loaded.
  useEffect(() => {
    if (!activeKey && roles.length > 0) {
      setActiveKey(roles[0].key);
    }
  }, [activeKey, roles]);

  const activeRole = useMemo(
    () => roles.find((r) => r.key === activeKey) ?? null,
    [roles, activeKey],
  );

  // Reset draft whenever the selected role (or its server permissions) changes.
  useEffect(() => {
    if (activeRole) setDraft(activeRole.permissions);
  }, [activeRole]);

  const grouped = useMemo(() => groupByCategory(permissions), [permissions]);

  const dirty = useMemo(() => {
    if (!activeRole) return false;
    const a = [...draft].sort();
    const b = [...activeRole.permissions].sort();
    return a.length !== b.length || a.some((k, i) => k !== b[i]);
  }, [draft, activeRole]);

  function togglePerm(key: string) {
    setDraft((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  function save() {
    if (!activeRole) return;
    setPerms.mutate(
      { key: activeRole.key, permissionKeys: draft },
      {
        onSuccess: () => toast.success(`Saved permissions for ${activeRole.name}`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to save permissions"),
      },
    );
  }

  return (
    <div>
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground">
          Define what each role can do. Built-in roles can be edited but not deleted.
        </p>
      </header>

      {rolesQuery.isError && (
        <div className="mt-6 rounded-xl border border-error/30 bg-error-light/40 p-4 text-sm text-error">
          {rolesQuery.error instanceof Error ? rolesQuery.error.message : "Failed to load roles."}
        </div>
      )}

      {rolesQuery.isLoading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-40 animate-pulse rounded-xl border border-border bg-surface-alt/50" />
          <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface-alt/50" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => setActiveKey(r.key)}
                className={`block w-full rounded-xl border p-4 text-left transition-all ${
                  activeKey === r.key
                    ? "border-[#2BC97F] bg-gradient-to-br from-[#2BC97F]/10 to-transparent shadow-[0_4px_14px_-4px_rgb(43_201_127_/_0.25)]"
                    : "border-border bg-surface hover:border-[#2BC97F]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground">{r.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.members.toLocaleString()} members
                    </p>
                  </div>
                  {r.builtIn && (
                    <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Built-in
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {r.description}
                </p>
              </button>
            ))}
          </aside>

          {activeRole && (
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <header className="flex items-center gap-3 border-b border-border pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{activeRole.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {draft.length} of {permissions.length} permissions enabled
                  </p>
                </div>
              </header>

              {permsQuery.isLoading ? (
                <div className="mt-5 h-48 animate-pulse rounded-lg bg-surface-alt/50" />
              ) : permissions.length === 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">No permissions defined.</p>
              ) : (
                <div className="mt-5 space-y-6">
                  {grouped.map(([category, perms]) => (
                    <div key={category}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {category}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {perms.map((p) => {
                          const on = draft.includes(p.key);
                          return (
                            <button
                              key={p.key}
                              onClick={() => togglePerm(p.key)}
                              className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                                on
                                  ? "border-[#2BC97F] bg-success-light/40"
                                  : "border-border bg-surface hover:bg-surface-alt"
                              }`}
                            >
                              <div>
                                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                                <code className="mt-0.5 block text-[10px] font-mono text-muted-foreground">
                                  {p.key}
                                </code>
                              </div>
                              <span
                                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${
                                  on ? "bg-[#2BC97F] text-white" : "border border-border bg-surface"
                                }`}
                              >
                                {on && <Check className="h-3.5 w-3.5" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                <button
                  disabled={!dirty || setPerms.isPending}
                  onClick={save}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {setPerms.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
