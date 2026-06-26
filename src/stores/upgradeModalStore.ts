import { create } from "zustand";

interface UpgradeModalState {
  open: boolean;
  title: string;
  body: string;
  featureKey?: string;
  show: (payload: { title: string; body: string; featureKey?: string }) => void;
  close: () => void;
}

/**
 * Lightweight global trigger for the upgrade modal. Any trial-gated feature can
 * call `useUpgradeModal.getState().show(...)` to surface the elegant upsell.
 */
export const useUpgradeModal = create<UpgradeModalState>((set) => ({
  open: false,
  title: "",
  body: "",
  featureKey: undefined,
  show: ({ title, body, featureKey }) => set({ open: true, title, body, featureKey }),
  close: () => set({ open: false }),
}));
