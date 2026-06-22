import type { User } from "@/types";
import { apiClient } from "./client";

export interface AuthResult {
  accessToken: string;
  user: User;
}

const mockUser = (email: string, name?: string): User => ({
  id: crypto.randomUUID(),
  email,
  name: name ?? email.split("@")[0],
  role: "USER",
  createdAt: new Date().toISOString(),
});

export const authApi = {
  login: (email: string, _password: string) =>
    apiClient.post<AuthResult>("/auth/login", { email }, {
      accessToken: "mock-token-" + Date.now(),
      user: mockUser(email),
    }),

  signup: (email: string, _password: string, name: string) =>
    apiClient.post<AuthResult>("/auth/signup", { email, name }, {
      accessToken: "mock-token-" + Date.now(),
      user: mockUser(email, name),
    }),

  googleCallback: (token: string) =>
    apiClient.post<AuthResult>("/auth/google/callback", { token }, {
      accessToken: token || "mock-google-token",
      user: mockUser("doctor@medinova.app", "Dr. Bright Nketia"),
    }),

  me: () => apiClient.get<User>("/auth/me", mockUser("doctor@medinova.app", "Dr. Bright Nketia")),
};
