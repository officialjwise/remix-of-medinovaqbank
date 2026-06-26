import { useEffect, useState } from "react";

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    async function generateFingerprint() {
      // In a real application, we would use a library like fingerprintjs.
      // For this implementation, we will generate a simple hash based on user agent and screen size,
      // and store it in localStorage so it persists per browser.
      let fp = localStorage.getItem("medinova_device_fp");
      if (!fp) {
        const components = [
          navigator.userAgent,
          navigator.language,
          window.screen.colorDepth,
          window.screen.width + "x" + window.screen.height,
          new Date().getTimezoneOffset(),
        ];

        const rawString = components.join("||");
        const encoder = new TextEncoder();
        const data = encoder.encode(rawString);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        fp = hashHex.substring(0, 16);
        localStorage.setItem("medinova_device_fp", fp);
      }
      setFingerprint(fp);
    }

    generateFingerprint();
  }, []);

  return fingerprint;
}
