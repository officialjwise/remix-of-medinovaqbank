import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "@/components/layout/Stub";

export const Route = createFileRoute("/_app/subscription")({
  head: () => ({ meta: [{ title: "Subscription — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: () => <Stub title="Subscription" body="View your active plan, payment history, and renewal date." />,
});
