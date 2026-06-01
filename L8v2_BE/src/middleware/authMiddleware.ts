import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';

export interface JwtUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: JwtUser;
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'changeme';
      req.user = jwt.verify(token, secret) as JwtUser;
      // Make the authenticated user's ID available to DB-layer audit triggers
      // via the app.current_user_id session variable (read by log_change()).
      try {
        // Known limitation (Bug B): is_local=false means the value persists on the
        // pooled connection after the request ends. Under concurrent load a later
        // request that reuses this connection before authMiddleware overwrites it may
        // see the wrong userId in audit triggers. Full fix = request-scoped QueryRunner
        // threaded through all ~40 service/repo signatures.
        await AppDataSource.query(`SELECT set_config('app.current_user_id', $1, false)`, [req.user.id]);
      } catch { /* non-fatal — triggers will write userId as NULL */ }
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
}; 