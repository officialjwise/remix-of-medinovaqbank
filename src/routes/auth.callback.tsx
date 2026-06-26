import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { establishSession } from "@/api/auth.api";

// The backend Google callback redirects here with a token pair for existing
// users (new users are sent to /auth/onboarding instead).
const searchSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Verifying your account… — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { accessToken, refreshToken, error } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [accessToken, refreshToken, error, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Verifying your account…</p>
      </div>
    </div>
  );
}
