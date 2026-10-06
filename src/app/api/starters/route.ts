import { NextResponse } from "next/server";
import { getStarters } from "@/lib/starters";
import type { Kind } from "@/lib/types";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const kind = (["skill", "activity", "request"].includes(u.searchParams.get("kind") ?? "") ? u.searchParams.get("kind") : "activity") as Kind;
  const starters = await getStarters({
    title: (u.searchParams.get("title") ?? "").slice(0, 120),
    category: (u.searchParams.get("category") ?? "").slice(0, 60),
    kind,
  });
  return NextResponse.json({ starters });
}
