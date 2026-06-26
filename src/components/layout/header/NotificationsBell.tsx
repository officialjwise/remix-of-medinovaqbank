import { useState } from "react";
import { Bell } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface HeaderNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  tone?: "default" | "success" | "warning" | "error";
}

const toneDot: Record<string, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

export function NotificationsBell({
  notifications,
  tone = "default",
}: {
  notifications: HeaderNotification[];
  tone?: "default" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const [items, setItems] = useState(notifications);
  const unread = items.filter((n) => n.unread).length;

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
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card-hover)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-foreground">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => setItems(items.map((n) => ({ ...n, unread: false })))}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">You're all caught up 🎉</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setItems(items.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                  className={`flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-alt ${
                    n.unread ? "bg-accent/[0.04]" : ""
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${toneDot[n.tone ?? "default"]} ${n.unread ? "" : "opacity-30"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{n.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-1 block text-[11px] font-medium text-muted-foreground/70">{n.time}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
