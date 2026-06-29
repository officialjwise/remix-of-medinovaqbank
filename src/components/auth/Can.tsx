import type { ReactNode } from "react";
import { useMyPermissions } from "@/hooks/useMyPermissions";

/**
 * Renders children only when the current user holds the required permission(s).
 * Use `permission` for a single key, or `anyOf` when any one of several grants
 * access. `super_admin` always passes (see useMyPermissions).
 *
 *   <Can permission="questions.create"><Button … /></Can>
 *   <Can anyOf={["plans.update", "plans.create"]} fallback={<Locked />}>…</Can>
 */
export function Can({
  permission,
  anyOf,
  fallback = null,
  children,
}: {
  permission?: string;
  anyOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { has, hasAny } = useMyPermissions();
  const allowed = permission ? has(permission) : anyOf ? hasAny(anyOf) : true;
  return <>{allowed ? children : fallback}</>;
}
