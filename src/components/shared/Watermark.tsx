import { useEffect, useRef, useState } from "react";

/**
 * Per-user diagonal watermark tiled across a protected surface. This is the
 * strongest deterrent — any leaked frame identifies the leaker. It re-applies
 * itself if removed from the DOM (MutationObserver), and ignores pointer events
 * so it never blocks interaction.
 */
export function Watermark({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  // Keep the timestamp fresh so a captured frame carries an accurate time.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Re-insert the overlay if someone tries to delete it via devtools.
  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const observer = new MutationObserver(() => {
      if (!parent.contains(el)) parent.appendChild(el);
      if (el.style.display === "none" || el.style.visibility === "hidden") {
        el.style.display = "";
        el.style.visibility = "";
      }
    });
    observer.observe(parent, { childList: true, subtree: false });
    observer.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
    return () => observer.disconnect();
  }, []);

  const stamp = `${label} · ${now.toLocaleString()}`;
  // Enough tiles to cover large viewports.
  const tiles = Array.from({ length: 60 });

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden"
      style={{ userSelect: "none" }}
    >
      <div className="flex h-full w-full flex-wrap content-start gap-x-16 gap-y-14 p-6 opacity-[0.10]">
        {tiles.map((_, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-foreground"
            style={{ transform: "rotate(-30deg)" }}
          >
            {stamp}
          </span>
        ))}
      </div>
    </div>
  );
}
