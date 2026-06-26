import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/subscriptions")({
  component: () => <Outlet />,
});
