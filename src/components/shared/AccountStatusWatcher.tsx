import { useState } from "react";
import { useRealtimeStream } from "@/lib/realtime";
import { useAuthStore } from "@/stores/authStore";

/**
 * Listens on the per-user realtime stream for `account_restricted` (admin
 * suspend/ban) and shows a blocking notice in real-time. The backend has
 * already revoked the user's tokens, so every further API call 401s — this just
 * makes the restriction visible immediately instead of on the next failed call.
 */
export function AccountStatusWatcher() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const [restricted, setRestricted] = useState<{
    status?: string;
    reason?: string;
  } | null>(null);

  useRealtimeStream(
    "me",
    {
      account_restricted: (data) =>
        setRestricted({
          status: typeof data.status === "string" ? data.status : undefined,
          reason: typeof data.reason === "string" ? data.reason : undefined,
        }),
    },
    isAuthed,
  );

  if (!restricted) return null;

  const banned = restricted.status === "banned";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-w-md rounded-2xl border border-error/30 bg-surface p-7 text-center shadow-2xl">
        <h2 className="text-lg font-bold text-foreground">
          {banned ? "Your account has been banned" : "Your account has been suspended"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {restricted.reason
            ? restricted.reason
            : `Access to your account has been ${
                banned ? "permanently revoked" : "temporarily suspended"
              } by an administrator.`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          If you believe this is a mistake, please contact support.
        </p>
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent text-sm font-bold text-white hover:opacity-90"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
