import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dayParts, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Ev = { postId: string; title: string; location: string; starts_at: string; role: "joined" | "hosting" };

export default async function CalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: joined }, { data: hosted }] = await Promise.all([
    supabase.from("participants").select("post:posts!post_id(id, title, location), time:post_times!time_id(starts_at)").eq("user_id", user!.id),
    supabase.from("participants").select("post:posts!inner(id, title, location, host_id), time:post_times!time_id(starts_at)").eq("post.host_id", user!.id),
  ]);
  const events: Ev[] = [
    ...((joined ?? []) as any[]).filter((r) => r.post && r.time).map((r) => ({ postId: r.post.id, title: r.post.title, location: r.post.location, starts_at: r.time.starts_at, role: "joined" as const })),
    ...((hosted ?? []) as any[]).filter((r) => r.post && r.time).map((r) => ({ postId: r.post.id, title: r.post.title, location: r.post.location, starts_at: r.time.starts_at, role: "hosting" as const })),
  ].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now - 3600_000);
  const past = events.filter((e) => new Date(e.starts_at).getTime() < now - 3600_000).reverse();

  const Row = ({ e, past: isPast }: { e: Ev; past?: boolean }) => {
    const d = dayParts(e.starts_at);
    return (
      <div className={`bg-white border border-line border-l-[6px] ${e.role === "hosting" ? "border-l-navy" : "border-l-teal"} rounded-2xl p-4 mb-3 flex flex-wrap items-center gap-4`}>
        <div className="w-[52px] text-center bg-cream rounded-xl py-1.5"><div className="text-xs font-bold text-[#B0561A]">{d.dow}</div><div className="font-serif text-2xl leading-none">{d.day}</div></div>
        <div className="flex-1 min-w-[180px]"><div className="font-bold">{e.title}</div><div className="text-sm text-muted">{fmtDateTime(e.starts_at)} · {e.location} · {e.role === "hosting" ? "You are hosting" : "You joined"}</div></div>
        <div className="flex gap-3 text-sm font-bold">
          {isPast ? <Link href={`/rate/${e.postId}`}>Rate</Link> : <><Link href={`/messages/${e.postId}`}>Chat</Link><a href={`/api/ics/${e.postId}`}>.ics</a></>}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8">
      <h1 className="font-serif text-4xl md:text-5xl mb-6">Your calendar</h1>
      <div className="label tracking-widest mb-3">UPCOMING</div>
      {upcoming.length ? upcoming.map((e) => <Row key={e.postId + e.starts_at} e={e} />) : <div className="card text-center py-8 mb-6"><p className="text-muted mb-3">Nothing scheduled.</p><Link href="/browse" className="btn-primary">Find a test run</Link></div>}
      {past.length > 0 && (
        <>
          <div className="label tracking-widest mt-8 mb-3">PAST · LEAVE A RATING</div>
          {past.map((e) => <Row key={e.postId + e.starts_at} e={e} past />)}
        </>
      )}
      <p className="text-sm text-muted mt-8">Tap .ics on any event to add it to Apple, Google, or Outlook calendar. Direct Google Calendar sync is planned.</p>
    </div>
  );
}
