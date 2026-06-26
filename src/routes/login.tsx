import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { AuthSplit, AuthDivider, GoogleButton } from "@/components/auth/AuthSplit";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/stores/authStore";

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
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState(DEV_MODE ? "admin@example.com" : "");
  const [password, setPassword] = useState(DEV_MODE ? "any-password" : "");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleGoogle() {
    // Real flow: window.location.href = `${API_URL}/api/auth/google`
    navigate({ to: "/auth/callback", search: { token: "mock-google-token" } });
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await authApi.adminLogin(email, password);
      localStorage.setItem("accessToken", accessToken);
      login(accessToken, user);

      // Redirect based on role
      if (user.role === "SUPER_ADMIN") {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
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
