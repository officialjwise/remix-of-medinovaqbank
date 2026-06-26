import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { Lock, ArrowRight, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_app/sessions_/active")({
  head: () => ({
    meta: [{ title: "Device Locked — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: ActiveSessionPage,
});

function ActiveSessionPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-error/10">
        <div className="absolute inset-0 animate-ping rounded-full bg-error/20" />
        <Lock className="h-10 w-10 text-error" />
        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface shadow-md">
          <ShieldAlert className="h-4 w-4 text-warning" />
        </div>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        Active Session Detected
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Your Medinovaqbank account is currently locked to another device. Trial users are limited to
        a single active device to prevent account sharing.
      </p>

      <div className="mt-8 w-full space-y-4">
        <div className="rounded-xl border border-border bg-surface p-5 text-left shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#00D4C8]">
            How to unlock
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-foreground">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-bold text-muted-foreground">
                1
              </span>
              <span>Log out from your previous device.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-bold text-muted-foreground">
                2
              </span>
              <span>Contact an administrator to clear your active device session.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-bold text-muted-foreground">
                3
              </span>
              <span>Upgrade your subscription to unlock multi-device access.</span>
            </li>
          </ul>
        </div>

        <Link
          to="/pricing"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4C8] to-[#3B82F6] px-5 py-3.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity"
        >
          Upgrade Subscription <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          onClick={() => {
            useAuthStore.getState().logout();
            navigate({ to: "/login" });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3.5 text-sm font-bold text-foreground hover:bg-surface-alt transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
