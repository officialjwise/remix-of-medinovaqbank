import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, CheckCheck, CreditCard, Sparkles, Trophy, Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Medinovaqbank" }] }),
  component: Notifications,
});

type Notif = {
  id: string;
  icon: typeof Bell;
  title: string;
  body: string;
  time: string;
  read: boolean;
  category: "billing" | "achievement" | "content" | "system";
};

const seed: Notif[] = [
  { id: "n1", icon: Trophy, title: "New personal best!", body: "You scored 92% on Cardiology Essentials — your highest yet.", time: "12 min ago", read: false, category: "achievement" },
  { id: "n2", icon: Sparkles, title: "New question bank: Endocrinology", body: "120 fresh clinical vignettes are live and included in your plan.", time: "3 hours ago", read: false, category: "content" },
  { id: "n3", icon: CreditCard, title: "Subscription renews soon", body: "Your 3-month plan renews on July 14 for GHS 249.", time: "Yesterday", read: true, category: "billing" },
  { id: "n4", icon: Megaphone, title: "Maintenance window scheduled", body: "We'll be unavailable Sunday 02:00–02:30 GMT for upgrades.", time: "2 days ago", read: true, category: "system" },
];

function Notifications() {
  const [items, setItems] = useState(seed);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = items.filter((n) => filter === "all" || !n.read);
  const unread = items.filter((n) => !n.read).length;

  function markAll() {
    setItems((it) => it.map((n) => ({ ...n, read: true })));
    toast.success("All caught up");
  }

  function toggleRead(id: string) {
    setItems((it) => it.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">{unread} unread of {items.length}</p>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-border bg-surface">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize ${filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-surface-alt"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={markAll} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">You're all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">New notifications will appear here.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => toggleRead(n.id)}
              className={`flex w-full items-start gap-4 border-b border-border px-5 py-4 text-left last:border-b-0 hover:bg-surface-alt ${!n.read ? "bg-accent/5" : ""}`}
            >
              <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${categoryStyles[n.category]}`}>
                <n.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const categoryStyles: Record<Notif["category"], string> = {
  billing: "bg-warning-light text-warning",
  achievement: "bg-success-light text-success",
  content: "bg-accent-light text-accent",
  system: "bg-surface-alt text-muted-foreground",
};
