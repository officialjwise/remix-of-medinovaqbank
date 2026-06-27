import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Key, Plus, RotateCcw, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import {
  useApiKeys,
  useCreateApiKey,
  useRotateApiKey,
  useRevokeApiKey,
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  type ApiKey,
  type ApiKeyWithSecret,
  type Webhook,
} from "@/api/api-keys.api";

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

const ALL_SCOPES = [
  "read:banks",
  "read:questions",
  "read:sessions",
  "read:users",
  "read:plans",
  "write:banks",
];

const ALL_EVENTS = [
  "subscription.activated",
  "subscription.cancelled",
  "session.completed",
  "user.registered",
  "payment.succeeded",
];

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "never";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function APIPage() {
  const keysQuery = useApiKeys();
  const createKey = useCreateApiKey();
  const rotateKey = useRotateApiKey();
  const revokeKey = useRevokeApiKey();

  const keys = keysQuery.data ?? [];

  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const [rotatingTarget, setRotatingTarget] = useState<ApiKey | null>(null);
  /** The plaintext key surfaced once on create/rotate. */
  const [reveal, setReveal] = useState<ApiKeyWithSecret | null>(null);

  function handleRotate(k: ApiKey) {
    rotateKey.mutate(k.id, {
      onSuccess: (result) => {
        setReveal(result);
        setRotatingTarget(null);
        toast.success("Key rotated — copy the new value now");
      },
      onError: (err) => {
        setRotatingTarget(null);
        toast.error(err instanceof Error ? err.message : "Failed to rotate key");
      },
    });
  }

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
        {keysQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-alt/50" />
            ))}
          </div>
        ) : keysQuery.isError ? (
          <div className="p-5 text-sm text-error">
            {keysQuery.error instanceof Error
              ? keysQuery.error.message
              : "Failed to load API keys."}
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-foreground">No API keys yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a key to let a client authenticate against the API.
            </p>
          </div>
        ) : (
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
                    <p className="font-bold text-foreground">
                      {k.name}
                      {k.isRevoked && (
                        <span className="ml-2 rounded-full bg-error-light/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-error">
                          Revoked
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded bg-surface-alt px-2 py-0.5 font-mono text-xs">
                        {k.prefix}••••••••
                      </code>
                      <button
                        onClick={() => {
                          void navigator.clipboard.writeText(k.prefix);
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
                      Created {new Date(k.createdAt).toLocaleDateString()} · Last used{" "}
                      {timeAgo(k.lastUsedAt)}
                    </p>
                  </div>
                </div>
                {!k.isRevoked && (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={rotateKey.isPending}
                      onClick={() => setRotatingTarget(k)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50"
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
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <WebhooksSection />

      {creating && (
        <CreateKeyDialog
          submitting={createKey.isPending}
          onClose={() => setCreating(false)}
          onCreate={(name, scopes) =>
            createKey.mutate(
              { name, scopes },
              {
                onSuccess: (result) => {
                  setReveal(result);
                  setCreating(false);
                  toast.success("Key created — copy it now");
                },
                onError: (err) =>
                  toast.error(err instanceof Error ? err.message : "Failed to create key"),
              },
            )
          }
        />
      )}

      {reveal && <RevealKeyDialog apiKey={reveal} onClose={() => setReveal(null)} />}

      <ConfirmDialog
        open={!!rotatingTarget}
        title={`Rotate "${rotatingTarget?.name}"?`}
        description="A new key will be generated and shown once. The current key stops working immediately."
        confirmLabel="Rotate key"
        onCancel={() => setRotatingTarget(null)}
        onConfirm={() => {
          if (rotatingTarget) handleRotate(rotatingTarget);
        }}
      />

      <ConfirmDialog
        open={!!revoking}
        title={`Revoke "${revoking?.name}"?`}
        description="The key will stop working immediately. Any client still using it will receive 401 errors."
        variant="destructive"
        typedConfirmation="REVOKE"
        confirmLabel="Revoke key"
        onCancel={() => setRevoking(null)}
        onConfirm={() => {
          if (!revoking) return;
          const target = revoking;
          revokeKey.mutate(target.id, {
            onSuccess: () => {
              setRevoking(null);
              toast.success("Key revoked");
            },
            onError: (err) => {
              setRevoking(null);
              toast.error(err instanceof Error ? err.message : "Failed to revoke key");
            },
          });
        }}
      />
    </div>
  );
}

function WebhooksSection() {
  const webhooksQuery = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const webhooks = webhooksQuery.data ?? [];
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Webhook | null>(null);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Webhooks</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Subscribe an HTTPS endpoint to receive platform events.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
        >
          <Plus className="h-3.5 w-3.5" /> Add endpoint
        </button>
      </div>

      <div className="mt-4">
        {webhooksQuery.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-surface-alt/50" />
        ) : webhooksQuery.isError ? (
          <p className="text-sm text-error">
            {webhooksQuery.error instanceof Error
              ? webhooksQuery.error.message
              : "Failed to load webhooks."}
          </p>
        ) : webhooks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-alt/50 p-6 text-center">
            <p className="text-sm font-semibold text-foreground">No webhooks configured yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add an endpoint to receive subscription.activated, session.completed, and more.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {webhooks.map((w) => (
              <li
                key={w.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C7B]/15 to-[#2BC97F]/15 text-[#0E7C7B]">
                    <WebhookIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="break-all font-mono text-sm font-semibold text-foreground">
                      {w.url}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {w.events.map((e) => (
                        <span
                          key={e}
                          className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {w.isActive ? "Active" : "Disabled"} · Created{" "}
                      {new Date(w.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleting(w)}
                  className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg border border-error/30 bg-error-light/40 px-3 text-xs font-semibold text-error hover:bg-error-light"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {adding && (
        <CreateWebhookDialog
          submitting={createWebhook.isPending}
          onClose={() => setAdding(false)}
          onCreate={(url, events) =>
            createWebhook.mutate(
              { url, events },
              {
                onSuccess: () => {
                  setAdding(false);
                  toast.success("Webhook created");
                },
                onError: (err) =>
                  toast.error(err instanceof Error ? err.message : "Failed to create webhook"),
              },
            )
          }
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete webhook?"
        description="The endpoint will stop receiving events immediately."
        variant="destructive"
        confirmLabel="Delete webhook"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteWebhook.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success("Webhook deleted");
            },
            onError: (err) => {
              setDeleting(null);
              toast.error(err instanceof Error ? err.message : "Failed to delete webhook");
            },
          });
        }}
      />
    </section>
  );
}

function RevealKeyDialog({ apiKey, onClose }: { apiKey: ApiKeyWithSecret; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">Copy your API key</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            This is the only time the full key for <strong>{apiKey.name}</strong> will be shown.
            Store it securely — it cannot be retrieved again.
          </p>
        </header>
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2.5">
            <code className="flex-1 break-all font-mono text-xs text-foreground">{apiKey.key}</code>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(apiKey.key);
                setCopied(true);
                toast.success("API key copied");
              }}
              className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-3 text-xs font-semibold text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

function CreateKeyDialog({
  onClose,
  onCreate,
  submitting,
}: {
  onClose: () => void;
  onCreate: (name: string, scopes: string[]) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read:banks"]);

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
              {ALL_SCOPES.map((s) => (
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
            disabled={!name || submitting}
            onClick={() => onCreate(name, scopes)}
            className="h-10 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create key"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function CreateWebhookDialog({
  onClose,
  onCreate,
  submitting,
}: {
  onClose: () => void;
  onCreate: (url: string, events: string[]) => void;
  submitting: boolean;
}) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([ALL_EVENTS[0]]);

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
          <h3 className="text-base font-bold text-foreground">Add webhook endpoint</h3>
        </header>
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Endpoint URL
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks/medinovaqbank"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Events
            </span>
            <div className="grid gap-2">
              {ALL_EVENTS.map((ev) => (
                <label
                  key={ev}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={events.includes(ev)}
                    onChange={() =>
                      setEvents(
                        events.includes(ev) ? events.filter((x) => x !== ev) : [...events, ev],
                      )
                    }
                    className="accent-[#2BC97F]"
                  />
                  <code>{ev}</code>
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
            disabled={!url || events.length === 0 || submitting}
            onClick={() => onCreate(url, events)}
            className="h-10 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add webhook"}
          </button>
        </footer>
      </div>
    </div>
  );
}
