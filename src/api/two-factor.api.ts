/**
 * TWO-FACTOR (TOTP) domain — self-service 2FA for the logged-in user.
 *
 * Endpoints (all under /api/v1, authenticated):
 *   GET    /users/me/2fa/status  — { enabled }
 *   POST   /users/me/2fa/enroll  — start enrollment -> { secret, otpauthUri, qrCodeString }
 *   POST   /users/me/2fa/verify  — confirm a 6-digit code -> { enabled, backupCodes }
 *   DELETE /users/me/2fa         — disable 2FA
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

export interface TwoFactorEnrollment {
  secret: string;
  otpauthUri: string;
  qrCodeString: string;
  enabled: boolean;
}

export interface TwoFactorVerifyResult {
  enabled: boolean;
  backupCodes: string[];
}

export const twoFactorApi = {
  async getStatus(): Promise<{ enabled: boolean }> {
    return apiClient.get<{ enabled: boolean }>("/users/me/2fa/status");
  },
  async enroll(): Promise<TwoFactorEnrollment> {
    return apiClient.post<TwoFactorEnrollment>("/users/me/2fa/enroll");
  },
  async verify(code: string): Promise<TwoFactorVerifyResult> {
    return apiClient.post<TwoFactorVerifyResult>("/users/me/2fa/verify", { code });
  },
  async disable(): Promise<void> {
    await apiClient.delete<null>("/users/me/2fa");
  },
};

export const twoFactorKeys = {
  all: ["two-factor"] as const,
  status: () => [...twoFactorKeys.all, "status"] as const,
};

export function useTwoFactorStatus() {
  return useQuery({
    queryKey: twoFactorKeys.status(),
    queryFn: twoFactorApi.getStatus,
    staleTime: 30_000,
  });
}

export function useEnrollTwoFactor() {
  return useMutation({ mutationFn: twoFactorApi.enroll });
}

export function useVerifyTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => twoFactorApi.verify(code),
    onSuccess: () => void qc.invalidateQueries({ queryKey: twoFactorKeys.all }),
  });
}

export function useDisableTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: twoFactorApi.disable,
    onSuccess: () => void qc.invalidateQueries({ queryKey: twoFactorKeys.all }),
  });
}
