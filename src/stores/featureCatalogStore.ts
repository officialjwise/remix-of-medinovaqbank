import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FEATURE_CATALOG, type PlatformFeature } from "@/data/features";

interface FeatureCatalogState {
  features: PlatformFeature[];
  add: (feature: PlatformFeature) => void;
  update: (key: string, patch: Partial<PlatformFeature>) => void;
  remove: (key: string) => void;
}

/**
 * Managed platform-feature catalog. Seeded from the static defaults but
 * extensible by admins so plans (and the trial) can attach any feature.
 */
export const useFeatureCatalogStore = create<FeatureCatalogState>()(
  persist(
    (set) => ({
      features: FEATURE_CATALOG,
      add: (feature) => set((s) => ({ features: [...s.features, feature] })),
      update: (key, patch) =>
        set((s) => ({ features: s.features.map((f) => (f.key === key ? { ...f, ...patch } : f)) })),
      remove: (key) => set((s) => ({ features: s.features.filter((f) => f.key !== key) })),
    }),
    { name: "medinova-feature-catalog-v2", version: 1 },
  ),
);
