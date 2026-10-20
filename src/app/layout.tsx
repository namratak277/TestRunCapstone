/**
 * ROOT LAYOUT: the frame around every page.
 *
 * Next.js wraps every page in this component. It loads the fonts and global
 * styles, and puts the top Header (desktop) and bottom TabBar (phone) around
 * whatever page the user is on, which goes in {children}.
 */
import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

// Brand fonts from Google Fonts: a serif for headings, a sans-serif for body text.
const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

// The browser-tab title and the description search engines show.
export const metadata: Metadata = {
  title: "Test Run",
  description: "Find a real person to practice a skill on, or someone to do something with.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      {/* Bottom padding on phones keeps content from hiding behind the fixed tab bar. */}
      <body className="min-h-screen pb-24 md:pb-0">
        <Header />
        <main>{children}</main>
        <TabBar />
      </body>
    </html>
  );
}
