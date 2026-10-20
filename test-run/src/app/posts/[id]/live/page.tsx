import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { Track } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function LivePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("posts").select("*, host:profiles!host_id(full_name), post_times(id, post_id, starts_at)").eq("id", params.id).single();
  if (!data) notFound();
  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-6 py-12 text-center">
      <div className="flex justify-center"><Track width={240} /></div>
      <h1 className="font-serif text-5xl md:text-6xl mt-4">Your post is live.</h1>
      <p className="text-lg text-muted mt-2 mb-8 max-w-xl mx-auto">People can now find it, ask questions, and join. A chat opens for everyone who joins.</p>
      <div className="max-w-md mx-auto text-left mb-8"><PostCard post={data as Post} /></div>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href={`/posts/${params.id}`} className="btn-navy">View my post</Link>
        <Link href="/" className="btn-outline">Back to home</Link>
      </div>
      <div className="mt-10 bg-beige rounded-[22px] p-6 text-left max-w-xl mx-auto">
        <div className="font-bold mb-2">What happens next</div>
        <ol className="text-[15px] text-muted list-decimal pl-5 space-y-1"><li>Someone joins and the spots count updates.</li><li>When every spot is taken, the post flips to Booked.</li><li>A chat opens with everyone who joined.</li><li>It lands on your calendar.</li></ol>
      </div>
    </div>
  );
}
