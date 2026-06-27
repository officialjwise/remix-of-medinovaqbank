import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CreditCard, Loader2, Smartphone, Building2, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { DurationPlan } from "@/api/plans.api";
import { initializePayment, verifyPayment, type VerifyResponse } from "@/lib/paystack";
import { useAuthStore } from "@/stores/authStore";

type Stage = "idle" | "initializing" | "checkout" | "verifying" | "success" | "failed";
type Channel = "card" | "mobile_money" | "bank";

export function PaystackCheckoutModal({
  plan,
  open,
  onClose,
}: {
  plan: DurationPlan | null;
  open: boolean;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const setSubscription = useAuthStore((s) => s.setSubscription);
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("idle");
  const [reference, setReference] = useState<string>("");
  const [channel, setChannel] = useState<Channel>("card");
  const [verified, setVerified] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    if (!open || !plan) return;
    setStage("initializing");
    setVerified(null);
    initializePayment(plan, user?.email ?? "guest@medinovaqbank.com")
      .then((r) => {
        setReference(r.reference);
        setStage("checkout");
      })
      .catch(() => {
        toast.error("Could not start payment. Please try again.");
        setStage("failed");
      });
  }, [open, plan, user?.email]);

  if (!open || !plan) return null;

  const close = () => {
    if (stage === "verifying" || stage === "initializing") return;
    setStage("idle");
    onClose();
  };

  const pay = async () => {
    setStage("verifying");
    try {
      const v = await verifyPayment(reference, plan.id, plan.price, channel);
      if (v.status !== "success") {
        toast.error("Payment failed. No charge was made.");
        setStage("failed");
        return;
      }
      const renews = new Date();
      renews.setMonth(renews.getMonth() + plan.months);
      setSubscription({
        status: "ACTIVE",
        planName: plan.name,
        renewsAt: renews.toISOString(),
      });
      setVerified(v);
      setStage("success");
    } catch {
      toast.error("Verification error. Please contact support.");
      setStage("failed");
    }
  };

  const goDashboard = () => {
    onClose();
    setStage("idle");
    navigate({ to: "/dashboard" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Paystack-styled header */}
        <div className="flex items-center justify-between bg-primary px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-xs font-bold">
              P
            </span>
            <span className="text-sm font-bold">Paystack Checkout</span>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-md p-1 hover:bg-white/10 disabled:opacity-50"
            disabled={stage === "verifying" || stage === "initializing"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {stage === "initializing" && <Loading label="Connecting to Paystack…" />}

          {stage === "checkout" && (
            <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pay {plan.currency} to Medinovaqbank
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                {plan.currency} {plan.price.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {plan.name} · {plan.durationLabel.replace(/^\//, "")}
              </p>

              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Pay with
                </p>
                <div className="mt-2 grid gap-2">
                  <ChannelRow
                    active={channel === "card"}
                    onClick={() => setChannel("card")}
                    icon={<CreditCard className="h-4 w-4" />}
                    title="Card"
                    hint="Visa, Mastercard, Verve"
                  />
                  <ChannelRow
                    active={channel === "mobile_money"}
                    onClick={() => setChannel("mobile_money")}
                    icon={<Smartphone className="h-4 w-4" />}
                    title="Mobile Money"
                    hint="MTN, Vodafone, AirtelTigo"
                  />
                  <ChannelRow
                    active={channel === "bank"}
                    onClick={() => setChannel("bank")}
                    icon={<Building2 className="h-4 w-4" />}
                    title="Bank Transfer"
                    hint="GHS account transfer"
                  />
                </div>
              </div>

              <p className="mt-4 font-mono text-[11px] text-muted-foreground">Ref: {reference}</p>

              <button
                onClick={pay}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary/90"
              >
                Pay {plan.currency} {plan.price.toLocaleString()}
              </button>
              <button
                onClick={close}
                className="mt-2 inline-flex h-9 w-full items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </>
          )}

          {stage === "verifying" && <Loading label="Verifying your payment…" />}

          {stage === "success" && verified && (
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light text-success">
                <Check className="h-8 w-8" />
              </span>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground">
                🎉 Subscription Activated!
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You now have full access to every question bank.
              </p>
              <div className="mt-4 rounded-lg border border-border bg-surface-alt/40 p-3 text-left text-xs">
                <p>
                  <span className="text-muted-foreground">Plan:</span>{" "}
                  <span className="font-semibold text-foreground">{plan.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {plan.currency} {plan.price}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Reference:</span>{" "}
                  <span className="font-mono text-foreground">{verified.reference}</span>
                </p>
              </div>
              <button
                onClick={goDashboard}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground hover:bg-accent/90"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {stage === "failed" && (
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-light text-error">
                <X className="h-8 w-8" />
              </span>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground">
                Payment Failed
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No charge was made. Please try again.
              </p>
              <button
                onClick={close}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-surface text-sm font-bold text-foreground hover:bg-surface-alt"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ChannelRow({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-surface-alt"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-md ${active ? "bg-primary text-white" : "bg-surface-alt text-muted-foreground"}`}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        className={`h-4 w-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-border"}`}
      />
    </button>
  );
}
