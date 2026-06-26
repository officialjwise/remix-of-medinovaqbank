import type { Subscription } from "@/types";

/**
 * Trial state derived from a subscription + settings. Pure functions so they
 * can be used in components, route guards, and the header chip alike.
 */

export interface TrialState {
  isTrial: boolean;
  daysLeft: number;
  questionsLeft: number;
  questionsTotal: number;
  expired: boolean;
}

export function getTrialState(sub: Subscription | null): TrialState {
  if (!sub || sub.status !== "TRIAL") {
    return { isTrial: false, daysLeft: 0, questionsLeft: 0, questionsTotal: 0, expired: false };
  }

  const total = sub.trialQuestionsTotal ?? 10;
  const questionsLeft = Math.max(0, sub.trialQuestionsLeft ?? total);

  let daysLeft = 7;
  if (sub.trialEndsAt) {
    const ms = new Date(sub.trialEndsAt).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(ms / 86_400_000));
  }

  const expired = daysLeft <= 0 || questionsLeft <= 0;

  return { isTrial: true, daysLeft, questionsLeft, questionsTotal: total, expired };
}

/** Feature keys gated behind a paid plan during trial. */
export const TRIAL_LOCKED_COPY: Record<string, { title: string; body: string }> = {
  performance_analytics: {
    title: "Unlock detailed performance analytics",
    body: "See your Gaussian percentile, performance trends and how you stack up against peers — available on any paid plan.",
  },
  leaderboard: {
    title: "Compete on the leaderboard",
    body: "Climb the national rankings and earn your place. Subscribe to join the competition.",
  },
  full_bank_access: {
    title: "Unlock the full question library",
    body: "Your trial includes a sampler. Subscribe to access every bank across all specialties.",
  },
  multi_device: {
    title: "Use Medinovaqbank on any device",
    body: "Your trial is locked to one device. Subscribe for seamless access everywhere.",
  },
};

/**
 * Whether a given feature is available right now, given the user's trial state
 * and the platform's trial feature flags.
 */
export function isFeatureAvailable(
  featureKey: string,
  isTrial: boolean,
  trialFeatures: Record<string, boolean>,
): boolean {
  if (!isTrial) return true;
  return trialFeatures[featureKey] ?? false;
}

/** Build a human label from a device fingerprint / user agent. */
export function deviceLabel(userAgent?: string): string {
  if (typeof navigator === "undefined" && !userAgent) return "Unknown device";
  const ua = userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
        ? "Firefox"
        : /Safari/.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X|Macintosh/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iOS/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  return `${browser} on ${os}`;
}
