import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password"];
const AUTH_ROUTES = ["/verify-email", "/reset-password"];
const PROTECTED_ROUTES = ["/workspace"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;

  // Redirect authenticated users away from auth pages
  if (
    sessionToken &&
    (pathname.startsWith("/login") || pathname.startsWith("/signup"))
  ) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!sessionToken && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
