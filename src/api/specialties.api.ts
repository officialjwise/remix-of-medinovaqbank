/**
 * SPECIALTIES domain — self-contained API module.
 *
 * Wires:
 *   - GET    /specialties               (public — active only)
 *   - GET    /admin/specialties         (super_admin — all)
 *   - POST   /admin/specialties         (super_admin — create)
 *   - PATCH  /admin/specialties/:id     (super_admin — update / toggle)
 *   - DELETE /admin/specialties/:id     (super_admin — delete)
 *
 * Backend wire types + boundary mappers live here (not in the shared
 * @/api/types / @/api/mappers) to avoid cross-domain collisions, per
 * project convention.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend wire shape (SpecialtyResponseDto, inside the envelope's `data`). ──
export interface BackendSpecialty {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

// ── Frontend domain shape. ──
export interface Specialty {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

/** Boundary mapper: backend → frontend domain. */
export function mapSpecialty(s: BackendSpecialty): Specialty {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    isActive: s.isActive,
    sortOrder: s.sortOrder,
  };
}

// ── Write payloads (mirror Create/UpdateSpecialtyDto). ──
export interface SpecialtyCreateInput {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface SpecialtyUpdateInput {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const specialtiesApi = {
  /** Public — active specialties only. */
  async listActive(): Promise<Specialty[]> {
    const data = await apiClient.get<BackendSpecialty[]>("/specialties");
    return data.map(mapSpecialty);
  },

  /** Admin — all specialties. */
  async listAll(): Promise<Specialty[]> {
    const data = await apiClient.get<BackendSpecialty[]>("/admin/specialties");
    return data.map(mapSpecialty);
  },

  async create(input: SpecialtyCreateInput): Promise<Specialty> {
    const data = await apiClient.post<BackendSpecialty>("/admin/specialties", input);
    return mapSpecialty(data);
  },

  async update(id: string, input: SpecialtyUpdateInput): Promise<Specialty> {
    const data = await apiClient.patch<BackendSpecialty>(`/admin/specialties/${id}`, input);
    return mapSpecialty(data);
  },

  async remove(id: string): Promise<Specialty> {
    const data = await apiClient.delete<BackendSpecialty>(`/admin/specialties/${id}`);
    return mapSpecialty(data);
  },
};

// ── Query keys ──
export const specialtyKeys = {
  all: ["specialties"] as const,
  active: () => [...specialtyKeys.all, "active"] as const,
  admin: () => [...specialtyKeys.all, "admin"] as const,
};

/**
 * Public list of active specialties. Used by the register + profile
 * specialty selectors.
 */
export function useSpecialties() {
  return useQuery({
    queryKey: specialtyKeys.active(),
    queryFn: () => specialtiesApi.listActive(),
    staleTime: 5 * 60_000,
  });
}

/** Admin list (all, incl. inactive) for the management screen. */
export function useAdminSpecialties() {
  return useQuery({
    queryKey: specialtyKeys.admin(),
    queryFn: () => specialtiesApi.listAll(),
    staleTime: 60_000,
  });
}

function useInvalidateSpecialties() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: specialtyKeys.all });
}

export function useCreateSpecialty() {
  const invalidate = useInvalidateSpecialties();
  return useMutation({
    mutationFn: (input: SpecialtyCreateInput) => specialtiesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateSpecialty() {
  const invalidate = useInvalidateSpecialties();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SpecialtyUpdateInput }) =>
      specialtiesApi.update(id, input),
    onSuccess: invalidate,
  });
}

/** Convenience toggle — flips isActive via the update endpoint. */
export function useToggleSpecialty() {
  const invalidate = useInvalidateSpecialties();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      specialtiesApi.update(id, { isActive }),
    onSuccess: invalidate,
  });
}

export function useDeleteSpecialty() {
  const invalidate = useInvalidateSpecialties();
  return useMutation({
    mutationFn: (id: string) => specialtiesApi.remove(id),
    onSuccess: invalidate,
  });
}
