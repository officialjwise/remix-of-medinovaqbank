import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPanel } from "@/components/shared/NotificationsPanel";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Medinovaqbank" }] }),
  component: () => (
    <div className="mx-auto max-w-4xl">
      <NotificationsPanel audience="user" />
    </div>
  ),
});
