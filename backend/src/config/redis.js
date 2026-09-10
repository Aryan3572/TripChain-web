// backend/src/config/redis.js
import Redis from "ioredis";

function formatRedisUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  let url = rawUrl.trim();

  // If user pasted CLI command from Upstash (e.g. redis-cli --tls -u redis://...)
  if (url.includes("redis-cli")) {
    const isTls = url.includes("--tls");
    const match = url.match(/redis:\/\/[^\s]+/);
    if (match) {
      url = match[0];
      if (isTls && url.startsWith("redis://")) {
        url = url.replace("redis://", "rediss://");
      }
    }
  }

  // Upstash databases require TLS (rediss://)
  if (url.includes("upstash.io") && url.startsWith("redis://")) {
    url = url.replace("redis://", "rediss://");
  }

  return url;
}

const REDIS_URL = formatRedisUrl(process.env.REDIS_URL);

let redisClient = null;
let isRedisConnected = false;

// In-Memory Fallback Cache (for local development or if Redis is disconnected)
const memoryCache = new Map();

function cleanExpiredMemoryKeys() {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiresAt && item.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

// Periodically clean expired items from memory cache every 60 seconds
setInterval(cleanExpiredMemoryKeys, 60000).unref();

// Initialize Redis if URL is provided
if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("[Redis] Reconnect attempts exceeded. Falling back to in-memory cache.");
          return null; // Stop reconnecting after 3 attempts
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
      console.log("[Redis] 🚀 Successfully connected to Redis database!");
    });

    redisClient.on("ready", () => {
      isRedisConnected = true;
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      console.warn(`[Redis] Connection warning: ${err.message}. Using in-memory fallback cache.`);
    });

    redisClient.on("close", () => {
      isRedisConnected = false;
    });
  } catch (err) {
    console.warn(`[Redis] Initialization error: ${err.message}. Using in-memory fallback cache.`);
  }
} else {
  console.log("[Redis] ℹ️ REDIS_URL not configured in .env. Using fast in-memory cache for development.");
}

/**
 * Get cached item by key
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCache(key) {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (err) {
      console.warn(`[Redis Cache GET Error]: ${err.message}`);
    }
  }

  // Fallback: In-Memory Map Cache
  const item = memoryCache.get(key);
  if (!item) return null;

  if (item.expiresAt && item.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return item.value;
}

/**
 * Store item in cache with TTL in seconds
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds (default: 300s = 5 minutes)
 */
export async function setCache(key, value, ttlSeconds = 300) {
  if (isRedisConnected && redisClient) {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await redisClient.set(key, serialized, "EX", ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (err) {
      console.warn(`[Redis Cache SET Error]: ${err.message}`);
    }
  }

  // Fallback: In-Memory Map Cache
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
  memoryCache.set(key, { value, expiresAt });
  return true;
}

/**
 * Delete cached item by key
 * @param {string} key
 */
export async function deleteCache(key) {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn(`[Redis Cache DEL Error]: ${err.message}`);
    }
  }

  memoryCache.delete(key);
  return true;
}

/**
 * Invalidate multiple keys matching a pattern (e.g. "cache:dashboard:*")
 * @param {string} pattern
 */
export async function invalidateCachePattern(pattern) {
  // 1. Invalidate in Redis if connected
  if (isRedisConnected && redisClient) {
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      console.warn(`[Redis Cache SCAN/DEL Error]: ${err.message}`);
    }
  }

  // 2. Invalidate in In-Memory Map Cache
  const regexPattern = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  for (const key of memoryCache.keys()) {
    if (regexPattern.test(key)) {
      memoryCache.delete(key);
    }
  }

  return true;
}

/**
 * Convenience helper: Clear all cached entries for a specific user
 * (e.g. after adding, editing, or deleting a trip)
 * @param {number|string} userId
 */
export async function clearUserCache(userId) {
  if (!userId) return;
  await Promise.all([
    invalidateCachePattern(`cache:dashboard:*:${userId}`),
    invalidateCachePattern(`cache:ecoscore:${userId}`),
    invalidateCachePattern(`cache:trips:*:${userId}`),
  ]);
}

export default {
  getCache,
  setCache,
  deleteCache,
  invalidateCachePattern,
  clearUserCache,
};
