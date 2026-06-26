/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend REST base URL incl. the /api/v1 prefix. */
  readonly VITE_API_URL?: string;
  /** Realtime gateway origin (socket.io). */
  readonly VITE_WS_URL?: string;
  /** Paystack public key (only when using inline checkout). */
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
