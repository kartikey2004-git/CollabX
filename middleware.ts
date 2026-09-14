import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ONLY_ROUTES = ["/login", "/signup"];

// `/articles` and `/tech-reads` are deliberately NOT in this list — the backend now serves
// published content (list, detail, comments) to anonymous callers via `optionalAuth` (see
// apps/api/src/middleware/auth.middleware.ts), so gating these routes on a session cookie here
// would block a reading experience the API already supports. `/dashboard` (a contributor's own
// content) and `/admin` (moderation/user-management/indexing) still require a real session — both
// are meaningless without one.
const PROTECTED_ROUTES = ["/dashboard", "/admin"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Cookie-existence check only (no DB/signature validation) — fast,
  // optimistic redirect. Pages must still validate the session themselves.
  const sessionCookie = getSessionCookie(request);

  if (sessionCookie && AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/articles", request.url));
  }

  if (!sessionCookie && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
