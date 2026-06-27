/**
 * DEVICE SESSIONS domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * NOTE: this is the *device/login* sessions domain (live devices + trial
 * single-device lock), NOT the quiz-attempt sessions list (that lives in
 * quiz.api). The two are unrelated despite the shared word "session".
 *
 * Endpoints (all under /api/v1):
 *   GET  /sessions/active        — current user's active devices + trial lock
 *   POST /sessions/terminate/:id — revoke (deactivate) one of your own sessions
 *
 * Device-mismatch handling: the trial single-device lock is enforced at LOGIN
 * (the backend throws 403 "deviceLocked"), so the dedicated /sessions/active
 * route is an informational wall. The `deviceLock` payload here surfaces the
 * bound device on the active-sessions screen so the user can self-serve.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { getDeviceFingerprint } from "@/lib/device";

// ── Backend wire shapes (inside the envelope's `data`). ──
export interface BackendDeviceSession {
  id: string;
  userId: string;
  /** Truncated SHA-256 of the device fingerprint (e.g. "a1b2c3d4e5f6…"). */
  deviceFingerprint: string;
  userAgent: string | null;
  ipAddress: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  currentActivity: string;
  loginAt: string;
  lastPingAt: string;
  isActive: boolean;
  isSuspicious: boolean;
  suspiciousReasons: string[] | null;
}

export interface BackendDeviceLock {
  id: string;
  deviceFingerprint: string;
  userAgent: string | null;
  ipAddress: string | null;
  isActive: boolean;
  lockedAt: string;
  lastSeenAt: string;
}

export interface BackendActiveSessions {
  sessions: BackendDeviceSession[];
  deviceLock: BackendDeviceLock | null;
}

// ── Frontend domain shapes ──
export interface DeviceSession {
  id: string;
  userId: string;
  fingerprint: string;
  userAgent: string | null;
  ipAddress: string | null;
  /** Human-readable location: "City, Country" / country / city / null. */
  location: string | null;
  countryCode: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  /** Human-readable device: "Chrome on macOS" / browser / os / deviceType. */
  deviceLabel: string;
  currentActivity: string;
  loginAt: string;
  lastPingAt: string;
  isActive: boolean;
  isSuspicious: boolean;
  suspiciousReasons: string[];
}

export interface DeviceLock {
  id: string;
  fingerprint: string;
  userAgent: string | null;
  ipAddress: string | null;
  isActive: boolean;
  lockedAt: string;
  lastSeenAt: string;
}

export interface ActiveSessions {
  sessions: DeviceSession[];
  deviceLock: DeviceLock | null;
}

function composeLocation(city: string | null, country: string | null): string | null {
  if (city && country) return `${city}, ${country}`;
  return country ?? city ?? null;
}

function composeDevice(s: BackendDeviceSession): string {
  if (s.browser && s.os) return `${s.browser} on ${s.os}`;
  if (s.browser ?? s.os) return (s.browser ?? s.os) as string;
  if (s.deviceType && s.deviceType !== "unknown") return s.deviceType;
  return "Unknown device";
}

// ── Boundary mappers ──
export function mapDeviceSession(s: BackendDeviceSession): DeviceSession {
  return {
    id: s.id,
    userId: s.userId,
    fingerprint: s.deviceFingerprint,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    location: composeLocation(s.city, s.country),
    countryCode: s.countryCode,
    deviceType: s.deviceType,
    browser: s.browser,
    os: s.os,
    deviceLabel: composeDevice(s),
    currentActivity: s.currentActivity,
    loginAt: s.loginAt,
    lastPingAt: s.lastPingAt,
    isActive: s.isActive,
    isSuspicious: s.isSuspicious,
    suspiciousReasons: s.suspiciousReasons ?? [],
  };
}

export function mapDeviceLock(d: BackendDeviceLock): DeviceLock {
  return {
    id: d.id,
    fingerprint: d.deviceFingerprint,
    userAgent: d.userAgent,
    ipAddress: d.ipAddress,
    isActive: d.isActive,
    lockedAt: d.lockedAt,
    lastSeenAt: d.lastSeenAt,
  };
}

export const sessionsApi = {
  /** Current user's active devices + trial device lock. */
  async getActive(): Promise<ActiveSessions> {
    const data = await apiClient.get<BackendActiveSessions>("/sessions/active");
    return {
      sessions: data.sessions.map(mapDeviceSession),
      deviceLock: data.deviceLock ? mapDeviceLock(data.deviceLock) : null,
    };
  },

  /** Revoke (deactivate) one of the user's own active sessions. */
  async terminate(sessionId: string): Promise<void> {
    await apiClient.post<null>(`/sessions/terminate/${sessionId}`);
  },
};

// ── Query keys ──
export const sessionKeys = {
  all: ["device-sessions"] as const,
  active: () => [...sessionKeys.all, "active"] as const,
};

// ── Hooks ──

/** Current user's active devices + trial device lock (auto-refreshing). */
export function useActiveSessions() {
  return useQuery({
    queryKey: sessionKeys.active(),
    queryFn: sessionsApi.getActive,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

/** Revoke one of your own sessions; refreshes the active list on success. */
export function useTerminateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.terminate(sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

/**
 * Resolve the current device's fingerprint hash prefix so the UI can highlight
 * "this device" in the active list. The backend exposes only a truncated hash,
 * so this is a best-effort label-side match (SSR-safe — returns null on server).
 *
 * NOTE: the raw fingerprint here is NOT the same as the server's SHA-256 hash;
 * we cannot recompute that client-side, so callers should treat a match as a
 * hint, not a guarantee. Kept for the "current device" affordance.
 */
export async function getCurrentFingerprint(): Promise<string | null> {
  return getDeviceFingerprint();
}
