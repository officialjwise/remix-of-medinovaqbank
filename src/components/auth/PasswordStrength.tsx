import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cheap, dependency-free password scorer (0–4). Rewards length and character
 * variety; very short passwords are capped at "Weak" no matter what.
 */
export function passwordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (classes >= 2) score += 1;
  if (classes >= 3) score += 1;
  if (pw.length < 6) score = Math.min(score, 1);
  return Math.min(score, 4);
}

const META: Record<number, { label: string; bar: string; text: string }> = {
  1: { label: "Weak", bar: "bg-error", text: "text-error" },
  2: { label: "Fair", bar: "bg-warning", text: "text-warning" },
  3: { label: "Good", bar: "bg-primary", text: "text-primary" },
  4: { label: "Strong", bar: "bg-accent", text: "text-accent" },
};

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const score = passwordScore(password);
  const meta = META[score] ?? META[1];

  const checks = [
    { ok: password.length >= 8, label: "8+ characters" },
    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password), label: "Upper & lowercase" },
    { ok: /\d/.test(password), label: "A number" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "A symbol" },
  ];

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                i <= score ? meta.bar : "bg-border",
              )}
            />
          ))}
        </div>
        <span className={cn("w-12 shrink-0 text-right text-xs font-semibold", meta.text)}>
          {meta.label}
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {checks.map((c) => (
          <li
            key={c.label}
            className={cn(
              "flex items-center gap-1.5 text-[11px] transition-colors",
              c.ok ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors",
                c.ok ? "bg-accent text-white" : "bg-surface-alt text-muted-foreground/60",
              )}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
