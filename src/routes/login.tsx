import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, GoogleButton } from "@/components/auth/AuthShell";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Medinovaqbank" },
      { name: "description", content: "Sign in to your Medinovaqbank account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await authApi.login(email, password);
      localStorage.setItem("accessToken", accessToken);
      login(accessToken, user);
      navigate({ to: "/" });
    } catch {
      setError("Could not sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    // Real flow: window.location.href = `${API_URL}/api/auth/google`
    navigate({ to: "/auth/callback", search: { token: "mock-google-token" } });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your prep."
      footer={
        <>
          New to Medinovaqbank?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton onClick={handleGoogle} />

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="you@hospital.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <a className="text-xs font-medium text-accent hover:underline" href="#">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
