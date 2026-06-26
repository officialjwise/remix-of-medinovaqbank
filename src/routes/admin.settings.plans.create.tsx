import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { PlanForm, emptyPlan } from "@/components/admin/PlanForm";

export const Route = createFileRoute("/admin/settings/plans/create")({
  head: () => ({ meta: [{ title: "Admin · New Plan — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: CreatePlan,
});

function CreatePlan() {
  const navigate = useNavigate();
  const isSuper = useAuthStore((s) => s.user?.role) === "SUPER_ADMIN";

  if (!isSuper) return <SuperOnly />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/settings/plans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Plans
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Create plan</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Define pricing, duration, and the features shown to customers.</p>
      </div>

      <PlanForm
        mode="create"
        initial={emptyPlan}
        onSubmit={(values) => {
          toast.success(`Plan "${values.name}" created`);
          navigate({ to: "/admin/settings/plans" });
        }}
      />
    </div>
  );
}

function SuperOnly() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-light text-warning">
        <Lock className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-foreground">Super Admin only</h2>
      <p className="mt-1 text-sm text-muted-foreground">Plan configuration is restricted to super admins.</p>
    </div>
  );
}
