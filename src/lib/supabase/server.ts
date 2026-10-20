/**
 * SUPABASE CONNECTION, SERVER VERSION
 *
 * Same idea as client.ts, but for code that runs on our server (pages,
 * form handlers, API routes). It reads the user's login cookie so the
 * database knows who is asking, and therefore what they're allowed to see.
 *
 * Every page and action calls createClient() fresh for each request.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  // Tell Supabase how to read and write cookies in Next.js.
  // The login session is stored in these cookies.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component; the middleware refreshes sessions instead.
          }
        },
      },
    }
  );
}
