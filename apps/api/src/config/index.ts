// Reads all our environment variables once, with sensible fallback values, so the rest of the app can just import config instead of reading `process.env` everywhere.

export const config = {
  // Server configuration
  port: process.env.PORT || 4000,
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

  // Application URLs
  nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", // Backend/API base URL

  nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // Frontend application URL

  // Object storage (S3-compatible — MinIO locally, a real bucket in production)

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
