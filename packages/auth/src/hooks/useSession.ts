"use client";

import { useEffect, useState } from "react";
import { authClient } from "../client";
import type { AuthSession, AuthUser } from "../types";

export interface UseSessionResult {
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const { data, error: sessionError } = await authClient.getSession();

        if (sessionError) {
          setError(new Error(sessionError.message || "Failed to load session"));
          setSession(null);
        } else if (data) {
          setSession(data);
        } else {
          setSession(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load session"));
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  return {
    session,
    user: session?.user || null,
    isLoading,
    isAuthenticated: !!session,
    error,
  };
}
