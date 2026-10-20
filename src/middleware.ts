/**
 * MIDDLEWARE: the "front door" check that runs before every page loads.
 *
 * Next.js automatically runs this file on each request. It hands off to
 * updateSession(), which keeps the user's login fresh and sends logged-out
 * visitors to /login if they try to open a members-only page.
 */
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Which URLs this runs on: everything except static files (images, icons,
// Next.js build files). Those don't need a login check, so we skip them for speed.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
