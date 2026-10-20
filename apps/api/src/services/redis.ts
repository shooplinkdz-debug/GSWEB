import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redis = new Redis({
  host: redisHost,
  port: redisPort,
  lazyConnect: true,
  retryStrategy: () => null, // Don't infinite retry if Redis offline
});

redis.on('error', (err) => {
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

export default redis;
