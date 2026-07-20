import { Response } from "express";

// Extra info sent alongside list responses, so the frontend knows how to fetch the next page.
export interface ListMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

// A shared helper so every successful API response has the same shape: { success: true, data, meta? }. Keeps responses consistent across all controllers.

export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: { status?: number; meta?: ListMeta },
): void {
  // Default to HTTP 200 unless a different status (like 201 for "created") is passed in.
  res.status(options?.status ?? 200).json({
    success: true,
    data,
    ...(options?.meta ? { meta: options.meta } : {}), // Only include "meta" in the response if it was actually provided (e.g. for paginated lists).
  });
}
