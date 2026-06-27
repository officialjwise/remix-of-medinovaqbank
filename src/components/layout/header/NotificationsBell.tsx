import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  notificationKeys,
  type NotifAudience,
  type NotifType,
} from "@/api/notifications.api";
import { useRealtimeStream } from "@/lib/realtime";

const toneDot: Record<NotifType, string> = {
  signup: "bg-success",
  payment_failed: "bg-error",
  payment_success: "bg-success",
  flagged_question: "bg-warning",
  suspicious_login: "bg-error",
  api_error: "bg-warning",
  subscription: "bg-primary",
  trial: "bg-warning",
  rank: "bg-primary",
  new_bank: "bg-accent",
  achievement: "bg-success",
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function NotificationsBell({
  audience: _audience,
  viewAllHref,
  tone = "default",
}: {
  // `audience` is informational only; the backend scopes rows to the user.
  audience: NotifAudience;
  viewAllHref: string;
  tone?: "default" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const navigate = useNavigate();
  const qc = useQueryClient();
  // Live bell: refresh count + list the instant a notification arrives over SSE;
  // useUnreadCount's polling interval remains as a fallback if SSE is unavailable.
  useRealtimeStream("notifications", {
    notification: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
  const { data: unreadCount } = useUnreadCount();
  // Only fetch the recent list while the dropdown is open.
  const { data } = useNotifications({ limit: 6 }, { enabled: open });
  const markReadMut = useMarkNotificationRead();
  const markAllReadMut = useMarkAllNotificationsRead();
  const markRead = (id: string) => markReadMut.mutate(id);
  const markAllRead = () => markAllReadMut.mutate();
  const unread = unreadCount ?? 0;
  const recent = data?.items.slice(0, 6) ?? [];

  const btnClass =
    tone === "dark"
      ? "text-white/70 hover:bg-white/10 hover:text-white"
      : "text-muted-foreground hover:bg-surface-alt hover:text-foreground";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative rounded-lg p-2 transition-colors ${btnClass}`}
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card-hover)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-foreground">
              Notifications{" "}
              {unread > 0 && <span className="text-muted-foreground">· {unread} new</span>}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                You're all caught up 🎉
              </p>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    if (n.href) navigate({ to: n.href });
                  }}
                  className={`flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-alt ${n.read ? "" : "bg-accent/[0.04]"}`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${toneDot[n.type]} ${n.read ? "opacity-30" : ""}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{n.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-1 block text-[11px] font-medium text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link
            to={viewAllHref}
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-accent hover:bg-surface-alt"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
