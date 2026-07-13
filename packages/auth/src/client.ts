import { createAuthClient } from "better-auth/react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const basePath = "/api/auth";

export const authClient = createAuthClient({
  baseURL: apiUrl,
  basePath,
  logoutRedirect: "/login",
});

export const { useSession, signIn, signUp, signOut } = authClient;

export type AuthClientType = typeof authClient;
