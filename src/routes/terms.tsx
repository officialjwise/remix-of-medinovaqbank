import { createFileRoute } from "@tanstack/react-router";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Medinovaqbank" },
      { name: "description", content: "The terms governing use of the Medinovaqbank platform." },
      { property: "og:title", content: "Terms of Service — Medinovaqbank" },
      { property: "og:description", content: "The terms governing use of the Medinovaqbank platform." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page max-w-3xl py-16">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 1, 2026</p>

        <article className="prose prose-slate mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground">
          <Section title="1. Acceptance of Terms">
            By accessing or using Medinovaqbank ("the Service"), you agree to be bound by these Terms.
            If you do not agree, you may not use the Service. The Service is intended for medical
            students and qualified practitioners for educational purposes only.
          </Section>
          <Section title="2. Educational Use Only">
            Content is provided for self-assessment and exam preparation. It is not medical advice
            and must never be used to diagnose or treat real patients. Clinical decisions remain the
            sole responsibility of the licensed practitioner.
          </Section>
          <Section title="3. Accounts">
            You must provide accurate information when creating an account. You are responsible for
            all activity under your account and must keep your credentials confidential.
          </Section>
          <Section title="4. Subscriptions & Payments">
            Subscriptions are billed in Ghana Cedis (GHS) via Paystack. All sales are final except
            as outlined in our Refund Policy. Pricing may change with 30 days' notice.
          </Section>
          <Section title="5. Acceptable Use">
            You may not redistribute, scrape, resell, or republish any question, explanation, or
            content. Sharing accounts is prohibited and may result in suspension without refund.
          </Section>
          <Section title="6. Intellectual Property">
            All content, branding, and software are the property of Medinovaqbank. You receive a
            limited, non-transferable license to use the Service while your subscription is active.
          </Section>
          <Section title="7. Termination">
            We may suspend or terminate accounts that violate these Terms. You may cancel at any
            time from your account settings.
          </Section>
          <Section title="8. Disclaimer">
            The Service is provided "as is" without warranty. We do not guarantee exam success.
          </Section>
          <Section title="9. Contact">
            Questions? Email <a className="text-accent hover:underline" href="mailto:support@medinovaqbank.com">support@medinovaqbank.com</a>.
          </Section>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </section>
  );
}
