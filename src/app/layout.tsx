import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Test Run",
  description: "Find a real person to practice a skill on, or someone to do something with.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen pb-24 md:pb-0">
        <Header />
        <main>{children}</main>
        <TabBar />
      </body>
    </html>
  );
}
