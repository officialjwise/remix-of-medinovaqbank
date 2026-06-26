/**
 * Platform feature catalog — the master list of capabilities that can be
 * attached to subscription plans (paid or trial). Plans reference these by
 * `key`. Keeping them here (not hardcoded per-plan) makes the whole
 * subscription system data-driven.
 */

export type FeatureType = "boolean" | "limit";

export interface PlatformFeature {
  key: string;
  name: string;
  description: string;
  type: FeatureType;
  /** Default numeric value for `limit` features. -1 means unlimited. */
  defaultLimit?: number;
}

export const FEATURE_CATALOG: PlatformFeature[] = [
  {
    key: "full_bank_access",
    name: "Full Question Bank Access",
    description: "Unlock every question bank in the library.",
    type: "boolean",
  },
  {
    key: "ai_breakdowns",
    name: "Clinical Breakdowns",
    description: "Detailed clinical explanations on every answer.",
    type: "boolean",
  },
  {
    key: "performance_analytics",
    name: "Performance Analytics (Gaussian)",
    description: "Percentile ranking, trends and peer comparison.",
    type: "boolean",
  },
  {
    key: "leaderboard",
    name: "Leaderboard Competition",
    description: "Appear on and compete in the leaderboard.",
    type: "boolean",
  },
  {
    key: "multi_device",
    name: "Multi-Device Access",
    description: "Use the account on more than one device.",
    type: "boolean",
  },
  {
    key: "priority_support",
    name: "Priority Support",
    description: "Faster response times from the support team.",
    type: "boolean",
  },
  {
    key: "question_limit",
    name: "Question Limit",
    description: "Maximum questions the user may attempt. -1 = unlimited.",
    type: "limit",
    defaultLimit: -1,
  },
  {
    key: "max_devices",
    name: "Max Devices",
    description: "Number of bound devices allowed.",
    type: "limit",
    defaultLimit: 1,
  },
];

export const featureByKey = (key: string) => FEATURE_CATALOG.find((f) => f.key === key);
