import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function GET(_req: Request, { params }: { params: { postId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Sign in first", { status: 401 });

  const { data: post } = await supabase.from("posts").select("id, title, location, description, duration_min, host_id, post_times(starts_at)").eq("id", params.postId).single();
  if (!post) return new NextResponse("Not found", { status: 404 });

  const { data: part } = await supabase.from("participants").select("time:post_times!time_id(starts_at)").eq("post_id", post.id).eq("user_id", user.id).maybeSingle();
  const isHost = post.host_id === user.id;
  if (!part && !isHost) return new NextResponse("Not found", { status: 404 });

  const startsAt: string | undefined = (part as any)?.time?.starts_at ?? (post.post_times as any[])?.map((t) => t.starts_at).sort()[0];
  if (!startsAt) return new NextResponse("No time set", { status: 404 });

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + post.duration_min * 60000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Test Run//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${post.id}-${user.id}@testrun.app`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc("Test Run: " + post.title)}`,
    `LOCATION:${esc(post.location)}`,
    `DESCRIPTION:${esc(post.description || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="test-run-${post.id.slice(0, 8)}.ics"`,
    },
  });
}
