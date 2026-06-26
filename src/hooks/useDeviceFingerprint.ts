import { useEffect, useState } from "react";
import { getDeviceFingerprint, getCachedFingerprint } from "@/lib/device";

/**
 * React access to the stable device fingerprint (see `@/lib/device`). The same
 * value is sent on every API request by the axios client.
 */
export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(() => getCachedFingerprint());

  useEffect(() => {
    let active = true;
    void getDeviceFingerprint().then((fp) => {
      if (active) setFingerprint(fp);
    });
    return () => {
      active = false;
    };
  }, []);

  return fingerprint;
}
