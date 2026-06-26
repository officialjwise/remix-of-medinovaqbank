import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { usePlansStore, type Plan } from "@/stores/plansStore";
import { useFeatureCatalogStore } from "@/stores/featureCatalogStore";
import { SubscriptionPlanForm } from "@/components/admin/SubscriptionPlanForm";

export const Route = createFileRoute("/admin/subscriptions/plans/create")({
  head: () => ({ meta: [{ title: "Admin · New Plan — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: CreatePlan,
});

function CreatePlan() {
  const navigate = useNavigate();
  const isSuper = useAuthStore((s) => s.user?.role) === "SUPER_ADMIN";
  const upsert = usePlansStore((s) => s.upsert);
  const plans = usePlansStore((s) => s.plans);
  const catalog = useFeatureCatalogStore((s) => s.features);

  if (!isSuper) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning"><Lock className="h-6 w-6" /></span>
        <h2 className="mt-4 text-lg font-bold text-foreground">Super Admin only</h2>
        <p className="mt-1 text-sm text-muted-foreground">Plan configuration is restricted to super admins.</p>
      </div>
    );
  }

  const blank: Plan = {
    id: "",
    name: "",
    price: 0,
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
      catalog.map((f) => [f.key, { included: f.type === "boolean", limit: f.type === "limit" ? (f.defaultLimit ?? -1) : undefined }]),
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/subscriptions/plans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Plans</Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Create plan</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Define pricing, duration, features, and the bullets shown to customers. Pricing here drives the public site.</p>
      </div>
      <SubscriptionPlanForm
        mode="create"
        initial={blank}
        onSubmit={(plan) => {
          if (plans.some((p) => p.id === plan.id)) return toast.error(`Plan key "${plan.id}" already exists`);
          upsert(plan);
          toast.success(`Plan "${plan.name}" created`);
          navigate({ to: "/admin/subscriptions/plans" });
        }}
      />
    </div>
  );
}
