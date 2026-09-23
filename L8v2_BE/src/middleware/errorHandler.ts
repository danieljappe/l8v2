import { Request, Response, NextFunction } from 'express';

/**
 * Logs what is needed to locate a failure — method, path, timestamp, message,
 * stack — and nothing that identifies or authenticates the caller. Request
 * headers previously logged here included the caller's Authorization bearer
 * token; the body and query string could include credentials and personal data.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // originalUrl rather than path: Express rewrites req.path to be
  // router-relative while dispatching. The query string is stripped so its
  // values are neither logged nor echoed back in the response.
  const path = req.originalUrl.split('?')[0];

  console.error('🚨 ERROR OCCURRED:');
  console.error('📍 Route:', req.method, path);
  console.error('📅 Timestamp:', new Date().toISOString());
  console.error('📝 Error Message:', err.message);
  console.error('🔍 Error Stack:', err.stack);
  console.error('─'.repeat(80));

  // Send appropriate error response
  const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    path,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      details: err.message
    })
  });
};
