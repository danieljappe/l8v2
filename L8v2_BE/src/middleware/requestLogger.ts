import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log the incoming request
  console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  
  // Log request details if it's not a GET request
  if (req.method !== 'GET') {
    console.log(`📊 Request Body:`, req.body);
    console.log(`🔗 Request Params:`, req.params);
  }

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`${statusColor} ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}; 