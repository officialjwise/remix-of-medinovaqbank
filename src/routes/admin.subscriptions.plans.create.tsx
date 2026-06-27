import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAdminPlans, useCreatePlan, toPlanWritePayload, type Plan } from "@/api/plans.api";
import { useFeatures } from "@/api/features.api";
import { SubscriptionPlanForm } from "@/components/admin/SubscriptionPlanForm";

export const Route = createFileRoute("/admin/subscriptions/plans/create")({
  head: () => ({
    meta: [{ title: "Admin · New Plan — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: CreatePlan,
});

function CreatePlan() {
  const navigate = useNavigate();
  const createPlan = useCreatePlan();
  const { data: plans = [] } = useAdminPlans();
  const { data: catalog = [] } = useFeatures();

  const blank: Plan = {
    id: "",
    planKey: "",
    name: "",
    price: 0,
    currency: "GHS",
    durationDays: 30,
    durationLabel: "/month",
    badgeLabel: "",
    sortOrder: plans.length,
    active: true,
    subscribers: 0,
    bullets: [
      { id: "b1", text: "Full access to every question bank", included: true },
      { id: "b2", text: "AI clinical breakdowns on every answer", included: true },
      { id: "b3", text: "Performance analytics dashboard", included: true },
    ],
    catalogFeatures: Object.fromEntries(
      catalog.map((f) => [
        f.key,
        {
          featureKey: f.key,
          featureId: f.id,
          included: f.type === "boolean",
          limit: f.type === "limit" ? (f.defaultLimit ?? -1) : undefined,
        },
      ]),
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/subscriptions/plans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Plans
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Create plan</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Define pricing, duration, features, and the bullets shown to customers. Pricing here
          drives the public site.
        </p>
      </div>
      <SubscriptionPlanForm
        mode="create"
        initial={blank}
        onSubmit={(plan) => {
          if (plans.some((p) => p.planKey === plan.planKey))
            return toast.error(`A "${plan.planKey}" plan already exists`);
          const payload = toPlanWritePayload(plan);
          createPlan.mutate(
            {
              plan: plan.planKey,
              isTrial: plan.planKey === "free_trial",
              name: payload.name,
              durationDays: payload.durationDays,
              price: payload.price,
              currency: payload.currency,
              badge: payload.badge,
              sortOrder: payload.sortOrder,
              features: payload.features,
              featureMappings: payload.featureMappings,
            },
            {
              onSuccess: () => {
                toast.success(`Plan "${plan.name}" created`);
                navigate({ to: "/admin/subscriptions/plans" });
              },
              onError: (e) => toast.error(e instanceof Error ? e.message : "Create failed"),
            },
          );
        }}
      />
    </div>
  );
}
