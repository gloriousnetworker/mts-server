import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redis: Redis | null = null;

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis max retries reached — running without Redis');
        return null; // stop retrying
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (err: Error & { code?: string }) => {
    if (err.code !== 'ENOTFOUND' && err.code !== 'ECONNREFUSED') {
      logger.error(err, 'Redis error');
    }
  });

  // Attempt connection but don't block startup
  redis.connect().catch(() => {
    logger.warn('Redis unavailable — server running without cache');
    redis = null;
  });
} catch {
  logger.warn('Redis init failed — server running without cache');
  redis = null;
}

export { redis };
