import { questionBanks } from "@/data/banks";

/* ------------------------------------------------------------------ */
/* Deterministic generators                                            */
/* ------------------------------------------------------------------ */

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const FIRST = ["Akua", "Kwame", "Adjoa", "Yaw", "Ama", "Kojo", "Efua", "Kofi", "Esi", "Nana", "Abena", "Kwesi", "Adwoa", "Kwabena", "Akosua", "Yaa", "Fiifi", "Maabena", "Selorm", "Edem", "Afia", "Kuukua"];
const LAST = ["Mensah", "Boateng", "Owusu", "Asante", "Darko", "Annan", "Asare", "Adu", "Quaye", "Appiah", "Frimpong", "Nyarko", "Sarpong", "Agyeman", "Ofori", "Tetteh", "Bediako", "Acheampong", "Donkor", "Amoah"];
const SPECIALTIES = ["Cardiology", "Neurology", "Surgery", "Internal Medicine", "Paediatrics", "OB/GYN", "Psychiatry", "Anaesthesia", "Radiology", "Family Medicine", "Emergency Medicine", "Pathology"];
const INSTITUTIONS = ["Korle Bu Teaching Hospital", "Komfo Anokye Teaching Hospital", "Tamale Teaching Hospital", "Cape Coast Teaching Hospital", "37 Military Hospital", "University of Ghana Medical School", "KNUST School of Medicine", "Ho Teaching Hospital"];
const GH_CITIES = [
  { city: "Accra", region: "Greater Accra" },
  { city: "Kumasi", region: "Ashanti" },
  { city: "Tamale", region: "Northern" },
  { city: "Takoradi", region: "Western" },
  { city: "Cape Coast", region: "Central" },
  { city: "Ho", region: "Volta" },
];
const FOREIGN = [
  { city: "Lagos", region: "Lagos", country: "Nigeria" },
  { city: "London", region: "England", country: "United Kingdom" },
  { city: "Nairobi", region: "Nairobi", country: "Kenya" },
  { city: "New York", region: "New York", country: "United States" },
];
const DEVICES = ["Chrome on Windows", "Safari on iOS", "Chrome on Android", "Edge on Windows", "Safari on macOS", "Firefox on Linux"];

export type UserStatus = "active" | "trial" | "expired" | "suspended" | "none";
export type PlanLabel = "Trial" | "Monthly" | "3-Month" | "6-Month" | "12-Month" | "—";

export interface AdminUser {
  /** Internal record id (uuid-like) — used for routing/lookups, never displayed. */
  id: string;
  /** Public-facing, human-friendly id shown in the UI. */
  publicId: string;
  name: string;
  email: string;
  initials: string;
  specialty: string;
  institution: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: UserStatus;
  plan: PlanLabel;
  planEndsAt?: string;
  country: string;
  region: string;
  city: string;
  device: string;
  deviceFingerprint: string;
  registeredAt: string;
  lastActiveAt: string;
  lifetimeQuestions: number;
  avgScore: number;
  sessionsCount: number;
  trialDaysLeft?: number;
  trialQuestionsLeft?: number;
}

const PLAN_BY_STATUS: Record<UserStatus, PlanLabel> = {
  active: "12-Month",
  trial: "Trial",
  expired: "Monthly",
  suspended: "3-Month",
  none: "—",
};

