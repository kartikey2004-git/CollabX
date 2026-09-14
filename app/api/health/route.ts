import { NextResponse } from "next/server";

// GET /api/health — a simple endpoint to check that the server is running (no auth needed).
// Deliberately cheap: no DB/Redis/S3 checks, so it's safe as a platform liveness probe.
export function GET() {
  return NextResponse.json({ message: "Hello World!", success: true, status: 200 });
}
