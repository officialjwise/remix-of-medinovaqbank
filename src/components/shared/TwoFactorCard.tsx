import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";
import { ApiError } from "@/api/client";
import {
  useTwoFactorStatus,
  useEnrollTwoFactor,
  useVerifyTwoFactor,
  useDisableTwoFactor,
  type TwoFactorEnrollment,
} from "@/api/two-factor.api";

function errMsg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

/**
 * Self-service Authenticator-app (TOTP) two-factor for any signed-in account
 * (users and admins). Enroll → scan the QR (or enter the key) → verify a code →
 * save one-time backup codes → optionally disable. Self-contained card so it can
 * be dropped into either profile page.
 */
export function TwoFactorCard() {
  const { data: status, isLoading } = useTwoFactorStatus();
  const enroll = useEnrollTwoFactor();
  const verify = useVerifyTwoFactor();
  const disable = useDisableTwoFactor();

  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const enabled = status?.enabled ?? false;

  function startEnroll() {
    enroll.mutate(undefined, {
      onSuccess: (data) => {
        setEnrollment(data);
        setBackupCodes(null);
        setCode("");
      },
      onError: (e) => toast.error(errMsg(e, "Could not start 2FA setup")),
    });
  }

  function confirmCode() {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    verify.mutate(code, {
      onSuccess: (res) => {
        setBackupCodes(res.backupCodes);
        setEnrollment(null);
        toast.success("Two-factor authentication enabled");
      },
      onError: (e) => toast.error(errMsg(e, "Invalid code — try again")),
    });
  }

  function turnOff() {
    disable.mutate(undefined, {
      onSuccess: () => {
        setBackupCodes(null);
        toast.success("Two-factor authentication disabled");
      },
      onError: (e) => toast.error(errMsg(e, "Could not disable 2FA")),
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Authenticator app (TOTP)
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Add a one-time code from an authenticator app (Google Authenticator, Authy, 1Password) at
          sign-in.
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface-alt/40 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Two-factor authentication</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isLoading
                ? "Checking status…"
                : enabled
                  ? "Enabled — you'll be asked for a code when you sign in."
                  : "Not enabled. Protect your account with a second step."}
            </p>
          </div>
        </div>
        {!isLoading &&
          (enabled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
              <ShieldCheck className="h-3.5 w-3.5" /> Enabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" /> Off
            </span>
          ))}
      </div>

      {/* Backup codes (shown once after verification) */}
      {backupCodes && (
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-bold text-foreground">Save your backup codes</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each code works once if you lose your device. They won't be shown again.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-3">
            {backupCodes.map((c) => (
              <span key={c} className="rounded-md bg-surface px-2 py-1 text-center text-foreground">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Enrollment flow — QR + manual key */}
      {enrollment && !enabled && (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-surface-alt/30 p-4">
          <p className="text-sm font-semibold text-foreground">1. Scan this QR with your app</p>
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={enrollment.qrCodeDataUrl}
              alt="Two-factor QR code"
              className="h-40 w-40 rounded-lg border border-border bg-white p-1"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                Can't scan? Enter this setup key manually:
              </p>
              <code className="mt-1 block break-all rounded-md bg-surface px-3 py-2 font-mono text-sm text-foreground">
                {enrollment.secret}
              </code>
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">
            2. Enter the 6-digit code it shows
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="h-10 w-32 rounded-lg border border-border bg-surface px-3 text-center font-mono text-lg tracking-widest text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              disabled={verify.isPending}
              onClick={confirmCode}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {verify.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Verify &amp; enable
            </button>
            <button
              type="button"
              onClick={() => setEnrollment(null)}
              className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Primary action */}
      {!isLoading && !enrollment && (
        <div className="mt-4">
          {enabled ? (
            <button
              type="button"
              disabled={disable.isPending}
              onClick={turnOff}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-4 text-sm font-semibold text-error hover:bg-error/10 disabled:opacity-60"
            >
              {disable.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Disable 2FA
            </button>
          ) : (
            <button
              type="button"
              disabled={enroll.isPending}
              onClick={startEnroll}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {enroll.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enable 2FA
            </button>
          )}
        </div>
      )}
    </section>
  );
}
