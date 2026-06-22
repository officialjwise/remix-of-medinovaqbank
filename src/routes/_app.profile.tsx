import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "@/components/layout/Stub";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: () => <Stub title="Profile" body="Manage your account details, specialty, and preferences." />,
});
