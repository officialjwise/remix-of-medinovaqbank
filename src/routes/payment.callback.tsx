import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

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

function PaymentCallback() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/payment/callback" });
  const [status, setStatus] = useState<Status>(search.status ?? "verifying");

  useEffect(() => {
    if (status !== "verifying") return;
    const t = setTimeout(
      () => setStatus(search.reference || search.trxref ? "success" : "failed"),
      1400,
    );
    return () => clearTimeout(t);
  }, [status, search.reference, search.trxref]);

  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => navigate({ to: "/subscription" }), 2500);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0F2B4C] via-[#0E7C7B] to-[#00B4A6] p-6">
      <div className="w-full max-w-md rounded-3xl bg-surface p-10 text-center shadow-2xl">
        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
            <h1 className="mt-5 text-xl font-bold text-foreground">Verifying your payment…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Reference: <code className="font-mono">{search.reference ?? search.trxref ?? "—"}</code>
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h1 className="mt-5 text-2xl font-bold text-foreground">Payment successful</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your subscription is now active. Redirecting you to your account…
            </p>
            <Link
              to="/subscription"
              className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-5 text-sm font-bold text-white shadow-md"
            >
              Go to subscription <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-error" />
            <h1 className="mt-5 text-2xl font-bold text-foreground">Payment could not be verified</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No reference was returned by the payment provider. If you were charged, contact support.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link
                to="/pricing"
                className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-alt"
              >
                Back to pricing
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