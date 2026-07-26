import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "@repo/database";
import { config, isGithubConfigured, isGoogleConfigured, isProduction } from "../config";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

// We only turn on Google/GitHub login if their API keys are actually set because an empty clientId/secret would register a broken login option that errors when clicked.

const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};

// If Google credentials exist in the config, add Google as a login option.
if (isGoogleConfigured) {
  socialProviders.google = {
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
  };
}

// If GitHub credentials exist in the config, add GitHub as a login option.
if (isGithubConfigured) {
  socialProviders.github = {
    clientId: config.githubClientId,
    clientSecret: config.githubClientSecret,
  };
}

// auth object that handles login, signup, sessions, etc for the whole app, using the better-auth library.

export const auth = betterAuth({
  // Tells better-auth to store its data (users, sessions) in our Postgres database.
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  appName: "CollabX", // Name of the app
  baseURL: config.nextPublicApiUrl, // Base URL for the API
  basePath: "/api/auth", // Base path for the auth routes
  secret: config.betterAuthSecret, // Secret for signing cookies and tokens

  // Settings for normal email + password login.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8, // Minimum password length
    requireEmailVerification: true, // Require email verification

    // Runs when a user asks to reset their password; sends them a reset link by email.
    sendResetPassword: async ({ user, url }) => {
      // We don't "await" this on purpose, so the response time is the same whether the email exists or not, this stops attackers guessing valid emails(timing attacks).

      void sendPasswordResetEmail({
        email: user.email,
        resetUrl: url,
      });
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    revokeSessionsOnPasswordReset: true, // Revoke all the session on password reset
  },

  // Settings for verifying a user's email address after signup.
  emailVerification: {
    sendOnSignUp: true, // Send verification email on signup
    autoSignInAfterVerification: true, // Auto sign in after verification

    // Runs right after signup; sends the user a "verify your email" link.
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        verificationUrl: url,
      });
    },
  },

  // Settings for how long a login session lasts before it expires.
  session: {
    expiresIn: 7 * 24 * 60 * 60, // Session expires after 7 days
    updateAge: 24 * 60 * 60, // Session update after one day
  },

  // Settings for linking multiple login methods (e.g. Google + password) to one account.
  account: {
    accountLinking: {
      enabled: true, // Enable account linking
      trustedProviders: ["google", "github"], // Google and GitHub already confirm the user owns that email, so we trust them enough to auto-link to a matching email/password account.
    },
  },

  socialProviders, // Plug in whichever social logins (Google/GitHub) were configured above.

  trustedOrigins: [config.nextPublicAppUrl], // Only allow auth requests coming from our own frontend app's URL.

  rateLimit: {
    enabled: true, // Turns on rate limiting to slow down brute-force login attempts.
  },
  advanced: {
    useSecureCookies: isProduction, // Only send cookies over HTTPS when running in production.
  },
});

// A reusable TypeScript type representing a logged-in user's session data.
export type Session = typeof auth.$Infer.Session;
