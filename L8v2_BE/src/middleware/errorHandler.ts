import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Enhanced error logging
  console.error('🚨 ERROR OCCURRED:');
  console.error('📍 URL:', req.method, req.url);
  console.error('📅 Timestamp:', new Date().toISOString());
  console.error('👤 User Agent:', req.get('User-Agent'));
  console.error('📝 Error Message:', err.message);
  console.error('🔍 Error Stack:', err.stack);
  console.error('📊 Request Body:', req.body);
  console.error('🔗 Request Params:', req.params);
  console.error('❓ Request Query:', req.query);
  console.error('📋 Request Headers:', req.headers);
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
    path: req.url,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      details: err.message
    })
  });
}; 