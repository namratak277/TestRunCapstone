import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: hosted }, { data: joined }] = await Promise.all([
    supabase.from("posts").select("id, title, capacity, spots_filled, created_at").eq("host_id", user!.id),
    supabase.from("participants").select("post:posts!post_id(id, title, capacity, spots_filled, created_at)").eq("user_id", user!.id),
  ]);
  const chats = [...(hosted ?? []), ...((joined ?? []) as any[]).map((j) => j.post).filter(Boolean)] as { id: string; title: string; capacity: number; spots_filled: number }[];

  return (
    <div className="max-w-[800px] mx-auto px-4 md:px-6 py-8">
      <h1 className="font-serif text-4xl md:text-5xl mb-6">Chats</h1>
      {chats.length === 0 ? (
        <div className="card text-center py-10"><p className="text-muted mb-4">No chats yet. A chat opens when you join a post, or when someone joins yours.</p><Link href="/browse" className="btn-primary">Browse posts</Link></div>
      ) : (
        <div className="space-y-3">
          {chats.map((c) => (
            <Link key={c.id} href={`/messages/${c.id}`} className="card flex items-center gap-4 no-underline text-navy hover:border-teal">
              <div className="w-11 h-11 rounded-full bg-coral flex-none" />
              <div className="flex-1 min-w-0"><div className="font-bold truncate">{c.title}</div><div className="text-sm text-muted">{c.capacity > 1 ? `Group · ${c.spots_filled + 1} people` : "1:1 chat"}</div></div>
              <span className="font-bold text-teal">Open</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
