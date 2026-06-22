// Paystack mock — frontend only. Simulates the live flow described in spec 9.1.
import type { DurationPlan } from "@/data/plans";

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeRef() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PSK-${t}-${r}`;
}

export async function initializePayment(plan: DurationPlan, email: string): Promise<InitializeResponse> {
  await sleep(450);
  const reference = makeRef();
  return {
    reference,
    accessCode: `ac_${reference.slice(-8).toLowerCase()}`,
    authorizationUrl: `https://checkout.paystack.com/${reference}?email=${encodeURIComponent(email)}&amount=${plan.price * 100}`,
  };
}

export async function verifyPayment(reference: string, planId: DurationPlan["id"], amount: number, channel: VerifyResponse["channel"] = "card"): Promise<VerifyResponse> {
  await sleep(700);
  // Mock: 100% success unless reference contains "FAIL"
  const ok = !reference.includes("FAIL");
  return {
    reference,
    status: ok ? "success" : "failed",
    amount,
    paidAt: new Date().toISOString(),
    channel,
    planId,
  };
}