const STATUSES: UserStatus[] = ["active", "active", "active", "trial", "trial", "expired", "suspended", "none"];

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export const adminUsers: AdminUser[] = (() => {
  const rnd = seeded(1234);
  return Array.from({ length: 84 }, (_, i) => {
    const first = FIRST[Math.floor(rnd() * FIRST.length)];
    const last = LAST[Math.floor(rnd() * LAST.length)];
    const name = `${first} ${last}`;
    const status = i === 0 ? "active" : STATUSES[Math.floor(rnd() * STATUSES.length)];
    const foreign = rnd() > 0.78;
    const loc = foreign ? FOREIGN[Math.floor(rnd() * FOREIGN.length)] : { ...GH_CITIES[Math.floor(rnd() * GH_CITIES.length)], country: "Ghana" };
    const role: AdminUser["role"] = i % 41 === 0 ? "ADMIN" : "USER";
    const planLabel = role !== "USER" ? "—" : PLAN_BY_STATUS[status];
    const regDays = 10 + Math.floor(rnd() * 500);
    const plans: PlanLabel[] = ["Monthly", "3-Month", "6-Month", "12-Month"];

    return {
      id: `u-${1000 + i}`,
      publicId: `MQB-U-${String(1042 + i).padStart(6, "0")}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      initials: `${first[0]}${last[0]}`,
      specialty: SPECIALTIES[Math.floor(rnd() * SPECIALTIES.length)],
      institution: INSTITUTIONS[Math.floor(rnd() * INSTITUTIONS.length)],
      role,
      status,
      plan: status === "active" ? plans[Math.floor(rnd() * plans.length)] : planLabel,
      planEndsAt: status === "active" ? isoDaysAgo(-(30 + Math.floor(rnd() * 300))) : undefined,
      country: loc.country,
      region: loc.region,
      city: loc.city,
      device: DEVICES[Math.floor(rnd() * DEVICES.length)],
      deviceFingerprint: Math.floor(rnd() * 0xffffffffff).toString(16).padStart(12, "0"),
      registeredAt: isoDaysAgo(regDays),
      lastActiveAt: isoDaysAgo(status === "suspended" ? 30 + Math.floor(rnd() * 40) : Math.floor(rnd() * 6)),
      lifetimeQuestions: Math.floor(rnd() * 4200),
      avgScore: 52 + Math.floor(rnd() * 44),
      sessionsCount: Math.floor(rnd() * 160),
      trialDaysLeft: status === "trial" ? 1 + Math.floor(rnd() * 6) : undefined,
      trialQuestionsLeft: status === "trial" ? Math.floor(rnd() * 10) : undefined,
    };
  });
})();

export const getUserById = (id: string) => adminUsers.find((u) => u.id === id);

/* ------------------------------------------------------------------ */
/* Login sessions                                                      */
/* ------------------------------------------------------------------ */

export interface LoginSession {
  id: string;
  publicId: string;
  userId: string;
  userName: string;
  email: string;
  initials: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  city: string;
  country: string;
  loginAt: string;
  lastActivityMinAgo: number;
  durationMin: number;
  activity: "idle" | "in-quiz" | "browsing";
  bankName?: string;
  progress?: number;
  status: "active" | "ended";
  trial: boolean;
  suspicious?: boolean;
}

function splitDevice(d: string) {
  const [browser, , os] = d.split(" ");
  return { browser, os };
}

export const loginSessions: LoginSession[] = (() => {
  const rnd = seeded(99);
  return Array.from({ length: 220 }, (_, i) => {
    const u = adminUsers[Math.floor(rnd() * adminUsers.length)];
    const { browser, os } = splitDevice(u.device);
    const active = i < 28;
    const inQuiz = active && rnd() > 0.5;
    const bank = questionBanks[Math.floor(rnd() * questionBanks.length)];
    return {
      id: `ls-${5000 + i}`,
      publicId: `MQB-SES-${String(5000 + i).padStart(6, "0")}`,
      userId: u.id,
      userName: u.name,
      email: u.email,
      initials: u.initials,
      device: u.device,
      browser,
      os,
      ip: `${10 + Math.floor(rnd() * 240)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}`,
      city: u.city,
      country: u.country,
      loginAt: isoDaysAgo(active ? 0 : Math.floor(rnd() * 30)),
      lastActivityMinAgo: active ? Math.floor(rnd() * 30) : Math.floor(rnd() * 4000),
      durationMin: 3 + Math.floor(rnd() * 140),
      activity: inQuiz ? "in-quiz" : rnd() > 0.5 ? "browsing" : "idle",
      bankName: inQuiz ? bank.name : undefined,
      progress: inQuiz ? Math.floor(rnd() * 100) : undefined,
      status: active ? "active" : "ended",
      trial: u.status === "trial",
      suspicious: rnd() > 0.93,
    };
  });
})();

export const activeSessions = loginSessions.filter((s) => s.status === "active");

/* ------------------------------------------------------------------ */
/* Quiz sessions                                                       */
/* ------------------------------------------------------------------ */

export interface AdminQuizSession {
  id: string;
  publicId: string;
  userId: string;
  userName: string;
  initials: string;
  bankId: string;
  bankName: string;
  mode: "TUTOR" | "QUIZ";
  scorePct: number;
  questionsAnswered: number;
  totalQuestions: number;
  status: "completed" | "in-progress" | "abandoned";
  durationMin: number;
  date: string;
}

export const adminQuizSessions: AdminQuizSession[] = (() => {
  const rnd = seeded(424242);
  return Array.from({ length: 260 }, (_, i) => {
    const u = adminUsers[Math.floor(rnd() * adminUsers.length)];
    const bank = questionBanks[Math.floor(rnd() * questionBanks.length)];
    const total = [20, 25, 30, 40][Math.floor(rnd() * 4)];
    const r = rnd();
    const status = r > 0.82 ? "in-progress" : r > 0.72 ? "abandoned" : "completed";
    const answered = status === "completed" ? total : Math.floor(rnd() * total);
    return {
      id: `qs-${8000 + i}`,
      publicId: `MQB-QZ-${String(8000 + i).padStart(6, "0")}`,
      userId: u.id,
      userName: u.name,
      initials: u.initials,
      bankId: bank.id,
      bankName: bank.name,
      mode: rnd() > 0.5 ? "QUIZ" : "TUTOR",
      scorePct: status === "completed" ? 45 + Math.floor(rnd() * 52) : 0,
      questionsAnswered: answered,
      totalQuestions: total,
      status,
      durationMin: 4 + Math.floor(rnd() * 70),
      date: isoDaysAgo(Math.floor(rnd() * 45)),
    };
  });
})();

export const quizSessionsByUser = (userId: string) => adminQuizSessions.filter((s) => s.userId === userId);
export const loginSessionsByUser = (userId: string) => loginSessions.filter((s) => s.userId === userId);
