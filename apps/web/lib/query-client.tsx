"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query";

// Sets up React Query for the app which creates one shared cache/client and makes it available to every component below it via context.

export function QueryProvider({ children }: { children: React.ReactNode }) {

  // useState (not a plain variable) ensures the QueryClient is created once per component instance and survives re-renders, instead of being rebuilt every render.

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // Data is considered "fresh" for 30 seconds, so we don't refetch too eagerly.

            retry: 1, // Only retry a failed query once before giving up.
          },
        },
      }),
  );

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
}
