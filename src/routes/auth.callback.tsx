import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { authApi, establishSession } from "@/api/auth.api";
import { ApiError } from "@/api/client";

/**
 * The backend Google callback redirects here with the credentials in the URL
 * FRAGMENT (#accessToken=…&refreshToken=… for existing users, or
 * #twoFactorToken=… when 2FA is enabled). Fragments never reach the server or
 * the Referer header; we read them once on the client and immediately wipe the
 * hash from the address bar/history.
 */
function readAuthHash(): {
  accessToken?: string;
  refreshToken?: string;
  twoFactorToken?: string;
  error?: string;
} {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    accessToken: params.get("accessToken") ?? undefined,
    refreshToken: params.get("refreshToken") ?? undefined,
    twoFactorToken: params.get("twoFactorToken") ?? undefined,
    error: params.get("error") ?? undefined,
  };
}

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Verifying your account… — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  // Read the fragment once, then scrub it from the URL so the token never
  // lingers in the address bar or browser history.
  const [{ accessToken, refreshToken, twoFactorToken, error }] = useState(readAuthHash);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // 2FA flows are handled interactively below — skip the auto token exchange.
    if (twoFactorToken) return;

    let cancelled = false;
    (async () => {
      if (error || !accessToken || !refreshToken) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const user = await establishSession({
          accessToken,
          refreshToken,
          tokenType: "Bearer",
          expiresIn: 0,
        });
        if (cancelled) return;
        navigate({ to: user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard" });
      } catch {
        if (!cancelled) navigate({ to: "/login" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshToken, twoFactorToken, error, navigate]);

  if (twoFactorToken) {
    return <TwoFactorPrompt challengeToken={twoFactorToken} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Verifying your account…</p>
      </div>
    </div>
  );
}

function TwoFactorPrompt({ challengeToken }: { challengeToken: string }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokens = await authApi.verifyTwoFactor(challengeToken, code.trim());
      const user = await establishSession(tokens);
      toast.success("Welcome back!");
      navigate({ to: user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid or expired code.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit>
      <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Two-step verification</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app to finish signing in.
      </p>

      <form onSubmit={handleVerify} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="code">
            Verification code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={6}
            pattern="\d{6}"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-center text-lg font-semibold tracking-[0.4em] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="000000"
          />
        </div>

        {error && <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify & continue"
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          disabled={loading}
          className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          Back to sign in
        </button>
      </form>
    </AuthSplit>
  );
}
