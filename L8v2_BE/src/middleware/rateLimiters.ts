import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// IPv4-mapped loopback address produced by Node's net stack when the host
// receives a request from 127.0.0.1 on a dual-stack socket.
const LOCALHOST_V4_MAPPED = '::ffff:127.0.0.1';

/** True in development, test, and when NODE_ENV is unset. */
export const isDevelopment =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test' ||
  !process.env.NODE_ENV;

function isLocalhost(req: Request): boolean {
  const ip = req.ip || req.socket.remoteAddress || '';
  return (
    ip.includes('127.0.0.1') ||
    ip.includes('::1') ||
    ip === LOCALHOST_V4_MAPPED ||
    ip === 'localhost'
  );
}

/**
 * Shared skip predicate: bypass limits for loopback traffic in non-production.
 * Keeps the integration suite (~50 logins) and Playwright (which drives
 * localhost:3000) from tripping the limiters.
 */
export const skipLocalhostInDev = (req: Request): boolean =>
  isDevelopment && isLocalhost(req);

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Credential-stuffing guard on the login endpoints.
 *
 * skipSuccessfulRequests means a legitimate admin logging in repeatedly is
 * never locked out — only failures count toward the 10-per-window budget.
 */
export const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhostInDev,
  message: {
    error: 'Too many failed login attempts. Please try again in 15 minutes.',
    retryAfter: 15,
  },
  handler: (req, res) => {
    console.log(`🚫 Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many failed login attempts. Please try again in 15 minutes.',
      retryAfter: 15,
    });
  },
});

/** Public contact form: 3 submissions per 15 minutes in production, 10 in dev. */
export const contactFormLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: isDevelopment ? 10 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Always skip under test — the in-memory store accumulates across cases.
    if (process.env.NODE_ENV === 'test') return true;
    return skipLocalhostInDev(req);
  },
  message: {
    error: 'Too many contact form submissions. Please wait 15 minutes before submitting again.',
    retryAfter: 15,
  },
  handler: (req, res) => {
    console.log(`🚫 Contact form rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many contact form submissions. Please wait 15 minutes before submitting again.',
      retryAfter: 15,
    });
  },
});

/**
 * Consent proof log. A visitor makes a handful of decisions at most; 20 per
 * 15 minutes leaves room for toggling while stopping table flooding.
 * The handler deliberately does not log the IP: this endpoint exists to prove
 * consent without holding identifying data, and that includes its logs.
 */
export const consentLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') return true;
    return skipLocalhostInDev(req);
  },
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many consent submissions. Please try again later.' });
  },
});
