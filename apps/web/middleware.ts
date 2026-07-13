import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ONLY_ROUTES = ["/login", "/signup"];
const PROTECTED_ROUTES = ["/workspace"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Cookie-existence check only (no DB/signature validation) — fast,
  // optimistic redirect. Pages must still validate the session themselves.
  const sessionCookie = getSessionCookie(request);

  if (sessionCookie && AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  if (!sessionCookie && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
