import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface SubscriptionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const subscription = useAuthStore((s) => s.subscription);
  const isActive = subscription?.status === "ACTIVE";
  const isTrial = subscription?.status === "TRIAL";
  const trialLeft = subscription?.trialQuestionsLeft ?? 0;

  if (isActive || (isTrial && trialLeft > 0)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <DefaultUpgradeCTA />}</>;
}

export function UpgradeCTA({ title, body }: { title?: string; body?: string } = {}) {
  return <DefaultUpgradeCTA title={title} body={body} />;
}

function DefaultUpgradeCTA({ title, body }: { title?: string; body?: string } = {}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Lock className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
        {title ?? "Upgrade to keep practising"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {body ?? "Your free trial questions are exhausted. Subscribe to unlock unlimited access to every question bank, Detailed explanations, and analytics."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          to="/subscription"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-bold text-accent-foreground hover:bg-accent/90"
        >
          <Sparkles className="h-4 w-4" /> See Plans
        </Link>
        <Link
          to="/pricing"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt"
        >
          Compare Plans
        </Link>
      </div>
    </div>
  );
}
