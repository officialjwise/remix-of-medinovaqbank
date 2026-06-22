import { Construction } from "lucide-react";

export function Stub({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="card-surface p-10 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent">
          <Construction className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <p className="mt-6 inline-flex rounded-full bg-warning-light px-3 py-1 text-xs font-semibold text-warning">
          Coming in the next build pass
        </p>
      </div>
    </div>
  );
}
