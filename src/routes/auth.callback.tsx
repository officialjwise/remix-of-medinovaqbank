import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/stores/authStore";

const searchSchema = z.object({
  token: z.string().optional(),
  refresh: z.string().optional(),
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
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { accessToken, user } = await authApi.googleCallback(token ?? "");
        if (cancelled) return;
        localStorage.setItem("accessToken", accessToken);
        login(accessToken, user);
        navigate({ to: "/dashboard" });
      } catch {
        if (!cancelled) navigate({ to: "/login" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, login, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Verifying your account…
        </p>
      </div>
    </div>
  );
}
