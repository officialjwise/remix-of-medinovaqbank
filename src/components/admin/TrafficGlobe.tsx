import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export interface GlobeMarker {
  location: [number, number]; // [lat, lng]
  size: number; // 0..1
}

/**
 * Interactive WebGL globe (cobe, ~5KB). Auto-rotates, drag to spin. Plots
 * traffic origins as markers sized by volume. Lazy-loaded by the traffic page
 * so three-free WebGL setup never blocks initial paint.
 */
export function TrafficGlobe({
  markers,
  dark = false,
}: {
  markers: GlobeMarker[];
  dark?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerMovement = useRef(0);
  const phiRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = canvas.offsetWidth || 400;
    const onResize = () => {
      if (canvas) width = canvas.offsetWidth || width;
    };
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.25,
      dark: dark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: dark ? 6 : 1.6,
      baseColor: dark ? [0.32, 0.36, 0.4] : [0.85, 0.9, 0.9],
      markerColor: [0.05, 0.78, 0.62],
      glowColor: dark ? [0.06, 0.49, 0.48] : [0.9, 0.96, 0.95],
      markers,
    });

    // cobe v2 has no internal loop — drive frames ourselves.
    let frame = 0;
    const tick = () => {
      if (pointerInteracting.current === null) phiRef.current += 0.004;
      globe.update({
        phi: phiRef.current + pointerMovement.current / 200,
        width: width * 2,
        height: width * 2,
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [markers, dark]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerMovement.current;
          (e.currentTarget as HTMLCanvasElement).style.cursor = "grabbing";
        }}
        onPointerUp={(e) => {
          pointerInteracting.current = null;
          (e.currentTarget as HTMLCanvasElement).style.cursor = "grab";
        }}
        onPointerOut={(e) => {
          pointerInteracting.current = null;
          (e.currentTarget as HTMLCanvasElement).style.cursor = "grab";
        }}
        onPointerMove={(e) => {
          if (pointerInteracting.current !== null) {
            pointerMovement.current = e.clientX - pointerInteracting.current;
          }
        }}
        className="h-full w-full cursor-grab"
        style={{ contain: "layout paint size" }}
      />
    </div>
  );
}
