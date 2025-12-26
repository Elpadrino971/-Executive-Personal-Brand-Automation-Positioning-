import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    tier: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      tier: decoded.tier,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...allowedTiers: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedTiers.includes(req.user.tier)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredTier: allowedTiers,
        currentTier: req.user.tier,
      });
    }

    next();
  };
};

export const generateToken = (user: { id: number; email: string; tier: string }): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tier: user.tier,
    },
    process.env.JWT_SECRET || '',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};
