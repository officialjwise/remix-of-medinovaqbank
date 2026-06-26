import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, Clock, LifeBuoy } from "lucide-react";
import type { Restriction } from "@/stores/protectionStore";

function countdown(toISO: string) {
  const ms = Math.max(0, new Date(toISO).getTime() - Date.now());
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Shown on a protected surface when the backend reports the user is restricted. */
export function AccessRestricted({ restriction }: { restriction: Restriction }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-error/10 text-error">
        <span className="absolute inset-0 animate-ping rounded-full bg-error/15" />
        <ShieldAlert className="h-9 w-9" />
      </span>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Access temporarily restricted</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Protected content is locked on your account following repeated screen-capture attempts.
      </p>

      <div className="mt-6 w-full space-y-3 rounded-2xl border border-border bg-surface p-5 text-left shadow-[var(--shadow-card)]">
        <Row label="Reason" value={restriction.reason} />
        <Row label="Restricted at" value={new Date(restriction.restrictedAt).toLocaleString()} />
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Unlocks in
          </span>
          <span className="font-mono text-lg font-bold tabular-nums text-error">{countdown(restriction.unlockAt)}</span>
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        This restriction lifts automatically when the timer ends. Think this is a mistake?
      </p>
      <Link
        to="/help"
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
      >
        <LifeBuoy className="h-4 w-4" /> Contact support
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
