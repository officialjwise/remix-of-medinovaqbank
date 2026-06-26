import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { getTrialState, isFeatureAvailable, TRIAL_LOCKED_COPY } from "@/lib/trial";
import { useUpgradeModal } from "@/stores/upgradeModalStore";

/**
 * Central trial hook. Combines the user's subscription with the platform's
 * configured trial feature flags so components can ask "can this user use X?"
 * and trigger the upsell when not.
 */
export function useTrial() {
  const subscription = useAuthStore((s) => s.subscription);
  const trialFeatures = useSettingsStore((s) => s.settings.trial.features);
  const show = useUpgradeModal((s) => s.show);

  const state = getTrialState(subscription);

  function can(featureKey: string) {
    return isFeatureAvailable(featureKey, state.isTrial, trialFeatures);
  }

  /** Returns true if access is allowed; otherwise opens the upsell and returns false. */
  function requireFeature(featureKey: string) {
    if (can(featureKey)) return true;
    const copy = TRIAL_LOCKED_COPY[featureKey] ?? {
      title: "Upgrade to unlock this feature",
      body: "This feature is available on any paid plan. Subscribe to unlock everything.",
    };
    show({ ...copy, featureKey });
    return false;
  }

  return { ...state, subscription, can, requireFeature };
}
