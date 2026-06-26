import { useMemo } from "react";

export interface HeatmapRow {
  day: string;
  hours: number[]; // length 24, values 0..100
}

interface UsageHeatmapProps {
  data: HeatmapRow[];
}

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

/** Brand-teal cell fill: alpha scales 0.08 -> 1 with value/100. */
function cellColor(value: number): string {
  const alpha = 0.08 + (Math.max(0, Math.min(100, value)) / 100) * 0.92;
  return `rgba(14,124,123,${alpha.toFixed(3)})`;
}

/**
 * Clean 7-rows (days) x 24-cols (hours) activity heatmap. Each cell is a
 * rounded square tinted with brand teal by intensity. Readable axis labels and
 * a Less -> More gradient legend. Uses an inline grid template because Tailwind
 * v4 has no grid-cols-24.
 */
export function UsageHeatmap({ data }: UsageHeatmapProps) {
  const peak = useMemo(() => {
    let best = { day: "", hour: 0, value: -1 };
    for (const row of data) {
      row.hours.forEach((v, h) => {
        if (v > best.value) best = { day: row.day, hour: h, value: v };
      });
    }
    return best;
  }, [data]);

  const gridTemplate = "auto repeat(24, minmax(0, 1fr))";

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Hour axis */}
          <div className="grid items-center gap-1" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="pr-2" />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="text-center text-[10px] font-medium tabular-nums text-muted-foreground"
              >
                {HOUR_TICKS.includes(h) ? h : ""}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="mt-1.5 space-y-1.5">
            {data.map((row) => (
              <div
                key={row.day}
                className="grid items-center gap-1"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="pr-3 text-right text-[11px] font-semibold text-muted-foreground">
                  {row.day}
                </div>
                {row.hours.map((v, h) => (
                  <div
                    key={h}
                    className="group relative aspect-square rounded-[4px] ring-1 ring-inset ring-border/30 transition-transform duration-100 hover:scale-110 hover:ring-2 hover:ring-[#0E7C7B]"
                    style={{ backgroundColor: cellColor(v) }}
                    title={`${row.day} ${String(h).padStart(2, "0")}:00 — ${v}% activity`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Bottom axis caption */}
          <p className="mt-2 pl-9 text-[10px] text-muted-foreground">
            Hour of day (local time, 24h)
          </p>
        </div>
      </div>

      {/* Footer: peak callout + gradient legend */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Peak activity{" "}
          <span className="font-semibold text-foreground">
            {peak.day} at {String(peak.hour).padStart(2, "0")}:00
          </span>{" "}
          ({peak.value}%)
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Less</span>
          <span
            className="h-3 w-28 rounded-full ring-1 ring-inset ring-border/40"
            style={{
              background: "linear-gradient(to right, rgba(14,124,123,0.08), rgba(14,124,123,1))",
            }}
          />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default UsageHeatmap;
