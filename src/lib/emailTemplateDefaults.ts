import type { EmailTemplate } from "@/stores/settingsStore";

/**
 * Default transactional email templates. Bodies are inner HTML (content only)
 * — the branded shell (logo header + footer) is applied by the email renderer
 * so all emails share one consistent, professional look.
 */

const btn = (label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#0E7C7B,#2BC97F)"><a href="{{ctaUrl}}" style="display:inline-block;padding:13px 26px;font-weight:700;color:#ffffff;text-decoration:none;font-size:15px">${label}</a></td></tr></table>`;

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">${text}</p>`;
const h = (text: string) =>
  `<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${text}</h1>`;

const callout = (inner: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc"><tr><td style="padding:16px 18px">${inner}</td></tr></table>`;

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: "welcome",
    name: "Welcome / Sign-up",
    subject: "Welcome to {{platformName}}, {{userName}} 👋",
    enabled: true,
    body:
      h("Welcome aboard, {{userName}} 🎉") +
      p(
        "You just joined thousands of medical practitioners sharpening their exam game on {{platformName}}.",
      ) +
      p(
        "Your <strong>7-day free trial</strong> is live — dive into board-style vignettes with detailed clinical breakdowns on every answer.",
      ) +
      btn("Start practising") +
      p("Questions? Reply to this email or reach us at {{supportEmail}}."),
  },
  {
    key: "verify_email",
    name: "Email Verification",
    subject: "Confirm your {{platformName}} email",
    enabled: true,
    body:
      h("Confirm your email") +
      p("Hi {{userName}}, please confirm your email address to secure your account.") +
      btn("Verify email") +
      p(
        "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
      ),
  },
  {
    key: "trial_started",
    name: "Trial Activated",
    subject: "Your {{platformName}} trial is live ⏱️",
    enabled: true,
    body:
      h("Your {{trialDays}}-day trial has started") +
      p("Here's what's included during your trial:") +
      callout(
        `<ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.8"><li>Sample question banks with clinical breakdowns</li><li>{{trialQuestions}} practice questions</li><li>Single-device access (your trial is bound to this device)</li></ul>`,
      ) +
      p(
        "Your trial ends on <strong>{{trialEndDate}}</strong>. Upgrade any time to unlock the full library.",
      ) +
      btn("Upgrade now"),
  },
  {
    key: "trial_expiring",
    name: "Trial Expiring Soon",
    subject: "⏳ {{daysLeft}} days left in your trial",
    enabled: true,
    daysBefore: 2,
    body:
      h("Only {{daysLeft}} days left") +
      p(
        "Your free trial ends on <strong>{{trialEndDate}}</strong>. After that you'll lose access to the full question library, analytics, and the leaderboard.",
      ) +
      p("Upgrade now and keep every bit of your progress.") +
      btn("Upgrade and keep my progress"),
  },
  {
    key: "trial_expired",
    name: "Trial Expired",
    subject: "Your trial has ended — pick up where you left off",
    enabled: true,
    body:
      h("Your trial has ended") +
      p(
        "Hi {{userName}}, your free trial is over — but your stats are saved. Subscribe to a plan to continue practising on {{platformName}}.",
      ) +
      btn("See plans"),
  },
  {
    key: "login_notification",
    name: "Login Notification",
    subject: "New sign-in to your {{platformName}} account",
    enabled: true,
    body:
      h("New sign-in detected") +
      p("We noticed a sign-in to your account:") +
      callout(
        `<table role="presentation" width="100%" style="font-size:14px;color:#334155"><tr><td style="padding:4px 0"><strong>Time</strong></td><td style="padding:4px 0;text-align:right">{{loginTime}}</td></tr><tr><td style="padding:4px 0"><strong>Device</strong></td><td style="padding:4px 0;text-align:right">{{device}}</td></tr><tr><td style="padding:4px 0"><strong>Location</strong></td><td style="padding:4px 0;text-align:right">{{location}}</td></tr></table>`,
      ) +
      p("If this was you, no action is needed. If not, secure your account immediately.") +
      btn("Secure my account"),
  },
  {
    key: "suspicious_login",
    name: "Suspicious Login Alert",
    subject: "⚠️ Unusual sign-in to your account",
    enabled: true,
    body:
      h("Was this you?") +
      p("We blocked a sign-in attempt from a new device/location:") +
      callout(
        `<table role="presentation" width="100%" style="font-size:14px;color:#334155"><tr><td style="padding:4px 0"><strong>Time</strong></td><td style="padding:4px 0;text-align:right">{{loginTime}}</td></tr><tr><td style="padding:4px 0"><strong>Device</strong></td><td style="padding:4px 0;text-align:right">{{device}}</td></tr><tr><td style="padding:4px 0"><strong>Location</strong></td><td style="padding:4px 0;text-align:right">{{location}}</td></tr></table>`,
      ) +
      p("If this wasn't you, reset your password now.") +
      btn("Secure my account"),
  },
  {
    key: "subscription_confirmation",
    name: "Subscription Confirmation",
    subject: "You're subscribed to {{planName}} 🎉",
    enabled: true,
    body:
      h("You're all set, {{userName}}") +
      p(
        "Thanks for subscribing to <strong>{{planName}}</strong>. Your access is active until <strong>{{trialEndDate}}</strong>.",
      ) +
      callout(
        `<p style="margin:0;font-size:14px;color:#334155"><strong>Plan</strong>: {{planName}}<br/><strong>Amount</strong>: GHS {{price}}<br/><strong>Renews</strong>: {{trialEndDate}}</p>`,
      ) +
      p(
        "You now have the full library, Gaussian analytics, the leaderboard, and multi-device access.",
      ) +
      btn("Open my dashboard"),
  },
  {
    key: "payment_receipt",
    name: "Payment Receipt / Invoice",
    subject: "Your {{platformName}} receipt — {{receiptNumber}}",
    enabled: true,
    body:
      h("Receipt {{receiptNumber}}") +
      p("Thanks for your payment, {{userName}}. Here's your receipt.") +
      callout(
        `<table role="presentation" width="100%" style="font-size:14px;color:#334155"><tr><td style="padding:4px 0">{{planName}}</td><td style="padding:4px 0;text-align:right">GHS {{amount}}</td></tr><tr><td style="padding:8px 0;border-top:1px solid #e2e8f0"><strong>Total</strong></td><td style="padding:8px 0;text-align:right;border-top:1px solid #e2e8f0"><strong>GHS {{amount}}</strong></td></tr></table>`,
      ) +
      p("Reference: {{receiptNumber}} · Paid via Paystack") +
      btn("Download invoice"),
  },
  {
    key: "payment_failed",
    name: "Payment Failed",
    subject: "Payment failed for {{planName}}",
    enabled: true,
    body:
      h("We couldn't process your payment") +
      p(
        "Your payment for <strong>{{planName}}</strong> (GHS {{amount}}) didn't go through. To avoid losing access, please update your payment method and retry.",
      ) +
      btn("Retry payment"),
  },
  {
    key: "subscription_expiring",
    name: "Renewal Reminder",
    subject: "Your {{planName}} renews in {{daysLeft}} days",
    enabled: true,
    daysBefore: 5,
    body:
      h("Renewal coming up") +
      p(
        "Your <strong>{{planName}}</strong> plan renews on <strong>{{trialEndDate}}</strong>. No action needed — we'll charge your saved method.",
      ) +
      btn("Manage subscription"),
  },
  {
    key: "password_reset",
    name: "Password Reset",
    subject: "Reset your {{platformName}} password",
    enabled: true,
    body:
      h("Reset your password") +
      p(
        "We received a request to reset your password. Click below to choose a new one — this link expires in 60 minutes.",
      ) +
      btn("Reset password") +
      p("If you didn't request this, you can safely ignore this email."),
  },
  {
    key: "rank_update",
    name: "Leaderboard / Ranking Update",
    subject: "📈 You're now ranked #{{rank}}",
    enabled: true,
    body:
      h("You climbed to #{{rank}}!") +
      p(
        "Nice work, {{userName}} — your average score of <strong>{{score}}%</strong> moved you up the leaderboard this week.",
      ) +
      p("Keep the momentum going and break into the top 100.") +
      btn("View the leaderboard"),
  },
  {
    key: "achievement",
    name: "Achievement / Milestone",
    subject: "🏆 Achievement unlocked!",
    enabled: true,
    body:
      h("Milestone reached 🏆") +
      p(
        "Congratulations {{userName}} — you've hit a new milestone. Every question gets you closer to exam-day confidence.",
      ) +
      btn("Keep practising"),
  },
  {
    key: "newsletter",
    name: "Newsletter / Announcement",
    subject: "{{platformName}} — what's new this month",
    enabled: true,
    body:
      h("What's new") +
      p("Here's what we shipped this month to help you study smarter.") +
      callout(
        `<p style="margin:0;font-size:14px;color:#334155"><strong>New banks</strong> · Emergency Medicine and Clinical Anatomy<br/><strong>Sharper analytics</strong> · per-topic strengths & weaknesses<br/><strong>Faster app</strong> · instant page loads</p>`,
      ) +
      btn("Explore what's new"),
  },
  {
    key: "reengagement",
    name: "Re-engagement (We miss you)",
    subject: "We miss you, {{userName}} 👋",
    enabled: true,
    body:
      h("Your streak is waiting") +
      p(
        "It's been a while since your last session. Jump back in — even 10 questions a day compounds fast before exam season.",
      ) +
      btn("Resume studying"),
  },
];
