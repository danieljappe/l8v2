/**
 * Build-time feature flags.
 *
 * Vite statically replaces `import.meta.env.*` at build time, so a disabled
 * feature's branches are dropped by the bundler rather than shipped and hidden.
 * That also means flipping a flag requires a rebuild, not just a restart.
 */

/**
 * L8 Booking — the artist-booking platform that shares this app with L8 Events.
 *
 * The client paused Booking to focus on Events. Every route, page and entry
 * point is kept intact behind this flag, so bringing it back is a matter of
 * setting `VITE_BOOKING_ENABLED=true` and rebuilding.
 *
 * Unset (or anything other than the string `'true'`) means disabled.
 */
export const BOOKING_ENABLED = import.meta.env.VITE_BOOKING_ENABLED === 'true';
