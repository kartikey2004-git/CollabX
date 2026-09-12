import Redis from "ioredis";
import { config } from "../config";

// One shared Redis connection, reused by three consumers: the rate-limit store
// (rate-limit.middleware.ts), the read cache (cache.ts), and the BullMQ job queue/worker
// (queues/indexing.queue.ts, workers/indexing.worker.ts).
//
// `maxRetriesPerRequest: null` is required by BullMQ (it manages its own retry/blocking
// semantics for queue commands) and is harmless for the rate-limiter/cache's plain GET/SET/DEL
// usage, so one client configuration serves all three instead of maintaining separate ones.
export const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
