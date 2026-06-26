import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/activity-logs")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/audit-logs" });
  },
});
