import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Track } from "@/components/Logo";
import { fmtDateTime } from "@/lib/format";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: part } = await supabase
    .from("participants")
    .select("time:post_times!time_id(starts_at), post:posts!post_id(*, host:profiles!host_id(full_name))")
    .eq("post_id", params.id).eq("user_id", user.id).maybeSingle();
  if (!part) notFound();
  const post = (part as any).post as Post;
  const time = (part as any).time as { starts_at: string } | null;

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-10">
      <div className="text-center mb-8">
        <div className="flex justify-center"><Track width={240} /></div>
        <h1 className="font-serif text-5xl md:text-6xl mt-4">You&rsquo;re in.</h1>
        <p className="text-lg text-muted mt-2 max-w-lg mx-auto">Your spot is saved. {post.status === "booked" ? "The post now shows Booked." : "The post shows how many have joined."}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="card">
            <div className="label tracking-widest">YOUR TEST RUN</div>
            <div className="font-serif text-2xl leading-tight mb-2">{post.title}</div>
            <div className="text-muted mb-4">{time && <>{fmtDateTime(time.starts_at)}<br /></>}{post.location}<br />Host: {post.host?.full_name || "Member"}</div>
            <div className="flex flex-wrap gap-3">
              <a href={`/api/ics/${post.id}`} className="btn-primary">Add to calendar (.ics)</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.location)}`} target="_blank" rel="noreferrer" className="btn-outline">Get directions</a>
            </div>
          </div>
          <div className="card">
            <div className="label tracking-widest">WHAT HAPPENS NEXT</div>
            <ol className="text-[15px] text-muted space-y-1 list-decimal pl-5">
              <li>Say hi in the chat.</li>
              <li>Meet in a public place and show up on time.</li>
              <li>Rate each other afterward.</li>
            </ol>
          </div>
        </div>
        <div className="card flex flex-col">
          <div className="label tracking-widest">CHAT WITH YOUR {post.capacity > 1 ? "GROUP" : "HOST"}</div>
          <p className="text-[15px] text-muted mb-4">{post.capacity > 1 ? "A group chat is open for everyone who joined." : "This is a 1:1 chat because the post has one spot."} AI conversation starters are waiting inside.</p>
          <Link href={`/messages/${post.id}`} className="btn-navy mt-auto">Open chat</Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-8"><Link href="/" className="btn-navy">Back to home</Link><Link href="/browse" className="btn-outline">Keep browsing</Link></div>
    </div>
  );
}
