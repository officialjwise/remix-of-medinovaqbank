import { useMemo } from "react";

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
  value: number;
  code: string;
}

interface GeoBubbleMapProps {
  points: GeoPoint[];
  max?: number;
}

/**
 * Dependency-free equirectangular world bubble map.
 * viewBox is 360 x 180 so 1 unit == 1 degree.
 *   x = lng + 180   (0 .. 360)
 *   y = 90 - lat    (0 .. 180)
 */
export function GeoBubbleMap({ points, max }: GeoBubbleMapProps) {
  const computedMax = useMemo(
    () => max ?? Math.max(1, ...points.map((p) => p.value)),
    [max, points],
  );

  const projected = useMemo(() => {
    const largest = points.reduce(
      (acc, p) => (p.value > acc ? p.value : acc),
      -Infinity,
    );
    return points.map((p) => {
      const r = 2 + (p.value / computedMax) * 10;
      return {
        ...p,
        cx: p.lng + 180,
        cy: 90 - p.lat,
        r,
        isLargest: p.value === largest,
      };
    });
  }, [points, computedMax]);

  const verticals = useMemo(
    () => Array.from({ length: 11 }, (_, i) => i * 30), // 0..300 -> every 30°
    [],
  );
  const horizontals = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (i + 1) * 30), // 30..150
    [],
  );

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 360 180"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        role="img"
        aria-label="World map of users by country"
      >
        {/* ocean / surface backdrop */}
        <rect
          x="0"
          y="0"
          width="360"
          height="180"
          rx="4"
          fill="var(--color-surface-alt)"
        />

        {/* graticule */}
        <g stroke="var(--color-border)" strokeWidth={0.3} opacity={0.6}>
          {verticals.map((x) => (
            <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={180} />
          ))}
          {horizontals.map((y) => (
            <line key={`h-${y}`} x1={0} y1={y} x2={360} y2={y} />
          ))}
          {/* equator + prime meridian slightly stronger */}
          <line x1={0} y1={90} x2={360} y2={90} strokeWidth={0.5} />
          <line x1={180} y1={0} x2={180} y2={180} strokeWidth={0.5} />
        </g>

        {/* bubbles */}
        <g>
          {projected.map((p) => (
            <g key={p.code}>
              {p.isLargest && (
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={p.r}
                  fill="#2BC97F"
                  fillOpacity={0.25}
                >
                  <animate
                    attributeName="r"
                    values={`${p.r};${p.r * 2.1};${p.r}`}
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="fill-opacity"
                    values="0.35;0;0.35"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill="#0E7C7B"
                fillOpacity={0.55}
                stroke="#2BC97F"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              >
                <title>{`${p.label}: ${p.value.toLocaleString()}`}</title>
              </circle>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default GeoBubbleMap;
