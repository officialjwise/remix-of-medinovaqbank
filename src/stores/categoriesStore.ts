import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  bankCount: number;
  questionCount: number;
  createdAt: string;
  subcategories: Subcategory[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function sub(name: string): Subcategory {
  return { id: `sc-${slugify(name)}`, name, slug: slugify(name) };
}

const SEED: Category[] = [
  {
    id: "c-im",
    name: "Internal Medicine",
    slug: "internal-medicine",
    color: "#0E7C7B",
    bankCount: 4,
    questionCount: 2840,
    createdAt: "2025-01-08",
    subcategories: [
      "Cardiology",
      "Pulmonology",
      "Endocrinology",
      "Nephrology",
      "Gastroenterology",
    ].map(sub),
  },
  {
    id: "c-surg",
    name: "Surgery",
    slug: "surgery",
    color: "#0EA5E9",
    bankCount: 3,
    questionCount: 1620,
    createdAt: "2025-01-08",
    subcategories: ["General Surgery", "Trauma", "Vascular", "Orthopaedics"].map(sub),
  },
  {
    id: "c-obgyn",
    name: "Obstetrics & Gynaecology",
    slug: "obgyn",
    color: "#A855F7",
    bankCount: 2,
    questionCount: 1140,
    createdAt: "2025-01-15",
    subcategories: ["Antenatal", "Labour & Delivery", "Gynae Oncology"].map(sub),
  },
  {
    id: "c-paeds",
    name: "Paediatrics",
    slug: "paediatrics",
    color: "#EC4899",
    bankCount: 2,
    questionCount: 980,
    createdAt: "2025-01-22",
    subcategories: ["Neonatology", "Infectious Disease", "Development"].map(sub),
  },
  {
    id: "c-pharm",
    name: "Pharmacology",
    slug: "pharmacology",
    color: "#22C55E",
    bankCount: 3,
    questionCount: 1520,
    createdAt: "2025-02-04",
    subcategories: ["Antimicrobials", "Cardiovascular", "Neuropharmacology"].map(sub),
  },
  {
    id: "c-path",
    name: "Pathology",
    slug: "pathology",
    color: "#F97316",
    bankCount: 2,
    questionCount: 720,
    createdAt: "2025-02-11",
    subcategories: ["Neoplasia", "Inflammation", "Haematology"].map(sub),
  },
];

interface CategoriesState {
  categories: Category[];
  addCategory: (input: { name: string; slug: string; color: string }) => void;
  updateCategory: (id: string, patch: Partial<Pick<Category, "name" | "slug" | "color">>) => void;
  removeCategory: (id: string) => void;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, subId: string, name: string) => void;
  removeSubcategory: (categoryId: string, subId: string) => void;
}

/**
 * TEMPORARY: subcategories have no backend support yet. While categories
 * themselves now come from the real API (see @/api/categories.api), the admin
 * UI still offers subcategory CRUD. This slim store keeps subcategories keyed
 * by the (backend) category id until a backend subcategory endpoint exists.
 * GAP: subcategories are local-only and not persisted server-side.
 */
interface SubcategoriesState {
  /** categoryId -> subcategories */
  byCategory: Record<string, Subcategory[]>;
  getSubcategories: (categoryId: string) => Subcategory[];
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, subId: string, name: string) => void;
  removeSubcategory: (categoryId: string, subId: string) => void;
}

export const useSubcategoriesStore = create<SubcategoriesState>()(
  persist(
    (set, get) => ({
      byCategory: {},
      getSubcategories: (categoryId) => get().byCategory[categoryId] ?? [],
      addSubcategory: (categoryId, name) =>
        set((s) => ({
          byCategory: {
            ...s.byCategory,
            [categoryId]: [
              ...(s.byCategory[categoryId] ?? []),
              { id: `sc-${Date.now()}`, name, slug: slugify(name) },
            ],
          },
        })),
      updateSubcategory: (categoryId, subId, name) =>
        set((s) => ({
          byCategory: {
            ...s.byCategory,
            [categoryId]: (s.byCategory[categoryId] ?? []).map((x) =>
              x.id === subId ? { ...x, name, slug: slugify(name) } : x,
            ),
          },
        })),
      removeSubcategory: (categoryId, subId) =>
        set((s) => ({
          byCategory: {
            ...s.byCategory,
            [categoryId]: (s.byCategory[categoryId] ?? []).filter((x) => x.id !== subId),
          },
        })),
    }),
    { name: "medinova-subcategories", version: 1 },
  ),
);

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set) => ({
      categories: SEED,
      addCategory: ({ name, slug, color }) =>
        set((s) => ({
          categories: [
            {
              id: `c-${Date.now()}`,
              name,
              slug,
              color,
              bankCount: 0,
              questionCount: 0,
              createdAt: new Date().toISOString(),
              subcategories: [],
            },
            ...s.categories,
          ],
        })),
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
      addSubcategory: (categoryId, name) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  subcategories: [
                    ...c.subcategories,
                    { id: `sc-${Date.now()}`, name, slug: slugify(name) },
                  ],
                }
              : c,
          ),
        })),
      updateSubcategory: (categoryId, subId, name) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  subcategories: c.subcategories.map((x) =>
                    x.id === subId ? { ...x, name, slug: slugify(name) } : x,
                  ),
                }
              : c,
          ),
        })),
      removeSubcategory: (categoryId, subId) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId
              ? { ...c, subcategories: c.subcategories.filter((x) => x.id !== subId) }
              : c,
          ),
        })),
    }),
    { name: "medinova-categories", version: 1 },
  ),
);
