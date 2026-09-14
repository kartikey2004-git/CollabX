// Reads all our environment variables once, with sensible fallback values, so the rest of the app can just import config instead of reading `process.env` everywhere.

export const config = {
  // Server configuration
  env: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",

  // OAuth providers
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",

  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",

  // Better Auth configuration
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || "",

  // Email service (Resend)
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",

  // This app's own public URL. There's no separate API URL anymore — frontend and API routes are
  // the same Next.js app (same origin), so this is the only "application URL" config left.
  nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Object storage (S3-compatible — MinIO locally via docker-compose.yml, Tigris
  // (https://www.tigrisdata.com) in production; see .env.example for both sets of values). Fully
  // config-driven — lib/object-storage.ts has no MinIO- or Tigris-specific code, just an S3Client
  // pointed at whichever endpoint/credentials these resolve to.

  s3Endpoint: process.env.S3_ENDPOINT || "http://localhost:9000", // MinIO/S3 API endpoint the SDK sends requests to

  s3Region: process.env.S3_REGION || "us-east-1", // required by the AWS SDK signing process even though MinIO ignores it

  // MinIO/S3 credentials — access key and secret key (both keys helps in authenticate your application to the object storage server.)

  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || "",

  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",

  s3Bucket: process.env.S3_BUCKET || "artifact-uploads", // bucket that artifact image uploads are written to

  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false", // tells the S3 client how to construct the URL when accessing a bucket like endpoint/bucket/key) addressing required by MinIO, real S3 accepts it too

  // https://my-bucket.s3.amazonaws.com/photo.png (AWS S3 expects this type of url)

  // http://localhost:9000/my-bucket/photo.png (MinIO expects this type of url)

  s3PublicUrl: process.env.S3_PUBLIC_URL || "http://localhost:9000/artifact-uploads", // s3PublicUrl is the base URL your app uses to generate file URLs that users can access.

  // Redis — backs the shared (multi-instance-safe) rate-limit store and the read cache. Background
  // indexing runs through Inngest events now, not through Redis.
  //
  // Two backends, picked by lib/redis.ts based on `isProduction` (never by which of these happen
  // to be set — local .env files commonly carry both at once for convenience):
  // - Local dev: plain TCP Redis (docker-compose.yml's `redis` service) via ioredis + REDIS_URL.
  // - Production: Upstash's REST API via @upstash/redis + these two — a serverless deployment
  //   can't hold a persistent TCP connection pool the way a long-running docker container can.
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || "",
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || "",

  // Optional. Powers the background indexing worker's real embedding calls (Gemini's
  // text-embedding-004, 768 dims). If unset, the worker uses a deterministic local-dev
  // placeholder instead — see lib/embeddings.ts.
  geminiApiKey: process.env.GEMINI_API_KEY || "",

  /*
  
  Normally, MinIO buckets are private.
  
  - To access a private file, you generate a signed URL 

  - If the bucket is public, anyone with the URL can access the file , so instead of generating signed URLs, you can simply return public urls 
  
  */
};

/*

MinIO is an S3(Simple Storage Service) - compatible object storage server.

  - Think of it as your own version of Amazon S3 that you can run anywhere on your laptop, a VPS, Kubernetes, or your own data center.

  - It is designed to store objects (files) rather than relational data.

What is object storage?

  - Instead of storing data in tables (PostgreSQL) or folders on a filesystem, object storage stores 
  
    - File (image, video, PDF, backup, etc.)
    - Metadata
    - A unique identifier

  - Everything is stored inside buckets.

Why not just use local storage?

- local storage works locally, but in production we have multiple servers , containers restart ,deployments delete files and scaling becomes difficult

- Object storage solves this.

---------------------------------------------

User
  │
  │ Upload Image
  ▼
Backend / API
  │
  │ PutObject()
  ▼
MinIO Server
  │
  ▼
Bucket: user-files
  ├── avatar.png
  ├── resume.pdf
  └── video.mp4
  │
  │ Public URL
  ▼
User

- Backend uploads files to MinIO instead of saving them on disk.

-----------------------------------------

1. S3 Compatible : This is MinIO's biggest advantage.

  - If your code works with MinIO, it almost always works with Amazon S3.

  - Later, changing to AWS S3 may only require updating configuration.


2. Run locally : Instead of paying AWS while developing. No cloud account required.

3. Very fast : MinIO is written in Go and is optimized for high throughput (means number of requests a system can process within a specific unit of time)

  - We can use it for backups , logs , media storage
  
  - We can get a web UI to manage buckets and files.

*/

/*

  - Checks if OAuth providers have valid credentials before registering them, preventing runtime errors caused by empty client IDs or secrets.

  - True only if BOTH the client id and secret for Google and GitHub are actually set.

*/

export const isGoogleConfigured = Boolean(config.googleClientId && config.googleClientSecret);

export const isGithubConfigured = Boolean(config.githubClientId && config.githubClientSecret);

export const isProduction = config.env === "production";

/*

  - Fail fast on missing critical secrets instead of silently booting with an empty secret which makes every session token forgeable.

  - If the auth secret is missing: crash immediately in production (safer), but just warn in development so local setup isn't blocked.

*/

if (!config.betterAuthSecret) {
  const message = "BETTER_AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`.";
  if (isProduction) {
    throw new Error(message);
  } else {
    console.warn(`[config] ${message}`);
  }
}

/*

  - The MinIO-shaped defaults above (S3_ENDPOINT=http://localhost:9000, S3_PUBLIC_URL=..., empty
    credentials) exist purely so local dev works with zero .env setup. They must never be allowed
    to silently apply in production — a production process booting against a MinIO endpoint or
    with blank credentials would upload objects and fail (or worse, upload somewhere unintended)
    instead of crashing loudly at startup.

*/

if (isProduction) {
  // Checked against raw process.env, not `config` above — every one of these fields has a
  // MinIO-shaped fallback, so reading config.s3Bucket etc. here would always see a non-empty
  // value and this check could never fire.
  const requiredS3Vars = [
    "S3_ENDPOINT",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET",
    "S3_PUBLIC_URL",
  ];
  const missing = requiredS3Vars.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required object storage environment variable(s) in production: ${missing.join(", ")}`,
    );
  }

  // Same reasoning as the S3 check above: REDIS_URL always has a `redis://localhost:6379`
  // fallback, so a production process with no Upstash credentials would otherwise boot fine and
  // then try (and fail, or worse succeed against a stray local Redis) to reach localhost instead
  // of failing loudly at startup — see lib/redis.ts for which client each environment actually uses.
  const requiredRedisVars = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
  const missingRedisVars = requiredRedisVars.filter((name) => !process.env[name]);

  if (missingRedisVars.length > 0) {
    throw new Error(
      `Missing required Upstash Redis environment variable(s) in production: ${missingRedisVars.join(", ")}`,
    );
  }
}
