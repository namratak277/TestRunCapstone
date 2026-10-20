/**
 * SUPABASE CONNECTION, BROWSER VERSION
 *
 * Supabase is our database plus login service. This creates a connection to it
 * that runs inside the user's browser. Only used by interactive components
 * (like the live chat) that talk to the database directly from the page.
 *
 * It uses the public "anon" key, which is safe to expose because the
 * database's security rules (in supabase/schema.sql) decide what each user may see.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
