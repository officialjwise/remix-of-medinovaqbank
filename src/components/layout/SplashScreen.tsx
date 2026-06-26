import { Loader2 } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-accent" />
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
        Loading Medinovaqbank...
      </p>
    </div>
  );
}
