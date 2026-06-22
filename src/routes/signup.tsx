import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, GoogleButton } from "@/components/auth/AuthShell";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Medinovaqbank" },
      {
        name: "description",
        content:
          "Create your Medinovaqbank account and start studying with 50 free questions.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await authApi.signup(email, password, name);
      localStorage.setItem("accessToken", accessToken);
      login(accessToken, user);
      navigate({ to: "/" });
    } catch {
      setError("Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    navigate({ to: "/auth/callback", search: { token: "mock-google-token" } });
  }

  return (
    <AuthShell
      title="Start your prep today"
      subtitle="Create your account — 50 free questions, no card needed."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
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
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Dr. Bright Nketia"
          />
        </div>
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
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="At least 8 characters"
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
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our terms and privacy policy.
        </p>
      </form>
    </AuthShell>
  );
}
