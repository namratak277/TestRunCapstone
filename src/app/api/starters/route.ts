/**
 * API ROUTE: GET /api/starters?title=...&category=...&kind=...
 *
 * Returns conversation starters as JSON: { "starters": ["...", "...", "..."] }.
 * The live chat (ChatThread) calls this from the browser. It runs on the
 * server so the secret AI key never reaches the user's browser.
 */
import { NextResponse } from "next/server";
import { getStarters } from "@/lib/starters";
import type { Kind } from "@/lib/types";

export async function GET(req: Request) {
  const u = new URL(req.url);
  // Read the inputs from the URL, defaulting to "activity" and capping lengths
  // so nobody can send huge text to the AI.
  const kind = (["skill", "activity", "request"].includes(u.searchParams.get("kind") ?? "") ? u.searchParams.get("kind") : "activity") as Kind;
  const starters = await getStarters({
    title: (u.searchParams.get("title") ?? "").slice(0, 120),
    category: (u.searchParams.get("category") ?? "").slice(0, 60),
    kind,
  });
  return NextResponse.json({ starters });
}
