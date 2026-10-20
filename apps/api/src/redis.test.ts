import express from 'express';
import request from 'supertest';
import redis, {
  getCache,
  setCache,
  deleteCache,
  clearCachePattern,
  acquireLock,
  releaseLock,
  rateLimiterMiddleware,
} from './services/redis';

describe('Mission 07: Redis Cache, Rate Limiting & Distributed Locking Tests', () => {
  afterAll(async () => {
    try {
      await redis.quit();
    } catch (e) {
      // Ignore disconnect errors
    }
  });

  test('Redis service exports should be properly defined functions and objects', () => {
    expect(redis).toBeDefined();
    expect(typeof getCache).toBe('function');
    expect(typeof setCache).toBe('function');
    expect(typeof deleteCache).toBe('function');
    expect(typeof clearCachePattern).toBe('function');
    expect(typeof acquireLock).toBe('function');
    expect(typeof releaseLock).toBe('function');
    expect(typeof rateLimiterMiddleware).toBe('function');
  });

  test('Cache operations should execute without unhandled errors (offline fallback resilience)', async () => {
    await expect(setCache('test:key', 'value', 60)).resolves.not.toThrow();
    const val = await getCache('test:key');
    expect(val === null || typeof val === 'string').toBe(true);

    await expect(deleteCache('test:key')).resolves.not.toThrow();
    await expect(clearCachePattern('test:*')).resolves.not.toThrow();
  });

  test('Distributed lock functions acquireLock and releaseLock should execute without throwing', async () => {
    const lockAcquired = await acquireLock('test_resource', 10);
    expect(typeof lockAcquired).toBe('boolean');
    await expect(releaseLock('test_resource')).resolves.not.toThrow();
  });

  test('rateLimiterMiddleware should set rate-limit headers and enforce rate limiting', async () => {
    const testApp = express();
    const limit = 3;
    testApp.use(rateLimiterMiddleware(limit, 60));
    testApp.get('/test-rate-limit', (_req, res) => {
      res.json({ success: true });
    });

    for (let i = 0; i < limit; i++) {
      const res = await request(testApp).get('/test-rate-limit');
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('x-ratelimit-limit');
      expect(res.headers).toHaveProperty('x-ratelimit-remaining');
    }

    // Exceeding request limit should trigger 429 Too Many Requests
    const resBlocked = await request(testApp).get('/test-rate-limit');
    expect(resBlocked.status).toBe(429);
    expect(resBlocked.body).toHaveProperty('error');
    expect(resBlocked.body.error).toContain('Trop de requêtes');
  });
});
