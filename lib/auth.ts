import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "./db";
import { config, isGithubConfigured, isGoogleConfigured, isProduction } from "./config";
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
  // Frontend and API are the same Next.js app now (same origin), so there's no separate API URL
  // to point at anymore — baseURL is just this app's own public URL.
  baseURL: config.nextPublicAppUrl,
  basePath: "/api/auth", // Base path for the auth routes
  secret: config.betterAuthSecret, // Secret for signing cookies and tokens

  /*

  Platform-wide RBAC (Role: ADMIN | CONTRIBUTOR | READER) needs `req.user.role` populated on every
  session lookup. better-auth doesn't expose arbitrary Prisma columns on `user` by default — only
  its own core fields (id/name/email/...) — so without this block, `auth.api.getSession()` would
  silently omit `role` even though the column already exists on the `User` model, exactly like the
  OLD schema's dead, never-read `User.role: String` column (see 000-project-analysis.md).

  `additionalFields` maps this extra column onto the session's `user` object, reading its live
  value from the database (via the Prisma adapter above) on every `getSession()` call — not from a
  cached/signed cookie payload — so a role change (e.g. an admin promoting a CONTRIBUTOR) takes
  effect on the very next request, no re-login required.

  `input: false` is the mandatory security-critical part: it removes `role` from every
  client-writable input schema (sign-up, update-user, etc.), so a user can never set their own
  `role` through a mass-assigned request body and self-escalate to ADMIN. The only way `role` ever
  changes is a direct, server-side `db.user.update(...)` call (e.g. a future admin-only "manage
  users" endpoint) — no such endpoint exists yet, so today every user's role is whatever
  `defaultValue`/the DB default (`READER`) leaves it at, until a database operator changes it
  directly.

  */

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "READER",
        input: false, // Never settable by the client — see comment above.
      },
    },
  },

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
