import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

const placeholders = ["banks", "sessions", "leaderboard", "analytics", "profile", "subscription"] as const;
type P = (typeof placeholders)[number];

const meta: Record<P, { title: string; body: string }> = {
  banks: { title: "Question Banks", body: "Browse and filter all question banks across subjects and specialties." },
  sessions: { title: "My Sessions", body: "All your past quiz and tutor sessions, with full review available." },
  leaderboard: { title: "Leaderboard", body: "See where you rank against medical professionals nationwide." },
  analytics: { title: "Analytics", body: "Detailed performance breakdown by subject, system, and topic." },
  profile: { title: "Profile", body: "Manage your account details, specialty, and preferences." },
  subscription: { title: "Subscription", body: "View your active plan, payment history, and renewal date." },
};

function makeStub(slug: P) {
  return function Stub() {
    const m = meta[slug];
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card-surface p-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent">
            <Construction className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
            {m.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
          <p className="mt-6 inline-flex rounded-full bg-warning-light px-3 py-1 text-xs font-semibold text-warning">
            Coming in the next build pass
          </p>
        </div>
      </div>
    );
  };
}

export const Route = createFileRoute("/_app/banks")({
  head: () => ({ meta: [{ title: "Question Banks — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: makeStub("banks"),
});
