import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoMark } from "./Logo";

const links = [
  ["Home", "/"],
  ["Browse", "/browse"],
  ["Messages", "/messages"],
  ["Calendar", "/calendar"],
] as const;

export async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <header className="bg-white border-b border-line">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-3 flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2.5 no-underline text-navy">
          <LogoMark />
          <span className="font-serif text-2xl">Test Run</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 font-medium">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-navy no-underline hover:text-teal py-1">{label}</Link>
          ))}
        </nav>
        <form action="/browse" className="hidden md:flex flex-1 items-center">
          <input name="q" placeholder="Search nails, hikes, photo shoots…" className="w-full bg-cream border border-line rounded-full px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal" />
        </form>
        <div className="ml-auto md:ml-0 flex items-center gap-3">
          {user ? (
            <>
              <Link href="/new" className="btn-primary !py-2.5 !px-5 hidden md:inline-flex">New post</Link>
              <Link href="/profile" aria-label="Your profile" className="w-10 h-10 rounded-full bg-coral flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#264653" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="font-bold text-navy no-underline">Log in</Link>
              <Link href="/signup" className="btn-primary !py-2.5 !px-5">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
