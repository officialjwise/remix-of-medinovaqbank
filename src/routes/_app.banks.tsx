import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "@/components/layout/Stub";

export const Route = createFileRoute("/_app/banks")({
  head: () => ({ meta: [{ title: "Question Banks — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: () => <Stub title="Question Banks" body="Browse and filter all question banks across subjects and specialties." />,
});
