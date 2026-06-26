import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useDebounce } from "@/hooks/useDebounce";

export interface SearchItem {
  id: string;
  label: string;
  sublabel?: string;
  group: string;
  onSelect: () => void;
}

export function HeaderSearch({
  placeholder,
  items,
  tone = "default",
}: {
  placeholder: string;
  items: SearchItem[];
  tone?: "default" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter((i) => i.label.toLowerCase().includes(q) || i.sublabel?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [debounced, items]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return [...map.entries()];
  }, [results]);

  function Dropdown() {
    if (!query.trim()) return null;
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card-hover)]">
        {results.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results for "{query}"</p>
        ) : (
          <div className="max-h-80 overflow-y-auto py-1">
            {grouped.map(([group, rows]) => (
              <div key={group}>
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{group}</p>
                {rows.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      r.onSelect();
                      setOpen(false);
                      setMobileOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-alt"
                  >
                    <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{r.label}</span>
                      {r.sublabel && <span className="block truncate text-xs text-muted-foreground">{r.sublabel}</span>}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-border bg-surface-alt pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <>
      {/* Desktop inline search */}
      <div ref={ref} className="relative hidden md:block md:w-72 lg:w-96">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={inputClass}
        />
        {open && <Dropdown />}
      </div>

      {/* Mobile: icon that expands to full-width overlay */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`rounded-lg p-2 md:hidden ${tone === "dark" ? "text-white/70 hover:bg-white/10" : "text-muted-foreground hover:bg-surface-alt hover:text-foreground"}`}
        aria-label="Search"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 p-4 backdrop-blur md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setQuery("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative">
              <Dropdown />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
