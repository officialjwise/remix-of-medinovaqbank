import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { durationPlans } from "@/data/plans";
import { PlanForm, type PlanFormValues, type PlanKey } from "@/components/admin/PlanForm";

export const Route = createFileRoute("/admin/settings/plans/$planId/edit")({
  head: () => ({ meta: [{ title: "Admin · Edit Plan — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: EditPlan,
});

function EditPlan() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const isSuper = useAuthStore((s) => s.user?.role) === "SUPER_ADMIN";

  if (!isSuper) return <SuperOnly />;

  const idx = durationPlans.findIndex((p) => p.id === planId);
  const plan = durationPlans[idx];

  if (!plan) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-muted-foreground">Plan not found.</p>
        <Link to="/admin/settings/plans" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">← Back to plans</Link>
      </div>
    );
  }

  const initial: PlanFormValues = {
    planKey: plan.id as PlanKey,
    name: plan.name,
    price: plan.price,
    durationDays: plan.months * 30,
    badgeLabel: plan.badge?.label ?? "",
    sortOrder: idx,
    active: true,
    features: plan.features.map((text, i) => ({ id: `f${i}`, text, included: true })),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/settings/plans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Plans
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Edit {plan.name}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">The plan key is immutable — everything else can be changed.</p>
      </div>

      <PlanForm
        mode="edit"
        initial={initial}
        onSubmit={(values) => {
          toast.success(`Plan "${values.name}" updated`);
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
