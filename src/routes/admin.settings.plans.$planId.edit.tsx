import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/settings/plans/$planId/edit")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/admin/subscriptions/plans/$planId/edit", params: { planId: params.planId } });
  },
});
