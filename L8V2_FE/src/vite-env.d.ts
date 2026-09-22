/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `'true'` enables the L8 Booking platform. See src/config/features.ts. */
  readonly VITE_BOOKING_ENABLED?: string;
}
