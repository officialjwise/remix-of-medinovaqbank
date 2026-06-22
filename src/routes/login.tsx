import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthSplit, AuthDivider, GoogleButton } from "@/components/auth/AuthSplit";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Medinovaqbank" },
      {
        name: "description",
        content:
          "Sign in to Medinovaqbank with your Google account and continue your medical exam prep.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  function handleGoogle() {
    // Real flow: window.location.href = `${API_URL}/api/auth/google`
    navigate({ to: "/auth/callback", search: { token: "mock-google-token" } });
  }

  return (
    <AuthSplit>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to continue your medical journey.
      </p>

      <div className="mt-8">
        <GoogleButton onClick={handleGoogle} />
      </div>

      <AuthDivider />

      <div className="flex items-center justify-between text-sm">
        <Link to="/admin/login" className="font-medium text-accent hover:underline">
          Admin sign in →
        </Link>
        <Link to="/forgot-password" className="font-medium text-muted-foreground hover:text-foreground">
          Forgot password?
        </Link>
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link to="/terms" className="font-medium text-foreground hover:underline">Terms of Service</Link>{" "}
        and{" "}
        <Link to="/privacy" className="font-medium text-foreground hover:underline">Privacy Policy</Link>.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        New to Medinovaqbank? Sign up with Google above — first 10 questions are
        free.
      </p>
    </AuthSplit>
  );
}
