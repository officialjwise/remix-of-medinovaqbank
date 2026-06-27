import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAdminPlan, useUpdatePlan, toPlanWritePayload } from "@/api/plans.api";
import { useFeatureIdByKey } from "@/api/features.api";
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
  const featureIdByKey = useFeatureIdByKey();
  const { data: plan, isLoading } = useAdminPlan(planId, featureIdByKey);
  const updatePlan = useUpdatePlan();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-muted-foreground">Loading plan…</p>
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
          const payload = toPlanWritePayload(next);
          updatePlan.mutate(
            {
              id: next.id,
              input: {
                name: payload.name,
                durationDays: payload.durationDays,
                price: payload.price,
                currency: payload.currency,
                badge: payload.badge,
                sortOrder: payload.sortOrder,
                isActive: payload.isActive,
                features: payload.features,
                featureMappings: payload.featureMappings,
              },
            },
            {
              onSuccess: () => {
                toast.success(`Plan "${next.name}" updated`);
                navigate({ to: "/admin/subscriptions/plans" });
              },
              onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
            },
          );
        }}
      />
    </div>
  );
}
