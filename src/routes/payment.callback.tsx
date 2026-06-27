import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { paymentsApi, planLabel } from "@/api/payments.api";

type Status = "verifying" | "success" | "failed";

export const Route = createFileRoute("/payment/callback")({
  head: () => ({ meta: [{ title: "Verifying payment — Medinovaqbank" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === "string" ? search.reference : undefined,
    trxref: typeof search.trxref === "string" ? search.trxref : undefined,
    status: typeof search.status === "string" ? (search.status as Status) : undefined,
  }),
  component: PaymentCallback,
});

interface VerifiedSummary {
  reference: string;
  planName: string;
  amount: number;
  currency: string;
}

function PaymentCallback() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/payment/callback" });
  const reference = search.reference ?? search.trxref;

  const [status, setStatus] = useState<Status>("verifying");
  const [summary, setSummary] = useState<VerifiedSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Guard against double-invocation (StrictMode / re-render).
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!reference) {
      setError("No reference was returned by the payment provider.");
      setStatus("failed");
      return;
    }

    let cancelled = false;
    void paymentsApi
      .verify(reference)
      .then((res) => {
        if (cancelled) return;
        if (res.transaction.status === "success") {
          setSummary({
            reference: res.transaction.reference,
            planName: planLabel(res.transaction.plan),
            amount: res.transaction.amount,
            currency: res.transaction.currency,
          });
          setStatus("success");
        } else {
          setError("The payment was not successful. If you were charged, contact support.");
          setStatus("failed");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not verify the payment.");
        setStatus("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  // On success, redirect to the dashboard after a short confirmation pause.
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => navigate({ to: "/dashboard" }), 2500);
    return () => clearTimeout(t);
  }, [status, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0F2B4C] via-[#0E7C7B] to-[#00B4A6] p-6">
      <div className="w-full max-w-md rounded-3xl bg-surface p-10 text-center shadow-2xl">
        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
            <h1 className="mt-5 text-xl font-bold text-foreground">Verifying your payment…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Reference: <code className="font-mono">{reference ?? "—"}</code>
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h1 className="mt-5 text-2xl font-bold text-foreground">Payment successful</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your subscription is now active. Redirecting you to your dashboard…
            </p>
            {summary && (
              <div className="mt-4 rounded-lg border border-border bg-surface-alt/40 p-3 text-left text-xs">
                <p>
                  <span className="text-muted-foreground">Plan:</span>{" "}
                  <span className="font-semibold text-foreground">{summary.planName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {summary.currency} {summary.amount.toLocaleString()}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Reference:</span>{" "}
                  <span className="font-mono text-foreground">{summary.reference}</span>
                </p>
              </div>
            )}
            <Link
              to="/dashboard"
              className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-bold text-white shadow-md"
            >
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-error" />
            <h1 className="mt-5 text-2xl font-bold text-foreground">
              Payment could not be verified
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error ?? "Something went wrong while verifying your payment."}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link
                to="/subscription"
                className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-alt"
              >
                Back to plans
              </Link>
              <Link
                to="/help"
                className="inline-flex h-11 items-center rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-bold text-white shadow-md"
              >
                Contact support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
