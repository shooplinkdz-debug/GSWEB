import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redis = new Redis({
  host: redisHost,
  port: redisPort,
  lazyConnect: true,
  retryStrategy: () => null, // Don't infinite retry if Redis offline
});

redis.on('error', (_err) => {
  // Silent fallback when Redis is not available locally during testing
});

export async function getCache(key: string): Promise<string | null> {
  try {
    if (redis.status === 'ready') {
      return await redis.get(key);
    }
  } catch (e) {
    // Ignore cache error
  }
  return null;
}

export async function setCache(key: string, value: string, ttlSeconds = 300): Promise<void> {
  try {
    if (redis.status === 'ready') {
      await redis.set(key, value, 'EX', ttlSeconds);
    }
  } catch (e) {
    // Ignore cache error
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    if (redis.status === 'ready') {
      await redis.del(key);
    }
  } catch (e) {
    // Ignore cache error
  }
}

export async function clearCachePattern(pattern: string): Promise<void> {
  try {
    if (redis.status === 'ready') {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (e) {
    // Ignore cache error
  }
}

// Distributed Lock Mechanism using Redis SET NX EX
export async function acquireLock(lockKey: string, ttlSeconds = 10): Promise<boolean> {
  try {
    if (redis.status === 'ready') {
      const res = await redis.set(`lock:${lockKey}`, 'LOCKED', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    }
  } catch (e) {
    // Ignore lock error
  }
  return true; // Fallback: allow operation if Redis is offline
}

export async function releaseLock(lockKey: string): Promise<void> {
  try {
    if (redis.status === 'ready') {
      await redis.del(`lock:${lockKey}`);
    }
  } catch (e) {
    // Ignore lock error
  }
}

// In-memory fallback for rate limiting when Redis is offline
const memoryRateLimiterStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimiterMiddleware(maxRequests = 100, windowSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const routeKey = req.baseUrl || req.path || 'global';
    const rateLimitKey = `ratelimit:${ip}:${routeKey}`;

    try {
      if (redis.status === 'ready') {
        const requests = await redis.incr(rateLimitKey);
        if (requests === 1) {
          await redis.expire(rateLimitKey, windowSeconds);
        }

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requests));

        if (requests > maxRequests) {
          return res.status(429).json({
            error: 'Trop de requêtes, veuillez réessayer plus tard.',
          });
        }
        return next();
      }
    } catch (e) {
      // Fallback to memory store if Redis fails
    }

    // In-memory rate limiting fallback
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const record = memoryRateLimiterStore.get(rateLimitKey);

    if (!record || now > record.resetAt) {
      memoryRateLimiterStore.set(rateLimitKey, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));

    if (record.count > maxRequests) {
      return res.status(429).json({
        error: 'Trop de requêtes, veuillez réessayer plus tard.',
      });
    }

    return next();
  };
}

export default redis;
