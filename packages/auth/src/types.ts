export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    token: string;
    userId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
  redirectURL?: string;
}

export interface ResetPasswordPayload {
  newPassword: string;
  token: string;
}

export interface VerifyEmailPayload {
  code: string;
}

export interface AuthError {
  code: string;
  message: string;
}
