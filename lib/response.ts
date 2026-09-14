import { NextResponse } from "next/server";

// Extra information sent alongside list responses, so the frontend knows how to fetch the next page.
export interface ListMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

// A shared helper so every successful API response has the same shape: { success: true, data, meta? }. Keeps responses consistent across all route handlers.

export function sendSuccess<T>(
  data: T,
  options?: { status?: number; meta?: ListMeta },
): NextResponse {
  // Default to HTTP 200 unless a different status (like 201 for "created") is passed in.
  return NextResponse.json(
    {
      success: true,
      data,
      ...(options?.meta ? { meta: options.meta } : {}), // Only include "meta" in the response if it was actually provided (e.g. for paginated lists).
    },
    { status: options?.status ?? 200 },
  );
}
