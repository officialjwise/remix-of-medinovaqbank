import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { BASE_URL } from "@/api/client";

export type RealtimeEventHandler = (data: Record<string, unknown>) => void;

/**
 * Subscribe to a backend Server-Sent Events channel. Browser-only (no-op on the
 * server) with auto-reconnect. `path` is relative to /realtime (e.g.
 * "notifications", "admin/dashboard"); `handlers` maps SSE event names to
 * callbacks. The access token is passed as `?token=` because EventSource can't
 * send an Authorization header. Falls back gracefully: if it never connects,
 * consumers keep their polling (refetchInterval) as a backstop.
 */
export function useRealtimeStream(
  path: string,
  handlers: Record<string, RealtimeEventHandler>,
  enabled = true,
): void {
  const token = useAuthStore((s) => s.accessToken);
  // Latest handlers without forcing a reconnect each render.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !token) return;

    const url = `${BASE_URL}/realtime/${path}?token=${encodeURIComponent(token)}`;
    let source: EventSource | null = null;
    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const listener = (name: string) => (event: MessageEvent) => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(event.data) as Record<string, unknown>;
      } catch {
        /* heartbeat / non-JSON — ignore */
      }
      handlersRef.current[name]?.(data);
    };

    const connect = () => {
      source = new EventSource(url);
      for (const name of Object.keys(handlersRef.current)) {
        source.addEventListener(name, listener(name) as EventListener);
      }
      source.onerror = () => {
        source?.close();
        if (!stopped) retry = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      source?.close();
    };
  }, [path, token, enabled]);
}
