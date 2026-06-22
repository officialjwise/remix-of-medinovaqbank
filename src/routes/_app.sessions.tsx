import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "@/components/layout/Stub";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({ meta: [{ title: "My Sessions — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: () => <Stub title="My Sessions" body="All your past quiz and tutor sessions, with full review available." />,
});
