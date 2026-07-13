import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "@repo/database";
import {
  config,
  isGithubConfigured,
  isGoogleConfigured,
  isProduction,
} from "../config";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

// Register only providers that actually have credentials. Passing empty
// client id/secret registers a broken provider that errors on use.
const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};

if (isGoogleConfigured) {
  socialProviders.google = {
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
  };
}
if (isGithubConfigured) {
  socialProviders.github = {
    clientId: config.githubClientId,
    clientSecret: config.githubClientSecret,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  appName: "CollabX",
  baseURL: config.nextPublicApiUrl,
  basePath: "/api/auth",
  secret: config.betterAuthSecret,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Fire-and-forget: avoids leaking account existence via response timing.
      void sendPasswordResetEmail({
        email: user.email,
        resetUrl: url,
      });
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        verificationUrl: url,
      });
    },
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60, // Session expires after 7 days
    updateAge: 24 * 60 * 60, // Session update after one day
  },
  account: {
    accountLinking: {
      enabled: true,
      // OAuth providers verify email ownership themselves, so a Google/GitHub
      // sign-in can link to an existing email/password account on sight.
      trustedProviders: ["google", "github"],
    },
  },
  socialProviders,
  trustedOrigins: [config.nextPublicAppUrl],
  rateLimit: {
    enabled: true,
  },
  advanced: {
    useSecureCookies: isProduction,
  },
});

export type Session = typeof auth.$Infer.Session;
