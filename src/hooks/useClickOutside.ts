import { useEffect, useRef } from "react";

/**
 * Calls `handler` when a pointer/touch event happens outside the returned ref.
 * Used for closing custom dropdowns and popovers.
 */
export function useClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [handler]);

  return ref;
}
