import { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { UnauthenticatedError } from "../lib/errors";

// A middleware that runs before protected routes to make sure the request comes from a logged-in user. If not, it blocks the request with an error.

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // Ask better-auth to look at the request's cookies/headers and find an active session.
    const result = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    // No session found means the user isn't logged in.
    if (!result) {
      throw new UnauthenticatedError();
    }

    // if session is found, attach the logged-in user and session to the request so later code can use them.
    req.user = result.user;
    req.session = result.session;
    next();
  } catch (err) {
    // Pass the error along to the error-handling middleware.
    next(err instanceof Error ? err : new UnauthenticatedError());
  }
}
