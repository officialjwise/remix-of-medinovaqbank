import { useEffect, useRef, useState, type ReactNode } from "react";

interface VirtualRowsProps<T> {
  items: T[];
  /** Fixed pixel height of a single row. */
  rowHeight: number;
  /** Height of the scroll viewport in px. */
  height: number;
  /** Extra rows rendered above/below the viewport to smooth fast scrolls. */
  overscan?: number;
  renderRow: (item: T, index: number) => ReactNode;
  className?: string;
}

/**
 * Minimal windowing list — renders only the rows visible in the viewport
 * (plus a small overscan) so tables with hundreds/thousands of rows stay fast.
 * Deliberately dependency-free to keep the bundle lean.
 */
export function VirtualRows<T>({
  items,
  rowHeight,
  height,
  overscan = 6,
  renderRow,
  className,
}: VirtualRowsProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const total = items.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const end = Math.min(items.length, start + visibleCount);
  const slice = items.slice(start, end);

  return (
    <div ref={ref} className={className} style={{ height, overflowY: "auto" }}>
      <div style={{ height: total, position: "relative" }}>
        <div style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {slice.map((item, i) => (
            <div key={start + i} style={{ height: rowHeight }}>
              {renderRow(item, start + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
