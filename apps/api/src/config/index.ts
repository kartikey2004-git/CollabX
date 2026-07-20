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
};

// Whether OAuth providers have real credentials configured. Used to avoid
// registering a provider with empty client id/secret (which throws at runtime).
export const isGoogleConfigured = Boolean(
  config.googleClientId && config.googleClientSecret,
);
export const isGithubConfigured = Boolean(
  config.githubClientId && config.githubClientSecret,
);

export const isProduction = config.env === "production";

// Fail fast on missing critical secrets instead of silently booting with an
// empty secret (which makes every session token forgeable).
if (!config.betterAuthSecret) {
  const message =
    "BETTER_AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`.";
  if (isProduction) {
    throw new Error(message);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[config] ${message}`);
  }
}
