import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlatformFeature } from "@/api/features.api";

export type { PlatformFeature } from "@/api/features.api";

interface FeatureCatalogState {
  features: PlatformFeature[];
  setFeatures: (features: PlatformFeature[]) => void;
  add: (feature: PlatformFeature) => void;
  update: (key: string, patch: Partial<PlatformFeature>) => void;
  remove: (key: string) => void;
}

/**
 * Local holder for the managed platform-feature catalog. The authoritative
 * catalog now lives on the backend (see `@/api/features.api` `useFeatures`);
 * starts empty and is hydrated by callers via `setFeatures` from the real
 * query. No mock seed.
 */
export const useFeatureCatalogStore = create<FeatureCatalogState>()(
  persist(
    (set) => ({
      features: [],
      setFeatures: (features) => set({ features }),
      add: (feature) => set((s) => ({ features: [...s.features, feature] })),
      update: (key, patch) =>
        set((s) => ({ features: s.features.map((f) => (f.key === key ? { ...f, ...patch } : f)) })),
      remove: (key) => set((s) => ({ features: s.features.filter((f) => f.key !== key) })),
    }),
    { name: "medinova-feature-catalog-v3", version: 1 },
  ),
);
