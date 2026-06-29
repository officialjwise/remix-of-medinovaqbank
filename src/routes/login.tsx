import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { isAdminRole } from "@/lib/roles";
import { useState } from "react";
import { Eye, EyeOff, LogIn, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthSplit, AuthDivider, GoogleButton } from "@/components/auth/AuthSplit";
import type { User } from "@/types";
import { authApi, establishSession, isTwoFactorChallenge } from "@/api/auth.api";
import { ApiError } from "@/api/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Welcome Back — Medinovaqbank" },
      {
        name: "description",
        content: "Sign in to Medinovaqbank and continue your medical exam prep.",
      },
    ],
  }),
  component: LoginPage,
});

// For dev/demo only, silently pre-fill
const DEV_MODE = import.meta.env.DEV;

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA challenge step: set once /auth/login signals it needs a code.
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  function routeByRole(user: User) {
    navigate({ to: isAdminRole(user.role) ? "/admin/dashboard" : "/dashboard" });
  }

  function handleGoogle() {
    // Full-page redirect to the backend OAuth entry point.
    window.location.href = authApi.googleUrl();
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login(email, password);

      // 2FA-enabled accounts: swap the form into the code-entry step.
      if (isTwoFactorChallenge(result)) {
        setChallengeToken(result.challengeToken);
        setCode("");
        toast.info("Enter the 6-digit code from your authenticator app.");
        return;
      }

      const user = await establishSession(result);
      toast.success("Welcome back!");
      routeByRole(user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid credentials.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setLoading(true);
    setError(null);
    try {
      const tokens = await authApi.verifyTwoFactor(challengeToken, code.trim());
      const user = await establishSession(tokens);
      toast.success("Welcome back!");
      routeByRole(user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid or expired code.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function cancelTwoFactor() {
    setChallengeToken(null);
    setCode("");
    setError(null);
  }

  // ── 2FA code-entry step ──
  if (challengeToken) {
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

          {error && (
            <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">{error}</p>
          )}

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
            onClick={cancelTwoFactor}
            disabled={loading}
            className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            Back to sign in
          </button>
        </form>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit>
      <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
        <LogIn className="h-6 w-6" />
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to continue your medical journey.
      </p>

      <div className="mt-8">
        <GoogleButton onClick={handleGoogle} />
      </div>

      <AuthDivider />

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 pr-11 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link
          to="/forgot-password"
          className="font-medium text-muted-foreground hover:text-foreground"
        >
          Forgot password?
        </Link>
        {DEV_MODE && (
          <span className="text-[10px] text-muted-foreground bg-surface-alt px-2 py-0.5 rounded">
            DEV MODE
          </span>
        )}
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link to="/terms" className="font-medium text-foreground hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="font-medium text-foreground hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Medinovaqbank?{" "}
        <Link to="/register" className="font-semibold text-primary hover:text-primary-light">
          Create a free account
        </Link>
      </p>
    </AuthSplit>
  );
}
