import { createFileRoute } from "@tanstack/react-router";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Medinovaqbank" },
      { name: "description", content: "How Medinovaqbank collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — Medinovaqbank" },
      { property: "og:description", content: "How Medinovaqbank collects, uses, and protects your data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page max-w-3xl py-16">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 1, 2026</p>

        <article className="mt-10 space-y-6 text-sm leading-relaxed">
          <Section title="What we collect">
            Account profile (name, email, specialty, institution), quiz activity (answers, scores,
            timing), device metadata, and payment confirmations from Paystack. We never see or
            store your card details.
          </Section>
          <Section title="How we use it">
            To deliver the Service, personalise recommendations, generate analytics, send essential
            account emails, and meet legal obligations. We do not sell your personal data.
          </Section>
          <Section title="Storage & security">
            Data is encrypted in transit (TLS 1.3) and at rest. Access is restricted to staff who
            need it to operate the Service.
          </Section>
          <Section title="Cookies">
            We use first-party cookies for authentication and core functionality. No advertising
            trackers.
          </Section>
          <Section title="Your rights">
            You may request export or deletion of your data at any time by emailing{" "}
            <a className="text-accent hover:underline" href="mailto:privacy@medinovaqbank.com">privacy@medinovaqbank.com</a>.
          </Section>
          <Section title="Retention">
            Account data is retained while your account is active and for 12 months after closure
            for accounting and abuse-prevention purposes.
          </Section>
          <Section title="Children">
            The Service is not intended for users under 18.
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
