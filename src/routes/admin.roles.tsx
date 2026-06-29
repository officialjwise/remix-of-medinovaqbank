import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Roles & Permissions has been consolidated into System Settings (the
 * "Roles & Permissions" tab) — the single source of truth for the RBAC matrix.
 * This route now just forwards there so old links/bookmarks keep working.
 */
export const Route = createFileRoute("/admin/roles")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/settings/system", search: { tab: "roles" } });
  },
});
