/**
 * Paystack helpers — now backed by the REAL backend (no mock).
 *
 * The canonical implementation lives in `@/api/payments.api` (TanStack hooks +
 * `paymentsApi`). This thin shim preserves the historical import surface
 * (`initializePayment` / `verifyPayment` / the response types) so existing
 * call-sites keep type-checking. It maps the frontend `DurationPlan` to the
 * backend plan key and delegates to `paymentsApi`.
 *
 * NOTE: the real flow REDIRECTS to Paystack (authorizationUrl). The old
 * in-page "checkout modal" simulation is no longer the source of truth; prefer
 * the redirect flow wired in routes/_app.subscription.tsx + payment.callback.tsx.
 */
import type { DurationPlan } from "@/data/plans";
import { paymentsApi, type BackendSubscriptionPlan } from "@/api/payments.api";

export interface InitializeResponse {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export interface VerifyResponse {
  reference: string;
  status: "success" | "failed";
  amount: number; // GHS
  paidAt: string;
  channel: "card" | "mobile_money" | "bank";
  planId: DurationPlan["id"];
}

/** A DurationPlan id IS the backend plan key in the live wiring (see toDurationPlan). */
function toPlanKey(plan: DurationPlan): BackendSubscriptionPlan {
  return plan.id as unknown as BackendSubscriptionPlan;
}

/** Start a real Paystack checkout. Returns the redirect URL + reference. */
export async function initializePayment(
  plan: DurationPlan,
  _email?: string,
): Promise<InitializeResponse> {
  const r = await paymentsApi.initialize(toPlanKey(plan));
  return {
    authorizationUrl: r.authorizationUrl,
    reference: r.reference,
    accessCode: r.accessCode,
  };
}

/** Verify a real payment by reference. `planId`/`amount`/`channel` are display-only. */
export async function verifyPayment(
  reference: string,
  planId: DurationPlan["id"],
  amount: number,
  channel: VerifyResponse["channel"] = "card",
): Promise<VerifyResponse> {
  const { transaction } = await paymentsApi.verify(reference);
  return {
    reference: transaction.reference,
    status: transaction.status === "success" ? "success" : "failed",
    amount: transaction.amount || amount,
    paidAt: transaction.createdAt,
    channel,
    planId,
  };
}
