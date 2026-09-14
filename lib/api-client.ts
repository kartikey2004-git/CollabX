// Specific validation problem returned by the API, e.g. which field failed and why.

export interface ApiErrorDetail {
  path: string;
  message: string;
}

// The JSON shape our API sends back whenever a request fails.

interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

// Thrown whenever an API call fails, so calling code can catch a single error type and read the status/code/details instead of parsing raw JSON.

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }
}

// Pagination info returned alongside list endpoints (see the pagination hooks).

export interface ListMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ListResult<T> {
  items: T[];
  meta: ListMeta;
}

// The shared function every API call goes through: builds the request, attaches cookies/JSON
// headers, and unwraps our API's { success, data } envelope. `path` (e.g. "/api/v1/articles") is
// requested as a same-origin relative URL — the API routes live in this same Next.js app now, so
// there's no separate base URL to point at.

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,

    // Send cookies (the auth session) along with every request.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json();

  // A non-2xx status or a { success: false } body both mean the request failed.
  if (!res.ok || !body.success) {
    throw new ApiError(res.status, body as ApiErrorBody);
  }

  // List endpoints include "meta" (pagination info) alongside the data.
  if (body.meta) {
    return { items: body.data, meta: body.meta } as T;
  }
  return body.data as T;
}

// A small wrapper exposing one function per HTTP method, so callers (the hooks in apps/web/hooks) don't need to think about fetch/headers/JSON at all.

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: "DELETE" }),
};