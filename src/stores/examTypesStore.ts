import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ExamTypeRecord {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  bankCount: number;
  active: boolean;
  createdAt: string;
}

const SEED: ExamTypeRecord[] = [
  {
    id: "et-usmle1",
    name: "USMLE Step 1",
    description: "United States Medical Licensing Examination — basic sciences.",
    color: "#0E7C7B",
    icon: "GraduationCap",
    bankCount: 4,
    active: true,
    createdAt: "2025-01-08",
  },
  {
    id: "et-usmle2",
    name: "USMLE Step 2 CK",
    description: "Clinical knowledge for the US licensing pathway.",
    color: "#3B82F6",
    icon: "Stethoscope",
    bankCount: 3,
    active: true,
    createdAt: "2025-01-08",
  },
  {
    id: "et-plab",
    name: "PLAB",
    description: "Professional and Linguistic Assessments Board (UK).",
    color: "#7C3AED",
    icon: "Globe",
    bankCount: 2,
    active: true,
    createdAt: "2025-01-15",
  },
  {
    id: "et-mrcp",
    name: "MRCP",
    description: "Membership of the Royal Colleges of Physicians (UK).",
    color: "#E89A1A",
    icon: "Award",
    bankCount: 1,
    active: true,
    createdAt: "2025-02-04",
  },
  {
    id: "et-gmdc",
    name: "Ghana Medical & Dental Council Exam",
    description: "Licensing examination for practice in Ghana.",
    color: "#2BC97F",
    icon: "ShieldCheck",
    bankCount: 5,
    active: true,
    createdAt: "2025-02-11",
  },
  {
    id: "et-waec",
    name: "WAEC",
    description: "West African Examinations Council — pre-medical sciences.",
    color: "#E11D48",
    icon: "BookOpen",
    bankCount: 0,
    active: false,
    createdAt: "2025-03-01",
  },
];

interface ExamTypesState {
  examTypes: ExamTypeRecord[];
  add: (record: Omit<ExamTypeRecord, "id" | "createdAt" | "bankCount">) => void;
  update: (id: string, patch: Partial<ExamTypeRecord>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
}

export const useExamTypesStore = create<ExamTypesState>()(
  persist(
    (set) => ({
      examTypes: SEED,
      add: (record) =>
        set((s) => ({
          examTypes: [
            {
              ...record,
              id: `et-${Date.now()}`,
              createdAt: new Date().toISOString(),
              bankCount: 0,
            },
            ...s.examTypes,
          ],
        })),
      update: (id, patch) =>
        set((s) => ({ examTypes: s.examTypes.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      remove: (id) => set((s) => ({ examTypes: s.examTypes.filter((e) => e.id !== id) })),
      toggle: (id) =>
        set((s) => ({
          examTypes: s.examTypes.map((e) => (e.id === id ? { ...e, active: !e.active } : e)),
        })),
    }),
    { name: "medinova-exam-types", version: 1 },
  ),
);
