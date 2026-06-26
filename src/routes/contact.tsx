import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Send, Twitter } from "lucide-react";
import { toast } from "sonner";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useCmsStore } from "@/stores/cmsStore";
import { useSettingsStore } from "@/stores/settingsStore";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Medinovaqbank" },
      { name: "description", content: "Get in touch with the Medinovaqbank team." },
      { property: "og:title", content: "Contact Us — Medinovaqbank" },
      { property: "og:description", content: "Get in touch with the Medinovaqbank team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { cms } = useCmsStore();
  const { settings } = useSettingsStore();
  const contact = cms.contact;
  const social = settings.branding.social;
  const [submitting, setSubmitting] = useState(false);

  const socials = [
    { href: social.twitter, label: "Twitter", icon: Twitter },
    { href: social.facebook, label: "Facebook", icon: Facebook },
    { href: social.linkedin, label: "LinkedIn", icon: Linkedin },
    { href: social.instagram, label: "Instagram", icon: Instagram },
  ].filter((s) => s.href && s.href.trim().length > 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    toast.success("Message sent. We'll reply within 1 business day.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container-page py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">Contact</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            Talk to our team
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Questions about subscriptions, content licensing, institutional plans, or anything else?
            We typically reply within one business day.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <aside className="space-y-5">
            {contact.email && (
              <ContactCard
                icon={<Mail className="h-5 w-5" />}
                label="Email"
                value={contact.email}
                href={`mailto:${contact.email}`}
              />
            )}
            {contact.phone && (
              <ContactCard
                icon={<Phone className="h-5 w-5" />}
                label="Phone"
                value={contact.phone}
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
              />
            )}
            {contact.address && (
              <ContactCard
                icon={<MapPin className="h-5 w-5" />}
                label="Office"
                value={contact.address}
              />
            )}

            {socials.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Follow us
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={s.label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                    >
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Subject" name="subject" required className="mt-4" />
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Message
              </span>
              <textarea
                name="message"
                required
                rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="How can we help?"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
