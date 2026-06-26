import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, Twitter } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useSettingsStore } from "@/stores/settingsStore";
import { useCmsStore } from "@/stores/cmsStore";

export function PublicFooter() {
  const { settings } = useSettingsStore();
  const { cms } = useCmsStore();
  const { platformName, tagline } = settings.general;
  const social = settings.branding.social;
  const contactEmail = cms.contact.email || settings.general.supportEmail;

  const socials = [
    { href: social.twitter, label: "Twitter", icon: Twitter },
    { href: social.facebook, label: "Facebook", icon: Facebook },
    { href: social.linkedin, label: "LinkedIn", icon: Linkedin },
    { href: social.instagram, label: "Instagram", icon: Instagram },
  ].filter((s) => s.href && s.href.trim().length > 0);

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo size={36} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tagline} A professional question bank built for Ghanaian and international medical
            practitioners.
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent"
          >
            <Mail className="h-4 w-4" />
            {contactEmail}
          </a>

          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-2">
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
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Product</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Support</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/help" className="hover:text-foreground">
                Help center
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-foreground">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Legal</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/terms" className="hover:text-foreground">
                {cms.legal.terms.title}
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-foreground">
                {cms.legal.privacy.title}
              </Link>
            </li>
            <li>
              <Link to="/refund" className="hover:text-foreground">
                {cms.legal.refund.title}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-start justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {platformName}. All rights reserved.
          </p>
          <p>Made with care in {cms.contact.address || "Accra, Ghana"}.</p>
        </div>
      </div>
    </footer>
  );
}
