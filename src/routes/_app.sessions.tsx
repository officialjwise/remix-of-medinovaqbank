import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import {
  useActiveSessions,
  useTerminateSession,
  type DeviceLock,
  type DeviceSession,
} from "@/api/sessions.api";
import { useSubscriptionStatus } from "@/api/payments.api";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({
    meta: [{ title: "Active Devices — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data, isLoading, isError } = useActiveSessions();
  const { data: subStatus } = useSubscriptionStatus();
  const sessions = data?.sessions ?? [];
  // The single-device lock only applies to trial users. Paid subscribers get
  // multi-device access, so never show them the trial lock banner.
  const deviceLock = subStatus?.hasActiveSubscription ? null : (data?.deviceLock ?? null);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
          Active Devices
        </h1>
        <p className="mt-2 text-[15px] font-medium text-muted-foreground">
          Devices currently signed in to your account. Sign out any you don’t recognize.
        </p>
      </div>

      {deviceLock && <DeviceLockBanner lock={deviceLock} />}

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.3)]">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-[15px] font-medium text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading devices…
          </div>
        )}
        {isError && !isLoading && (
          <div className="px-6 py-16 text-center text-[15px] font-medium text-error">
            Could not load your active devices. Please try again.
          </div>
        )}
        {!isLoading && !isError && sessions.length === 0 && (
          <div className="px-6 py-16 text-center text-[15px] font-medium text-muted-foreground">
            No active devices found.
          </div>
        )}

        {!isLoading &&
          sessions.map((s) => <SessionRow key={s.id} session={s} multiple={sessions.length > 1} />)}
      </div>
    </div>
  );
}

function DeviceLockBanner({ lock }: { lock: DeviceLock }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
      <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
      <div className="text-sm">
        <p className="font-bold text-foreground">Trial device lock active</p>
        <p className="mt-1 text-muted-foreground">
          Your trial is locked to a single device (bound{" "}
          {new Date(lock.lockedAt).toLocaleDateString()}). Logging in from a new device will be
          blocked. Upgrade to a paid plan for multi-device access.
        </p>
      </div>
    </div>
  );
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === "mobile") return <Smartphone className="h-5 w-5" />;
  if (type === "tablet") return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function SessionRow({ session, multiple }: { session: DeviceSession; multiple: boolean }) {
  const terminate = useTerminateSession();
  const [confirming, setConfirming] = useState(false);

  const lastSeen = new Date(session.lastPingAt);

  return (
    <div className="flex flex-col gap-3 border-b border-white/5 px-6 py-4 last:border-b-0 sm:flex-row sm:items-center hover:bg-surface-alt/30 transition-colors">
      <div className="flex flex-1 items-start gap-3">
        <span
          className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
            session.isSuspicious ? "bg-error/10 text-error" : "bg-[#00D4C8]/10 text-[#00D4C8]"
          }`}
        >
          <DeviceIcon type={session.deviceType} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">{session.deviceLabel}</span>
            {session.isSuspicious ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-error border border-error/20">
                <AlertTriangle className="h-3 w-3" /> Suspicious
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success border border-success/20">
                <ShieldCheck className="h-3 w-3" /> Trusted
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {[session.location, session.ipAddress].filter(Boolean).join(" · ") ||
              "Unknown location"}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Last active {lastSeen.toLocaleString()} · {session.fingerprint}
          </p>
          {session.isSuspicious && session.suspiciousReasons.length > 0 && (
            <p className="mt-0.5 text-[12px] font-medium text-error">
              {session.suspiciousReasons.map((r) => r.replace(/_/g, " ")).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center sm:justify-end">
        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => terminate.mutate(session.id)}
              disabled={terminate.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-error px-3 text-[13px] font-bold text-white hover:opacity-90 transition-all disabled:opacity-60"
            >
              {terminate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Confirm sign out
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={terminate.isPending}
              className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-surface px-3 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!multiple}
            title={
              multiple ? "Sign out this device" : "Cannot sign out your only active device here"
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 text-[13px] font-semibold text-foreground hover:bg-error/10 hover:text-error hover:border-error/30 transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-foreground disabled:hover:border-white/10"
          >
            <Trash2 className="h-4 w-4" /> Sign out
          </button>
        )}
      </div>

      {terminate.isError && (
        <p className="text-[12px] font-medium text-error sm:hidden">
          Could not sign out this device.
        </p>
      )}
    </div>
  );
}
