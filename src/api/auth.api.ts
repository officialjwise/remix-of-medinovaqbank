import type { User } from "@/types";
import { apiClient } from "./client";

export interface AuthResult {
  accessToken: string;
  user: User;
}

/** Friendly public id derived from the internal uuid (uuid stays internal). */
const publicIdFor = (uuid: string, prefix: string) =>
  `MQB-${prefix}-${parseInt(uuid.replace(/[^0-9a-f]/gi, "").slice(0, 6), 16).toString().padStart(6, "0")}`;

const mockPractitioner = (email = "doctor@medinova.app", name = "Dr. Bright Nketia"): User => {
  const id = crypto.randomUUID();
  return {
    id,
    publicId: publicIdFor(id, "U"),
    email,
    name,
    specialty: "Internal Medicine",
    role: "USER",
    createdAt: new Date().toISOString(),
  };
};

const mockAdmin = (email = "admin@medinova.app"): User => {
  const id = crypto.randomUUID();
  return {
  id,
  publicId: publicIdFor(id, "ADM"),
  email,
  // The admin console is the super-admin control center; the demo admin login
  // gets full access so System Settings, Subscription Plans, Feature Catalog,
  // etc. (all super-only) are visible. A real backend derives this per account.
  name: /super/i.test(email) ? "Super Admin" : "Admin Console",
  role: "SUPER_ADMIN",
  createdAt: new Date().toISOString(),
  };
};

export const authApi = {
  // Practitioners only — Google OAuth
  googleCallback: (token: string) =>
    apiClient.post<AuthResult>("/auth/google/callback", { token }, {
      accessToken: token || "mock-google-token-" + Date.now(),
      user: mockPractitioner(),
    }),

  // Admin login (email/password OR Google)
  adminLogin: (email: string, _password: string) =>
    apiClient.post<AuthResult>("/auth/admin/login", { email }, {
      accessToken: "mock-admin-token-" + Date.now(),
      user: mockAdmin(email),
    }),

  adminGoogleCallback: (token: string) =>
    apiClient.post<AuthResult>("/auth/admin/google", { token }, {
      accessToken: token || "mock-admin-google-token",
      user: mockAdmin(),
    }),

  me: () =>
    apiClient.get<User>("/auth/me", mockPractitioner()),
};
