import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "@repo/database";
import { config } from "../config";

const FRONTEND_URL = config.nextPublicAppUrl;

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  appName: "CollabX",
  baseURL: config.betterAuthUrl,
  basePath: "/api/auth",
  secret: config.betterAuthSecret,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  socialProviders: {
    google: {
      clientId: config.googleClientId!,
      clientSecret: config.googleClientSecret!,
    },
    github: {
      clientId: config.githubClientId!,
      clientSecret: config.githubClientSecret!,
    },
  },
  trustedOrigins: [FRONTEND_URL],
});

export type Session = typeof auth.$Infer.Session;
