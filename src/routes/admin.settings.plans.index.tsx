import { createFileRoute, redirect } from "@tanstack/react-router";

// Plans moved under Billing & Subscriptions.
export const Route = createFileRoute("/admin/settings/plans/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/subscriptions/plans" });
  },
});
