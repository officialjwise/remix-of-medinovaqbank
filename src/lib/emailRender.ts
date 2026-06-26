import type { BrandingSettings } from "@/stores/settingsStore";

/** Sample values used to render template previews and test sends. */
export const SAMPLE_VARS: Record<string, string> = {
  userName: "Akua Mensah",
  platformName: "Medinovaqbank",
  planName: "12-Month Access",
  price: "799",
  amount: "799.00",
  daysLeft: "3",
  trialDays: "7",
  trialQuestions: "10",
  trialEndDate: "3 Jul 2026",
  loginTime: "26 Jun 2026, 09:14 GMT",
  location: "Accra, Ghana",
  device: "Chrome on Windows",
  rank: "142",
  score: "84",
  receiptNumber: "MQB-2026-00481",
  invoiceUrl: "#",
  ctaUrl: "#",
  supportEmail: "support@medinovaqbank.com",
};

export function fillVars(input: string, vars: Record<string, string> = SAMPLE_VARS): string {
  return input.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/**
 * Wraps a template's inner HTML body in a branded, email-client-safe shell
 * (table-based, logo header, copyright/social footer). Returns a full HTML doc
 * string suitable for an iframe srcDoc preview.
 */
export function renderBrandedEmail(
  innerHtml: string,
  subject: string,
  branding: BrandingSettings,
  vars: Record<string, string> = SAMPLE_VARS,
): string {
  const primary = branding.primaryColor || "#0E7C7B";
  const accent = branding.accentColor || "#2BC97F";
  const logo = branding.emailHeaderLogo || branding.logoLight;
  const footer = fillVars(branding.emailFooterText || "", vars);
  const legal = branding.companyLegalName || "Medinovaqbank";
  const social = branding.social || { twitter: "", facebook: "", linkedin: "", instagram: "" };

  // Per-template accent + eyebrow derived from the subject so categories read
  // distinctly (billing = blue, security = red, trial = amber, etc.).
  const s = subject.toLowerCase();
  const category =
    /receipt|invoice|payment|subscrib|renew|plan/.test(s)
      ? { label: "Billing", from: "#2563EB", to: "#3B82F6" }
      : /suspicious|unusual|alert|sign-in|login/.test(s)
        ? { label: "Security", from: "#B91C1C", to: "#EF4444" }
        : /trial|expir/.test(s)
          ? { label: "Your trial", from: "#D97706", to: "#F59E0B" }
          : /rank|leaderboard|achievement|milestone/.test(s)
            ? { label: "Progress", from: "#7C3AED", to: "#A855F7" }
            : /welcome|verify|confirm/.test(s)
              ? { label: "Welcome", from: primary, to: accent }
              : { label: "Medinovaqbank", from: primary, to: accent };

  const socialIcon = (label: string, href: string) =>
    `<a href="${href}" style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;border-radius:50%;background:#e2e8f0;color:#475569;text-decoration:none;font-size:12px;font-weight:700;margin:0 3px">${label[0].toUpperCase()}</a>`;
  const socialChips = Object.entries(social)
    .filter(([, v]) => v)
    .map(([k, v]) => socialIcon(k, v))
    .join("");

  const header = logo
    ? `<img src="${logo}" alt="${legal}" height="30" style="height:30px"/>`
    : `<span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">Medinova<span style="color:#bbf7d0">qbank</span></span>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<base href="https://medinovaqbank.com/" target="_blank"/>
<style>a{pointer-events:none;cursor:default}</style></head>
<body style="margin:0;padding:0;background:#eef2f5;font-family:Inter,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f5;padding:30px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 34px -14px rgba(15,43,76,0.28)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,${category.from},${category.to});padding:20px 32px" align="left">
          <table role="presentation" width="100%"><tr>
            <td align="left" style="vertical-align:middle">${header}</td>
            <td align="right" style="vertical-align:middle"><span style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,0.18);color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase">${category.label}</span></td>
          </tr></table>
        </td></tr>
        <!-- Accent rule -->
        <tr><td style="height:4px;background:linear-gradient(90deg,${category.from},${category.to})"></td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 36px 28px">${fillVars(innerHtml, vars)}</td></tr>
        <!-- Divider -->
        <tr><td style="padding:0 36px"><div style="height:1px;background:#edf1f5"></div></td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 36px 28px;background:#fbfcfe" align="center">
          ${socialChips ? `<div style="margin:0 0 14px">${socialChips}</div>` : ""}
          <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.6">${footer}</p>
          <p style="margin:0;font-size:11px;color:#94a3b8">© 2026 ${legal} · Accra, Ghana · <a href="#" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a> · <a href="#" style="color:#94a3b8;text-decoration:underline">Privacy</a></p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#9aa6b2">Sent to ${vars.userName} · You're receiving this because you have a ${legal} account.</p>
    </td></tr>
  </table>
</body></html>`;
}
