import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/settings/plans/create")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/subscriptions/plans/create" });
  },
});
