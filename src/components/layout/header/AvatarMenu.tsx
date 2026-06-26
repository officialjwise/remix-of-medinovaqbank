import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, type LucideIcon } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface AvatarMenuItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  onClick?: () => void;
}

export function AvatarMenu({
  name,
  email,
  roleLabel,
  items,
  onLogout,
}: {
  name: string;
  email: string;
  roleLabel?: string;
  items: AvatarMenuItem[];
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const initials = (name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-sm ring-2 ring-transparent transition hover:ring-accent/30"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card-hover)]">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            {roleLabel && (
              <span className="mt-1.5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                {roleLabel}
              </span>
            )}
          </div>
          <div className="py-1">
            {items.map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-alt"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    item.onClick?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground hover:bg-surface-alt"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                </button>
              ),
            )}
          </div>
          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-error hover:bg-error/10"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
