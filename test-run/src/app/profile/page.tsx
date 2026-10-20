import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { signOut } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sel = "*, host:profiles!host_id(full_name), post_times(id, post_id, starts_at)";
  const [{ data: prof }, { data: mine }, { data: joined }, { data: ratings }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase.from("posts").select(sel).eq("host_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("participants").select(`post:posts!post_id(${sel})`).eq("user_id", user!.id),
    supabase.from("ratings").select("stars, showed_up, comment, tags, created_at, rater:profiles!rater_id(full_name)").eq("ratee_id", user!.id).order("created_at", { ascending: false }),
  ]);
  const joinedPosts = ((joined ?? []) as any[]).map((j) => j.post).filter(Boolean) as Post[];
  const rated = (ratings ?? []).filter((r: any) => r.stars);
  const avg = rated.length ? (rated.reduce((s: number, r: any) => s + r.stars, 0) / rated.length).toFixed(1) : "—";
  const noShows = (ratings ?? []).filter((r: any) => r.showed_up === false).length;

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-wrap items-center gap-6 mb-6">
        <div className="w-24 h-24 rounded-full bg-coral flex items-center justify-center flex-none"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#264653" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg></div>
        <div className="flex-1 min-w-[220px]">
          <h1 className="font-serif text-4xl md:text-5xl">{prof?.full_name || "Your profile"}</h1>
          <div className="text-muted">{user!.email}</div>
          <span className="inline-block mt-2 rounded-full px-3 py-1 text-[13px] font-bold bg-teal-light text-teal-dark">{user!.email_confirmed_at ? "Email verified" : "Email not verified"}</span>
        </div>
        <form action={signOut}><button className="btn-outline">Log out</button></form>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[[String(joinedPosts.length + (mine?.length ?? 0)), "Test runs"], [avg, `Rating (${rated.length})`], [String(noShows), "No-shows"]].map(([a, b]) => (
          <div key={b} className="card !p-4"><div className="font-serif text-3xl leading-none">{a}</div><div className="text-sm text-muted mt-1">{b}</div></div>
        ))}
      </div>

      <h2 className="font-serif text-3xl mb-4">My posts</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {(mine as Post[] | null)?.map((p) => <PostCard key={p.id} post={p} />)}
        <Link href="/new" className="border-2 border-dashed border-[#8FA3A8] rounded-[22px] flex items-center justify-center min-h-[140px] font-bold text-muted no-underline">+ New post</Link>
      </div>

      {joinedPosts.length > 0 && (<><h2 className="font-serif text-3xl mb-4">Joined</h2><div className="grid sm:grid-cols-2 gap-4 mb-8">{joinedPosts.map((p) => <PostCard key={p.id} post={p} />)}</div></>)}

      <h2 className="font-serif text-3xl mb-4">Reviews</h2>
      {(ratings ?? []).length ? (ratings as any[]).map((r, i) => (
        <div key={i} className="card mb-3"><div className="font-bold">{r.stars ? "★".repeat(r.stars) + "☆".repeat(5 - r.stars) : "No stars"} <span className="font-normal text-muted text-sm">from {r.rater?.full_name || "a member"}</span></div>{r.comment && <p className="text-[15px] mt-1">{r.comment}</p>}</div>
      )) : <p className="text-muted">No reviews yet. They appear after your first meetup.</p>}
    </div>
  );
}
