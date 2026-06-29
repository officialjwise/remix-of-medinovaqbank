import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { NotificationsPanel } from "@/components/shared/NotificationsPanel";

export const Route = createFileRoute("/admin/notifications")({
  beforeLoad: () => requirePermission("notifications.read"),
  head: () => ({
    meta: [
      { title: "Admin · Notifications — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <NotificationsPanel audience="admin" />,
});
