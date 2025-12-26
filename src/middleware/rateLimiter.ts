import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

export const rateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : `rate-limit:${req.ip}`;

    try {
      const client = await redisClient.connect();
      const current = await client.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= options.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: options.windowMs / 1000,
        });
      }

      await client.set(key, count + 1, {
        EX: Math.floor(options.windowMs / 1000),
      });

      next();
    } catch (error) {
      // If Redis fails, allow the request
      next();
    }
  };
};
