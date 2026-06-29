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

  /** Create a custom role with an initial permission set. */
  async createRole(input: CreateRoleInput): Promise<Role> {
    const data = await apiClient.post<BackendRole>("/admin/roles", {
      name: input.name,
      description: input.description,
      permissionKeys: input.permissionKeys,
    });
    return mapRole(data);
  },

  /** Rename / re-describe a custom role (key is immutable). */
  async updateRole(
    key: string,
    input: { name?: string; description?: string },
  ): Promise<Role> {
    const data = await apiClient.patch<BackendRole>(`/admin/roles/${key}`, input);
    return mapRole(data);
  },

  /** Delete a custom role (blocked while it still has members). */
  async deleteRole(key: string): Promise<void> {
    await apiClient.delete<null>(`/admin/roles/${key}`);
  },
};

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionKeys: string[];
}

// ── CRUD matrix helpers (resource rows × create/read/update/delete cells) ──
export const CRUD_ACTIONS = ["create", "read", "update", "delete"] as const;
export type CrudAction = (typeof CRUD_ACTIONS)[number];

const CATEGORY_ORDER = [
  "content",
  "users",
  "analytics",
  "protection",
  "billing",
  "integrations",
  "system",
];

export interface ResourceRow {
  resource: string;
  label: string;
  category: string;
  /** action -> permission key, only for the actions this resource supports. */
  cells: Partial<Record<CrudAction, string>>;
}

function humanizeResource(slug: string): string {
  const s = slug.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Fold the flat permission catalog into resource rows so the UI can render a
 * resource × CRUD matrix. Rows are ordered by category (then first appearance).
 */
export function buildResourceMatrix(perms: Permission[]): ResourceRow[] {
  const byResource = new Map<string, ResourceRow>();
  for (const p of perms) {
    const dot = p.key.lastIndexOf(".");
    if (dot < 0) continue;
    const resource = p.key.slice(0, dot);
    const action = p.key.slice(dot + 1) as CrudAction;
    if (!CRUD_ACTIONS.includes(action)) continue;
    let row = byResource.get(resource);
    if (!row) {
      row = { resource, label: humanizeResource(resource), category: p.category, cells: {} };
      byResource.set(resource, row);
    }
    row.cells[action] = p.key;
  }
  const rows = [...byResource.values()];
  rows.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return (ca < 0 ? 99 : ca) - (cb < 0 ? 99 : cb);
    return a.label.localeCompare(b.label);
  });
  return rows;
}

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

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => rbacApi.createRole(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: rbacKeys.roles() }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, ...input }: { key: string; name?: string; description?: string }) =>
      rbacApi.updateRole(key, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: rbacKeys.roles() }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => rbacApi.deleteRole(key),
    onSuccess: () => void qc.invalidateQueries({ queryKey: rbacKeys.roles() }),
  });
}
