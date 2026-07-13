export { authClient, useSession, signIn, signUp, signOut } from "./client";
export { useSession as useAuthSession } from "./hooks/useSession";
export type { UseSessionResult } from "./hooks/useSession";
export type {
  AuthUser,
  AuthSession,
  SignUpCredentials,
  SignInCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
  AuthError,
} from "./types";
