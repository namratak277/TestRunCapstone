"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Icon = ({ d, c }: { d: React.ReactNode; c: string }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export function TabBar() {
  const path = usePathname();
  const tabs = [
    { label: "Home", href: "/", match: (p: string) => p === "/", d: <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
    { label: "Browse", href: "/browse", match: (p: string) => p.startsWith("/browse") || p.startsWith("/posts"), d: <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></> },
    { label: "Post", href: "/new", match: () => false, d: null },
    { label: "Chats", href: "/messages", match: (p: string) => p.startsWith("/messages"), d: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z" /> },
    { label: "You", href: "/profile", match: (p: string) => p.startsWith("/profile") || p.startsWith("/calendar"), d: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></> },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-[76px] bg-white border-t border-line flex items-start justify-around pt-2 z-20">
      {tabs.map((t) => {
        if (t.label === "Post")
          return (
            <Link key={t.href} href={t.href} aria-label="New post" className="w-16 text-center no-underline">
              <div className="mx-auto -mt-0.5 w-[52px] h-[52px] rounded-full bg-coral flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#264653" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </div>
            </Link>
          );
        const on = t.match(path);
        const c = on ? "#1E7A6E" : "#3D565F";
        return (
          <Link key={t.href} href={t.href} className="w-16 flex flex-col items-center no-underline" style={{ color: c }}>
            <Icon d={t.d} c={c} />
            <span className={`text-xs ${on ? "font-bold" : "font-medium"}`}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
