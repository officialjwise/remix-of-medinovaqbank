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
  const socialLinks = Object.entries(social)
    .filter(([, v]) => v)
    .map(([k, v]) => `<a href="${v}" style="color:#64748b;text-decoration:none;margin:0 6px;font-size:12px;text-transform:capitalize">${k}</a>`)
    .join("·");

  const header = logo
    ? `<img src="${logo}" alt="${legal}" height="34" style="height:34px"/>`
    : `<span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">Medinova<span style="color:#bbf7d0">qbank</span></span>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#eef2f5;font-family:Inter,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f5;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px -12px rgba(15,43,76,0.2)">
        <tr><td style="background:linear-gradient(135deg,${primary},${accent});padding:22px 32px">${header}</td></tr>
        <tr><td style="padding:32px">${fillVars(innerHtml, vars)}</td></tr>
        <tr><td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
          <p style="margin:0 0 8px;font-size:12px;color:#64748b;line-height:1.6">${footer}</p>
          ${socialLinks ? `<p style="margin:0 0 8px">${socialLinks}</p>` : ""}
          <p style="margin:0;font-size:11px;color:#94a3b8">© 2026 ${legal} · <a href="#" style="color:#94a3b8">Unsubscribe</a> · <a href="#" style="color:#94a3b8">Privacy</a></p>
        </td></tr>
      </table>
      <p style="margin:14px 0 0;font-size:11px;color:#94a3b8">Sent to {{userName}} · ${legal}</p>
    </td></tr>
  </table>
</body></html>`.replace(/\{\{userName\}\}/g, vars.userName);
}
