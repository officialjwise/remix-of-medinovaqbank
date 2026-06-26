import { Wrench } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAuthStore } from "@/stores/authStore";

export function MaintenanceScreen() {
  const platformName = useSettingsStore((s) => s.settings.general.platformName);
  const supportEmail = useSettingsStore((s) => s.settings.general.supportEmail);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/10 text-warning">
        <Wrench className="h-9 w-9" />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">We'll be right back</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {platformName} is undergoing scheduled maintenance to bring you a better experience. Please check back shortly.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Need help? Contact{" "}
        <a href={`mailto:${supportEmail}`} className="font-semibold text-accent hover:underline">
          {supportEmail}
        </a>
      </p>
      <button
        type="button"
        onClick={() => logout()}
        className="mt-8 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-alt"
      >
        Sign out
      </button>
    </div>
  );
}
