import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useRemoveNotification,
  type NotifAudience,
  type NotifType,
} from "@/api/notifications.api";

const TYPE_META: Record<NotifType, { label: string; dot: string; chip: string }> = {
  signup: { label: "Signups", dot: "bg-success", chip: "bg-success/10 text-success" },
  payment_failed: { label: "Payment failed", dot: "bg-error", chip: "bg-error/10 text-error" },
  payment_success: { label: "Payments", dot: "bg-success", chip: "bg-success/10 text-success" },
  flagged_question: { label: "Flagged", dot: "bg-warning", chip: "bg-warning/10 text-warning" },
  suspicious_login: { label: "Security", dot: "bg-error", chip: "bg-error/10 text-error" },
  api_error: { label: "API", dot: "bg-warning", chip: "bg-warning/10 text-warning" },
  subscription: { label: "Subscriptions", dot: "bg-primary", chip: "bg-primary/10 text-primary" },
  trial: { label: "Trial", dot: "bg-warning", chip: "bg-warning/10 text-warning" },
  rank: { label: "Leaderboard", dot: "bg-primary", chip: "bg-primary/10 text-primary" },
  new_bank: { label: "New content", dot: "bg-accent", chip: "bg-accent/10 text-accent" },
  achievement: { label: "Achievements", dot: "bg-success", chip: "bg-success/10 text-success" },
  breakdown: { label: "Breakdowns", dot: "bg-primary", chip: "bg-primary/10 text-primary" },
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function NotificationsPanel({ audience: _audience }: { audience: NotifAudience }) {
  // `audience` is informational only: the backend already scopes rows to the
  // current user (admins receive admin-audience rows, users receive user rows).
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markReadMut = useMarkNotificationRead();
  const markAllReadMut = useMarkAllNotificationsRead();
  const removeMut = useRemoveNotification();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread" | NotifType>("all");

  const items = useMemo(() => data?.items ?? [], [data]);
  const markRead = (id: string) => markReadMut.mutate(id);
  const markAllRead = () => markAllReadMut.mutate();
  const remove = (id: string) => removeMut.mutate(id);

  const types = useMemo(() => [...new Set(items.map((i) => i.type))], [items]);
  const filtered = items.filter((n) =>
    filter === "all" ? true : filter === "unread" ? !n.read : n.type === filter,
  );
  const unread = data?.unreadCount ?? items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread} unread · {items.length} total
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => {
              markAllRead();
              toast.success("All marked as read");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "unread", ...types] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}
          >
            {f === "all" ? "All" : f === "unread" ? "Unread" : TYPE_META[f as NotifType].label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">Nothing here</p>
            <p className="mt-1 text-xs text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type];
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-surface-alt/40 ${n.read ? "" : "bg-accent/[0.04]"}`}
                >
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${meta.dot} ${n.read ? "opacity-30" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      if (n.href) navigate({ to: n.href });
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{n.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </p>
                  </button>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        title="Mark read"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {n.href && (
                      <button
                        onClick={() => {
                          markRead(n.id);
                          navigate({ to: n.href! });
                        }}
                        title="Open"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        remove(n.id);
                        toast.success("Notification dismissed");
                      }}
                      title="Dismiss"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
