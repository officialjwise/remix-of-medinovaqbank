import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import {
  AuthSplit,
  AuthDivider,
  GoogleButton,
} from "@/components/auth/AuthSplit";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Administrator Sign in — Medinovaqbank" },
      { name: "description", content: "Medinovaqbank administrator console access." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await authApi.adminLogin(email, password);
      localStorage.setItem("accessToken", accessToken);
      login(accessToken, user);
      navigate({ to: "/admin/dashboard" });
    } catch {
      setError("Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const { accessToken, user } = await authApi.adminGoogleCallback("mock");
    localStorage.setItem("accessToken", accessToken);
    login(accessToken, user);
    navigate({ to: "/admin/dashboard" });
  }

  return (
    <AuthSplit
      brandHeadline="Admin Console."
      brandSubline="Run the platform."
      brandHighlight={
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-sm leading-relaxed text-white/85">
            Manage questions, users, subscriptions, and platform performance
            from a single, distraction-free console.
          </p>
        </div>
      }
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">
        Administrator Access
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Medinovaqbank Admin Panel
      </p>

      <div className="mt-8">
        <GoogleButton
          onClick={handleGoogle}
          label="Sign in with Google (linked admins)"
        />
      </div>

      <AuthDivider />

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
            placeholder="admin@medinova.app"
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
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <a href="#" className="font-medium text-muted-foreground hover:text-foreground">
          Forgot password?
        </a>
        <Link to="/" className="font-medium text-accent hover:underline">
          ← Back to main site
        </Link>
      </div>
    </AuthSplit>
  );
}
