import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "@/components/layout/Stub";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: () => <Stub title="Analytics" body="Detailed performance breakdown by subject, system, and topic — bell curves and percentile included." />,
});
