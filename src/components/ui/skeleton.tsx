import { cn } from "@/lib/utils";

/**
 * Loading placeholder. Renders a brand-tinted block with a shimmer sweep
 * (see `.shimmer` in styles.css); the animation is suppressed automatically
 * under `prefers-reduced-motion`.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };
