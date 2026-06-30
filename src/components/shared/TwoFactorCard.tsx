import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
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

/** Save the one-time backup codes to a .txt file the user can keep. */
function downloadBackupCodes(codes: string[]): void {
  const body = [
    "Medinovaqbank — two-factor backup codes",
    "Each code works once. Use one in place of your authenticator code if you",
    "lose your device. Keep this file somewhere safe and private.",
    "",
    ...codes,
    "",
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "medinovaqbank-backup-codes.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Lightweight centered modal (backdrop click + ✕ close). */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Self-service Authenticator-app (TOTP) two-factor for any signed-in account.
 * Enable opens a modal: scan the QR → verify a code → save one-time word-based
 * backup codes (download or copy). Self-contained card for either profile page.
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

  async function copyCodes() {
    if (!backupCodes) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      toast.success("Backup codes copied");
    } catch {
      toast.error("Couldn't copy — use Download instead");
    }
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

      {/* Primary action */}
      {!isLoading && (
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

      {/* Enrollment modal — QR + manual key + verify */}
      {enrollment && !enabled && (
        <Modal title="Enable two-factor authentication" onClose={() => setEnrollment(null)}>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">1. Scan this QR with your app</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <img
                src={enrollment.qrCodeDataUrl}
                alt="Two-factor QR code"
                className="h-60 w-60 flex-shrink-0 rounded-xl border border-border bg-white p-2"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  Can't scan? Enter this setup key manually:
                </p>
                <code className="mt-1 block break-all rounded-md bg-surface-alt px-3 py-2 font-mono text-sm text-foreground">
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
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && confirmCode()}
                placeholder="123456"
                className="h-11 w-36 rounded-lg border border-border bg-surface px-3 text-center font-mono text-lg tracking-widest text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                disabled={verify.isPending}
                onClick={confirmCode}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
              >
                {verify.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Verify &amp; enable
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Backup codes modal — shown once after verification */}
      {backupCodes && (
        <Modal title="Save your backup codes" onClose={() => setBackupCodes(null)}>
          <p className="text-sm text-muted-foreground">
            Each code works once if you lose your device — enter one in place of your authenticator
            code to sign in. They won't be shown again, so download or copy them now.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 font-mono text-sm sm:grid-cols-2">
            {backupCodes.map((c) => (
              <span
                key={c}
                className="rounded-md border border-border bg-surface-alt px-3 py-1.5 text-center text-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadBackupCodes(backupCodes)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white hover:opacity-90"
            >
              <Download className="h-4 w-4" /> Download .txt
            </button>
            <button
              type="button"
              onClick={copyCodes}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
            <button
              type="button"
              onClick={() => setBackupCodes(null)}
              className="ml-auto inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              I've saved them
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
