import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, ArrowRight, ShieldAlert, Loader2, Monitor, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useActiveSessions, useTerminateSession, type DeviceSession } from "@/api/sessions.api";

export const Route = createFileRoute("/_app/sessions_/active")({
  head: () => ({
    meta: [{ title: "Device Locked — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: ActiveSessionPage,
});

function ActiveSessionPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useActiveSessions();
  const terminate = useTerminateSession();

  const sessions = data?.sessions ?? [];
  const lock = data?.deviceLock ?? null;

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
        {/* The device your trial is bound to / other active sessions. */}
        <div className="rounded-xl border border-border bg-surface p-5 text-left shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#00D4C8]">
            Your active devices
          </h3>

          {isLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking your devices…
            </div>
          ) : sessions.length === 0 && !lock ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No other active devices were found. Try signing in again.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {sessions.map((s) => (
                <SessionLine
                  key={s.id}
                  session={s}
                  onTerminate={() => terminate.mutate(s.id)}
                  terminating={terminate.isPending}
                />
              ))}
              {sessions.length === 0 && lock && (
                <li className="flex items-center gap-2.5 text-sm text-foreground">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Device bound {new Date(lock.lockedAt).toLocaleDateString()} ·{" "}
                    <span className="text-muted-foreground">{lock.fingerprint}</span>
                  </span>
                </li>
              )}
            </ul>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              How to unlock
            </h4>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2.5">
                <Step n={1} />
                <span>Sign out from your previous device above (or on that device).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Step n={2} />
                <span>Contact an administrator to clear your active device session.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Step n={3} />
                <span>Upgrade your subscription to unlock multi-device access.</span>
              </li>
            </ul>
          </div>
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

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-bold text-muted-foreground">
      {n}
    </span>
  );
}

function SessionLine({
  session,
  onTerminate,
  terminating,
}: {
  session: DeviceSession;
  onTerminate: () => void;
  terminating: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Monitor className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{session.deviceLabel}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            {session.location ?? "Unknown location"} · last active{" "}
            {new Date(session.lastPingAt).toLocaleString()}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onTerminate}
        disabled={terminating}
        className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[12px] font-semibold text-foreground hover:bg-error/10 hover:text-error hover:border-error/30 transition-all disabled:opacity-60"
      >
        {terminating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Sign out
      </button>
    </li>
  );
}
