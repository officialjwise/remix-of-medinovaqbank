import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Key, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/api")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (useAuthStore.getState().user?.role !== "SUPER_ADMIN") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Admin · API Management — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: APIPage,
});

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsed: string;
  createdAt: string;
}

const initial: APIKey[] = [
  {
    id: "k1",
    name: "Mobile App (iOS / Android)",
    prefix: "mqb_live_8a3f",
    scopes: ["read:banks", "read:questions"],
    lastUsed: "2h ago",
    createdAt: "2025-09-12",
  },
  {
    id: "k2",
    name: "Internal Analytics ETL",
    prefix: "mqb_live_44ce",
    scopes: ["read:sessions", "read:users"],
    lastUsed: "5m ago",
    createdAt: "2025-11-04",
  },
  {
    id: "k3",
    name: "Marketing Website (read-only)",
    prefix: "mqb_live_b211",
    scopes: ["read:plans"],
    lastUsed: "1d ago",
    createdAt: "2026-01-18",
  },
];

function APIPage() {
  const [keys, setKeys] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<APIKey | null>(null);

  return (
    <div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">API Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Issue API keys for first-party clients and partner integrations.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md"
        >
          <Plus className="h-4 w-4" /> New API key
        </button>
      </header>

      <section className="mt-6 rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <ul className="divide-y divide-border">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B]/15 to-[#2BC97F]/15 text-[#0E7C7B]">
                  <Key className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">{k.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded bg-surface-alt px-2 py-0.5 font-mono text-xs">
                      {k.prefix}••••••••
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(k.prefix);
                        toast.success("Prefix copied");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {k.scopes.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Created {new Date(k.createdAt).toLocaleDateString()} · Last used {k.lastUsed}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.message("Key rotated — old key valid for 24h")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Rotate
                </button>
                <button
                  onClick={() => setRevoking(k)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-error/30 bg-error-light/40 px-3 text-xs font-semibold text-error hover:bg-error-light"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Webhooks */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-bold text-foreground">Webhooks</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Subscribe an HTTPS endpoint to receive platform events.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-alt/50 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">No webhooks configured yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add an endpoint to receive `subscription.activated`, `session.completed`, and more.
          </p>
          <button
            onClick={() => toast.message("Webhook editor coming soon")}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-xs font-semibold text-white"
          >
            Add webhook endpoint
          </button>
        </div>
      </section>

      {creating && (
        <CreateKeyDialog
          onClose={() => setCreating(false)}
          onCreate={(name, scopes) => {
            const newKey: APIKey = {
              id: `k${Date.now()}`,
              name,
              prefix: `mqb_live_${Math.random().toString(36).slice(2, 6)}`,
              scopes,
              lastUsed: "—",
              createdAt: new Date().toISOString(),
            };
            setKeys([newKey, ...keys]);
            setCreating(false);
            toast.success(`Key created: ${newKey.prefix}••••••••`);
          }}
        />
      )}

      <ConfirmDialog
        open={!!revoking}
        title={`Revoke "${revoking?.name}"?`}
        description="The key will stop working immediately. Any client still using it will receive 401 errors."
        variant="destructive"
        typedConfirmation="REVOKE"
        confirmLabel="Revoke key"
        onCancel={() => setRevoking(null)}
        onConfirm={() => {
          setKeys(keys.filter((x) => x.id !== revoking?.id));
          setRevoking(null);
          toast.success("Key revoked");
        }}
      />
    </div>
  );
}

function CreateKeyDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, scopes: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read:banks"]);
  const allScopes = [
    "read:banks",
    "read:questions",
    "read:sessions",
    "read:users",
    "read:plans",
    "write:banks",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">New API key</h3>
        </header>
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Scopes
            </span>
            <div className="grid grid-cols-2 gap-2">
              {allScopes.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={scopes.includes(s)}
                    onChange={() =>
                      setScopes(scopes.includes(s) ? scopes.filter((x) => x !== s) : [...scopes, s])
                    }
                    className="accent-[#2BC97F]"
                  />
                  <code>{s}</code>
                </label>
              ))}
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            disabled={!name || scopes.length === 0}
            onClick={() => onCreate(name, scopes)}
            className="h-10 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Create key
          </button>
        </footer>
      </div>
    </div>
  );
}
