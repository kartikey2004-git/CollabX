import IoRedis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import { config, isProduction } from "./config";

// The exact subset of Redis commands cache.ts and rate-limit.ts actually call, in ioredis's own
// calling convention (positional "EX"/"MATCH"/"COUNT" flags) — kept identical to ioredis's shape
// so neither of those two files has to know or care which backend is live underneath.
/* eslint-disable no-unused-vars -- named for readability; this is a type position, not a real binding */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, flag: "EX", seconds: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  scan(cursor: string, matchFlag: "MATCH", pattern: string, countFlag: "COUNT", count: number): Promise<[string, string[]]>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}
/* eslint-enable no-unused-vars */

// Wraps @upstash/redis's REST client (options-object API) behind the same ioredis-shaped
// interface above, so it's a drop-in for the local ioredis client. `automaticDeserialization:
// false` is required, not cosmetic — @upstash/redis's `get()` otherwise tries to JSON-parse the
// stored value itself, which would double-parse (and throw on) what cache.ts stores via
// `JSON.stringify` and reads back via its own `JSON.parse`.
class UpstashRedisAdapter implements RedisClient {
  private client: UpstashRedis;

  constructor(url: string, token: string) {
    this.client = new UpstashRedis({ url, token, automaticDeserialization: false });
  }

  get(key: string): Promise<string | null> {
    return this.client.get<string>(key);
  }

  set(key: string, value: string, _flag: "EX", seconds: number): Promise<unknown> {
    return this.client.set(key, value, { ex: seconds });
  }

  del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  async scan(cursor: string, _matchFlag: "MATCH", pattern: string, _countFlag: "COUNT", count: number): Promise<[string, string[]]> {
    const [nextCursor, keys] = await this.client.scan(cursor, { match: pattern, count });
    return [String(nextCursor), keys];
  }

  incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }
}

// One shared Redis connection, reused by two consumers: the rate-limit store (rate-limit.ts) and
// the read cache (cache.ts). Background indexing no longer goes through Redis at all — it's
// Inngest events now (lib/inngest/), not a Redis-backed BullMQ queue.
//
// Backend is picked by environment, not by which env vars happen to be present — a local .env
// commonly carries both REDIS_URL (for docker-compose's local `redis` service) and Upstash's REST
// credentials (copy-pasted ahead of a deploy) at the same time, so presence alone can't be the
// switch. See lib/config.ts's production check: this throws at boot in production if the Upstash
// vars are missing, rather than silently falling back to a `redis://localhost:6379` that doesn't
// exist there.
export const redis: RedisClient = isProduction
  ? new UpstashRedisAdapter(config.upstashRedisRestUrl, config.upstashRedisRestToken)
  : (new IoRedis(config.redisUrl) as unknown as RedisClient);
