import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";

export const dynamic = "force-dynamic";

type SP = { q?: string; type?: string; open?: string; free?: string };

export default async function BrowsePage({ searchParams }: { searchParams: SP }) {
  const supabase = createClient();
  const q = (searchParams.q ?? "").replace(/[%,()*\\]/g, " ").trim();

  let query = supabase
    .from("posts")
    .select("*, host:profiles!host_id(full_name), post_times(id, post_id, starts_at)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`);
  if (searchParams.type && ["skill", "activity", "request"].includes(searchParams.type)) query = query.eq("kind", searchParams.type);
  if (searchParams.open === "1") query = query.eq("status", "open");
  if (searchParams.free === "1") query = query.eq("price_cents", 0);
  const { data } = await query;
  const posts = (data ?? []) as Post[];

  const href = (o: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { ...searchParams, ...o };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, String(v)));
    const s = p.toString();
    return `/browse${s ? "?" + s : ""}`;
  };
  const chip = (label: string, on: boolean, to: string) => (
    <Link key={label} href={to} className={on ? "chip-on" : "chip"}>{label}</Link>
  );

  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-8">
      <div className="text-teal font-bold text-sm tracking-wider">BROWSE</div>
      <h1 className="font-serif text-4xl md:text-5xl mt-1 mb-4">{q ? <>Results for &ldquo;{q}&rdquo;</> : "Everything open right now"}</h1>

      <form action="/browse" className="mb-4 flex gap-2 max-w-xl">
        <input name="q" defaultValue={q} placeholder="Search nails, hikes, photo shoots…" className="input !rounded-full" />
        {searchParams.type && <input type="hidden" name="type" value={searchParams.type} />}
        <button className="btn-navy">Search</button>
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {chip("All", !searchParams.type, href({ type: undefined }))}
        {chip("Skill practice", searchParams.type === "skill", href({ type: "skill" }))}
        {chip("Activities", searchParams.type === "activity", href({ type: "activity" }))}
        {chip("Requests", searchParams.type === "request", href({ type: "request" }))}
        {chip("Open spots only", searchParams.open === "1", href({ open: searchParams.open === "1" ? undefined : "1" }))}
        {chip("Free", searchParams.free === "1", href({ free: searchParams.free === "1" ? undefined : "1" }))}
      </div>

      <div className="text-sm text-muted mb-4">{posts.length} {posts.length === 1 ? "post" : "posts"} · newest first</div>
      {posts.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{posts.map((p, i) => <PostCard key={p.id} post={p} highlight={i === 0 && !!q} />)}</div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-muted mb-4">Nothing matches yet. Try a different search, or post what you are looking for.</p>
          <Link href="/new" className="btn-primary">New post</Link>
        </div>
      )}
      <div className="mt-8 bg-teal-light text-teal-dark rounded-2xl p-4 text-[15px]"><b>Tip:</b> Pick a public place for your first meetup.</div>
    </div>
  );
}
