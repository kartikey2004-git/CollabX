/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      config.ignoreWarnings = [
        { module: /node_modules\/jose\/dist\/webapi\/lib\/deflate\.js/ },
      ];
    }
    // No more webpack alias for @repo/database — lib/db.ts is local source now, resolved by the
    // "@/*" path alias in tsconfig.json like every other lib/ import, not a separate built package.
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-pg",
      "pg",
      // pino-pretty's dev-mode transport spawns a real OS worker_thread that loads a file by
      // filesystem path (via `thread-stream`) — webpack-bundling pino/pino-pretty breaks that path
      // resolution ("Cannot find module '...vendor-chunks/lib/worker.js'"), a well-known Next.js +
      // pino incompatibility. Marking them external skips webpack for these packages entirely, so
      // Node's native `require` resolves the real on-disk worker file instead.
      "pino",
      "pino-pretty",
    ],
  },
};

export default nextConfig;
