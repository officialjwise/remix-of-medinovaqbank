import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { usePlansStore } from "@/stores/plansStore";
import { SubscriptionPlanForm } from "@/components/admin/SubscriptionPlanForm";

export const Route = createFileRoute("/admin/subscriptions/plans/$planId/edit")({
  head: () => ({
    meta: [{ title: "Admin · Edit Plan — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: EditPlan,
});

function EditPlan() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const isSuper = useAuthStore((s) => s.user?.role) === "SUPER_ADMIN";
  const plan = usePlansStore((s) => s.plans.find((p) => p.id === planId));
  const upsert = usePlansStore((s) => s.upsert);

  if (!isSuper) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning">
          <Lock className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-foreground">Super Admin only</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan configuration is restricted to super admins.
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-muted-foreground">Plan not found.</p>
        <Link
          to="/admin/subscriptions/plans"
          className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          ← Back to plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/subscriptions/plans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Plans
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Edit {plan.name}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          The plan key is immutable — everything else can be changed.
        </p>
      </div>
      <SubscriptionPlanForm
        mode="edit"
        initial={plan}
        onSubmit={(next) => {
          upsert(next);
          toast.success(`Plan "${next.name}" updated`);
          navigate({ to: "/admin/subscriptions/plans" });
        }}
      />
    </div>
  );
}
