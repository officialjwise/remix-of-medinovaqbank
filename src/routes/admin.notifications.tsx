import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPanel } from "@/components/shared/NotificationsPanel";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Admin · Notifications — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <NotificationsPanel audience="admin" />,
});
