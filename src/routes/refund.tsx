import { createFileRoute } from "@tanstack/react-router";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Medinovaqbank" },
      { name: "description", content: "Our refund policy for Medinovaqbank subscriptions." },
      { property: "og:title", content: "Refund Policy — Medinovaqbank" },
      { property: "og:description", content: "Our refund policy for Medinovaqbank subscriptions." },
    ],
  }),
  component: Refund,
});

function Refund() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page max-w-3xl py-16">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 1, 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed">
          <p className="text-muted-foreground">
            We offer a free trial of 10 questions so you can experience the platform before paying.
            Because of this, all subscription purchases are final.
          </p>
          <p className="text-muted-foreground">
            Exceptions: if you were charged in error, double-billed, or were unable to access the
            Service due to a documented platform issue, contact{" "}
            <a className="text-accent hover:underline" href="mailto:billing@medinovaqbank.com">billing@medinovaqbank.com</a>
            {" "}within 14 days of the charge. Verified cases are refunded to the original payment
            method via Paystack within 7 business days.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
