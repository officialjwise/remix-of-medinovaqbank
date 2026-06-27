/**
 * RBAC domain — self-contained API module (roles + permissions matrix).
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * Endpoints (all under /api/v1, super_admin only):
 *   GET    /admin/roles                      — roles with member counts + granted keys
 *   GET    /admin/permissions                — full permission catalog
 *   PATCH  /admin/roles/:key/permissions     — replace a role's permission set
 *
 * Field mapping (backend RoleResponseDto -> frontend Role view model):
 *   members      <- memberCount
 *   builtIn      <- isSystem
 *   permissions  <- permissionKeys
 *
 * NOTE: PATCH replaces the ENTIRE permission set with exactly `permissionKeys`
 * (anything omitted is revoked) — see UpdateRolePermissionsDto.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend wire shapes (inside the envelope's `data`). ──
export interface BackendRole {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
  permissionKeys: string[];
}

export interface BackendPermission {
  id: string;
  key: string;
  name: string;
  category: string;
}

// ── Frontend domain shapes. ──
export interface Role {
  id: string;
  key: string;
  name: string;
  description: string;
  /** <- memberCount */
  members: number;
  /** <- isSystem */
  builtIn: boolean;
  /** <- permissionKeys */
  permissions: string[];
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  category: string;
}

// ── Boundary mappers. ──
export function mapRole(r: BackendRole): Role {
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description ?? "",
    members: r.memberCount,
    builtIn: r.isSystem,
    permissions: [...r.permissionKeys],
  };
}

export function mapPermission(p: BackendPermission): Permission {
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    category: p.category,
  };
}

export const rbacApi = {
  async listRoles(): Promise<Role[]> {
    const data = await apiClient.get<BackendRole[]>("/admin/roles");
    return data.map(mapRole);
  },

  async listPermissions(): Promise<Permission[]> {
    const data = await apiClient.get<BackendPermission[]>("/admin/permissions");
    return data.map(mapPermission);
  },

  /** Replace a role's permission set with exactly `permissionKeys`. */
  async setRolePermissions(key: string, permissionKeys: string[]): Promise<Role> {
    const data = await apiClient.patch<BackendRole>(`/admin/roles/${key}/permissions`, {
      permissionKeys,
    });
    return mapRole(data);
  },
};

// ── Query keys ──
export const rbacKeys = {
  all: ["rbac"] as const,
  roles: () => [...rbacKeys.all, "roles"] as const,
  permissions: () => [...rbacKeys.all, "permissions"] as const,
};

// ── Hooks ──
export function useRoles() {
  return useQuery({
    queryKey: rbacKeys.roles(),
    queryFn: () => rbacApi.listRoles(),
    staleTime: 30_000,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: () => rbacApi.listPermissions(),
    staleTime: 5 * 60_000,
  });
}

export function useSetRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, permissionKeys }: { key: string; permissionKeys: string[] }) =>
      rbacApi.setRolePermissions(key, permissionKeys),
    onSuccess: () => void qc.invalidateQueries({ queryKey: rbacKeys.roles() }),
  });
}
