import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/ChatThread";
import { fmtDateTime } from "@/lib/format";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: { postId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: post } = await supabase.from("posts").select("id, title, kind, category, host_id, location, capacity").eq("id", params.postId).single();
  if (!post) notFound();

  const { data: parts } = await supabase.from("participants").select("user_id, time:post_times!time_id(starts_at)").eq("post_id", post.id);
  const memberIds = Array.from(new Set([post.host_id, ...(parts ?? []).map((p: any) => p.user_id)]));
  if (!memberIds.includes(user!.id)) notFound();

  const [{ data: profiles }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", memberIds),
    supabase.from("messages").select("*").eq("post_id", post.id).order("created_at").limit(200),
  ]);
  const names: Record<string, string> = {};
  (profiles ?? []).forEach((p: any) => (names[p.id] = p.full_name || "Member"));
  const myTime = (parts ?? []).find((p: any) => p.user_id === user!.id) as any;

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6">
      <Link href="/messages" className="font-bold text-[15px] no-underline">← All chats</Link>
      <div className="flex items-end justify-between flex-wrap gap-2 mt-3 mb-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl leading-tight">{post.title}</h1>
          <div className="text-sm text-muted">{[myTime?.time && fmtDateTime(myTime.time.starts_at), post.location, `${memberIds.length} in this chat`].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="flex gap-3 text-sm font-bold"><Link href={`/posts/${post.id}`}>View post</Link><Link href={`/rate/${post.id}`}>Rate</Link></div>
      </div>
      <ChatThread postId={post.id} userId={user!.id} names={names} initial={(messages ?? []) as Message[]} starterQuery={{ title: post.title, category: post.category, kind: post.kind }} />
      <p className="text-[13px] text-muted mt-3">Keep plans in the app and meet in public the first time. <Link href={`/posts/${post.id}`}>Report or block</Link> from the post.</p>
    </div>
  );
}
