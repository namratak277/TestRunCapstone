/**
 * SESSION REFRESH + LOGIN GUARD (called by src/middleware.ts on every request)
 *
 * Two jobs:
 *  1. Keep the user logged in. Login tokens expire, so this quietly
 *     refreshes them and saves the new cookie.
 *  2. Protect members-only pages. A logged-out visitor who opens one is
 *     sent to /login, with a "next" link back so they land where they meant to go.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages that require being logged in (plus any sub-page under them).
const PROTECTED = ["/new", "/messages", "/calendar", "/profile", "/rate"];

export async function updateSession(request: NextRequest) {
  // Start with "let the request continue as normal".
  let response = NextResponse.next({ request });

  // Connect to Supabase using the cookies on this request. If Supabase
  // refreshes the login, setAll() copies the new cookies onto the response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Ask Supabase who this is (null if nobody is logged in).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Does this page need a login? Either it's in the PROTECTED list, or it's
  // a post's join / confirmed / live page.
  const path = request.nextUrl.pathname;
  const needsAuth =
    PROTECTED.some((p) => path === p || path.startsWith(p + "/")) ||
    /^\/posts\/[^/]+\/(join|confirmed|live)/.test(path);

  // Logged out on a protected page: redirect to /login?next=<where they were going>.
  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return response;
}
