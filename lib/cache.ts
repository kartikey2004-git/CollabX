import { redis } from "./redis";
import logger from "./logger";

/*

A small Redis-backed read-through cache, used only for the public, requester-independent listing
queries (article.service.ts / tech-read.service.ts's `list()`) — see those files for why
`getBySlug`/`getById` deliberately do NOT use this (a shared cache key would risk serving a draft
to the wrong user).

A cache failure (Redis down, a malformed cached value, etc.) always falls back to calling `fn`
directly rather than throwing — this is a performance optimization, not a source of truth, so it
must never be able to turn a working read endpoint into a broken one.

*/

export async function getOrSetCache<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    logger.warn({ err, key }, "Cache read failed, falling back to source");
  }

  const value = await fn();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, "Cache write failed");
  }

  return value;
}

// Deletes every cached key under a prefix (e.g. "articles:list:") — used to invalidate a list
// cache immediately after a publish/delete, instead of waiting out the TTL. SCAN (not KEYS) so it
// never blocks Redis even if the keyspace under this prefix grows.
export async function invalidateCache(keyPrefix: string): Promise<void> {
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${keyPrefix}*`, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (err) {
    logger.warn({ err, keyPrefix }, "Cache invalidation failed");
  }
}
