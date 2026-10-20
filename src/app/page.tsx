import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { Track } from "@/components/Logo";
import { dayParts, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const POST_SELECT = "*, host:profiles!host_id(full_name), post_times(id, post_id, starts_at)";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await supabase.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).limit(8);

  let name = "";
  let upcoming: { id: string; title: string; starts_at: string }[] = [];
  if (user) {
    const [{ data: prof }, { data: mine }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase.from("participants").select("post:posts!post_id(id, title), time:post_times!time_id(starts_at)").eq("user_id", user.id),
    ]);
    name = prof?.full_name?.split(" ")[0] ?? "";
    upcoming = ((mine ?? []) as any[])
      .filter((m) => m.post && m.time && new Date(m.time.starts_at) > new Date())
      .map((m) => ({ id: m.post.id, title: m.post.title, starts_at: m.time.starts_at }))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .slice(0, 3);
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-6">
      <section className="flex flex-wrap items-center justify-between gap-6 pt-10 pb-6">
        <div className="flex-1 basis-[420px]">
          <div className="text-teal font-bold text-sm tracking-wider">{user ? `WELCOME BACK${name ? ", " + name.toUpperCase() : ""}` : "STARTING AT UNCG"}</div>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] mt-2">
            {user ? "What is your next test run?" : "Every skill starts with someone willing to sit still for you."}
          </h1>
          {!user && (
            <p className="text-lg text-muted mt-4 max-w-xl">
              Test Run connects people learning a hands-on skill with people who want a good deal, and connects friends-to-be around things worth doing together.
            </p>
          )}
          {!user && (
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/signup" className="btn-primary">Create your account</Link>
              <Link href="/browse" className="btn-outline">Browse posts</Link>
            </div>
          )}
        </div>
        <Track width={300} />
      </section>

      <section className="grid md:grid-cols-3 gap-5 py-6">
        <div className="bg-teal text-white rounded-[28px] p-7 flex flex-col">
          <div className="text-[13px] font-bold tracking-wider text-[#D7F0EC]">LANE 1 · OFFER A SERVICE</div>
          <div className="font-serif text-3xl leading-tight my-2">Practice your craft</div>
          <p className="text-[15px] text-[#E3F2EF] mb-5">Post a session with a low price, a place, and time options.</p>
          <Link href="/new?kind=skill" className="mt-auto self-start rounded-full bg-cream text-teal-dark font-bold px-5 py-2.5 no-underline">Post a service</Link>
        </div>
        <div className="bg-navy text-white rounded-[28px] p-7 flex flex-col">
          <div className="text-[13px] font-bold tracking-wider text-coral">LANE 2 · HOST OR JOIN A PLAN</div>
          <div className="font-serif text-3xl leading-tight my-2">Find your people</div>
          <p className="text-[15px] text-[#E3EDEB] mb-5">Say when and where, set how many can join.</p>
          <Link href="/new?kind=activity" className="mt-auto self-start rounded-full bg-coral text-navy font-bold px-5 py-2.5 no-underline">Post a plan</Link>
        </div>
        <div className="bg-coral text-navy rounded-[28px] p-7 flex flex-col">
          <div className="text-[13px] font-bold tracking-wider text-[#4A2A08]">LANE 3 · FIND A SERVICE</div>
          <div className="font-serif text-3xl leading-tight my-2">Skip the salon prices</div>
          <p className="text-[15px] text-[#3A2308] mb-5">Compare prices, ask first, book a time that fits.</p>
          <Link href="/browse?type=skill" className="mt-auto self-start rounded-full bg-navy text-white font-bold px-5 py-2.5 no-underline">Browse services</Link>
        </div>
      </section>

      <section className="flex flex-wrap gap-7 items-start py-6">
        <div className="flex-1 basis-[560px] min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-4xl">Open this week</h2>
            <Link href="/browse" className="font-bold no-underline">See all</Link>
          </div>
          {posts && posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {(posts as Post[]).map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          ) : (
            <div className="card text-center py-10">
              <p className="text-muted mb-4">No posts yet. Be the first to post a test run.</p>
              <Link href="/new" className="btn-primary">New post</Link>
            </div>
          )}
        </div>

        <aside className="flex-none basis-[340px] w-full md:w-[340px] space-y-5">
          <div className="card">
            <div className="label tracking-widest">YOUR UPCOMING</div>
            {user ? (
              upcoming.length ? upcoming.map((u) => {
                const d = dayParts(u.starts_at);
                return (
                  <Link key={u.id} href={`/posts/${u.id}/confirmed`} className="flex items-center gap-3.5 mb-3 no-underline text-navy">
                    <div className="w-[52px] text-center bg-cream rounded-xl py-1.5"><div className="text-xs font-bold text-[#B0561A]">{d.dow}</div><div className="font-serif text-2xl leading-none">{d.day}</div></div>
                    <div><div className="font-bold">{u.title}</div><div className="text-sm text-muted">{fmtTime(u.starts_at)}</div></div>
                  </Link>
                );
              }) : <p className="text-muted text-sm">Nothing yet. Join a post and it shows up here.</p>
            ) : <p className="text-muted text-sm"><Link href="/login">Log in</Link> to see your plans.</p>}
          </div>
          <div className="bg-navy text-white rounded-[22px] p-5">
            <div className="text-[13px] font-bold tracking-wider text-coral mb-2">SAFETY TIP</div>
            <p className="text-[15px] text-[#E3EDEB]">Pick a public place for your first meetup. You can report or block anyone from their post or chat.</p>
          </div>
        </aside>
      </section>

      <section className="py-8">
        <div className="bg-beige rounded-[28px] p-8">
          <h2 className="font-serif text-3xl mb-6">How a test run happens</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[["Post", "Say what, where, and when."], ["Connect", "People join or ask questions."], ["Chat", "Starters for your activity."], ["Meet", "Calendar, show up, rate."]].map(([t, s], i) => (
              <div key={t}><div className="mx-auto w-[46px] h-[46px] rounded-full bg-teal text-white font-bold flex items-center justify-center">{i + 1}</div><div className="font-bold mt-2">{t}</div><div className="text-sm text-muted">{s}</div></div>
            ))}
          </div>
        </div>
      </section>
      <footer className="py-8 text-sm text-muted border-t border-line">Test Run, a UNCG senior capstone project</footer>
    </div>
  );
}
