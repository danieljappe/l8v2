import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthRequest extends Request {
  user?: JwtUser;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'changeme';
      req.user = jwt.verify(token, secret) as JwtUser;
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
}; 