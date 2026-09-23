import { Request, Response, NextFunction } from 'express';

/**
 * One metadata line per request: method, path, status, duration.
 *
 * Deliberately logs nothing else. Request bodies previously logged here carried
 * plaintext passwords from both login endpoints and the full text of every
 * contact-form submission. req.path is used rather than req.url so query-string
 * values never reach the log either.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Captured now, not in the finish handler: Express rewrites req.url/req.path
  // to be router-relative while dispatching, and 'finish' fires after that, so
  // reading it late yields "/login" instead of "/api/auth/login". originalUrl
  // is never mutated; the query string is dropped so its values stay unlogged.
  const path = req.originalUrl.split('?')[0];
  const method = req.method;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusIcon = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';

    console.log(`${statusIcon} ${method} ${path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};
