import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "@repo/database";
import { config } from "../config";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
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
  trustedOrigins: [process.env.BETTER_AUTH_URL!].filter(Boolean),
});
