import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

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

const allPermissions = [
  { id: "users.read", label: "View users" },
  { id: "users.write", label: "Edit users" },
  { id: "users.delete", label: "Delete users" },
  { id: "banks.read", label: "View question banks" },
  { id: "banks.write", label: "Create / edit banks" },
  { id: "questions.write", label: "Create / edit questions" },
  { id: "subscriptions.read", label: "View subscriptions" },
  { id: "subscriptions.write", label: "Override subscriptions" },
  { id: "plans.write", label: "Edit pricing plans" },
  { id: "settings.write", label: "Edit system settings" },
  { id: "ai.write", label: "Configure AI providers" },
  { id: "audit.read", label: "View audit logs" },
] as const;

interface Role {
  key: string;
  name: string;
  description: string;
  members: number;
  builtIn: boolean;
  permissions: string[];
}

const initial: Role[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Unrestricted access to every surface in the platform.",
    members: 2,
    builtIn: true,
    permissions: allPermissions.map((p) => p.id),
  },
  {
    key: "user",
    name: "User",
    description: "Standard practitioner account. Cannot access admin surfaces.",
    members: 3471,
    builtIn: true,
    permissions: [],
  },
];

function RolesPage() {
  const [roles, setRoles] = useState(initial);
  const [active, setActive] = useState(roles[0].key);
  const role = roles.find((r) => r.key === active)!;

  function togglePerm(p: string) {
    setRoles(
      roles.map((r) =>
        r.key === active
          ? {
              ...r,
              permissions: r.permissions.includes(p)
                ? r.permissions.filter((x) => x !== p)
                : [...r.permissions, p],
            }
          : r,
      ),
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => setActive(r.key)}
              className={`block w-full rounded-xl border p-4 text-left transition-all ${
                active === r.key
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
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.description}</p>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <header className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B] to-[#2BC97F] text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-foreground">{role.name}</h3>
              <p className="text-xs text-muted-foreground">
                {role.permissions.length} of {allPermissions.length} permissions enabled
              </p>
            </div>
          </header>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {allPermissions.map((p) => {
              const on = role.permissions.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePerm(p.id)}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                    on
                      ? "border-[#2BC97F] bg-success-light/40"
                      : "border-border bg-surface hover:bg-surface-alt"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.label}</p>
                    <code className="mt-0.5 block text-[10px] font-mono text-muted-foreground">
                      {p.id}
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

          <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
            <button
              onClick={() => toast.success(`Saved permissions for ${role.name}`)}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-semibold text-white"
            >
              Save changes
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
