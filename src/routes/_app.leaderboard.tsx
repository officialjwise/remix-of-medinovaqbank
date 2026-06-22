import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "@/components/layout/Stub";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: () => <Stub title="Leaderboard" body="See where you rank against medical professionals nationwide." />,
});
