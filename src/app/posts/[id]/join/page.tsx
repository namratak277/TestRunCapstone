import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { fmtDateTime, priceText } from "@/lib/format";
import { fallbackStarters } from "@/lib/starters";
import { joinPost } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { JoinMessage } from "@/components/JoinMessage";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params, searchParams }: { params: { id: string }; searchParams: { time?: string; error?: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("posts").select("*, host:profiles!host_id(full_name), post_times(id, post_id, starts_at)").eq("id", params.id).single();
  if (!data) notFound();
  const post = data as Post;
  if (post.status === "booked") redirect(`/posts/${post.id}`);

  const times = (post.post_times ?? []).slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const chosen = times.find((t) => t.id === searchParams.time) ?? times[0];

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6">
      <Link href={`/posts/${post.id}`} className="font-bold text-[15px] no-underline">← Back to post</Link>
      <h1 className="font-serif text-4xl md:text-5xl mt-3 mb-5">Join this test run</h1>
      {searchParams.error && <p className="bg-coral-light text-coral-dark rounded-xl p-3 mb-4">{searchParams.error}</p>}

      <form action={joinPost} className="flex flex-wrap gap-7 items-start">
        <input type="hidden" name="post_id" value={post.id} />
        <input type="hidden" name="time_id" value={chosen?.id ?? ""} />
        <div className="flex-1 basis-[520px] min-w-0 space-y-5">
          <div className="card flex items-center justify-between gap-3 flex-wrap">
            <div><div className="label tracking-widest">YOUR TIME</div><b>{chosen ? fmtDateTime(chosen.starts_at) : "To be agreed in chat"}</b><div className="text-sm text-muted">{post.location}</div></div>
            <Link href={`/posts/${post.id}`} className="font-bold no-underline">Change</Link>
          </div>
          {post.requires_waiver && (
            <div className="card">
              <div className="label tracking-widest">WAIVER</div>
              <label className="flex gap-3 items-start cursor-pointer">
                <input type="checkbox" name="waiver" required className="mt-1 w-5 h-5 accent-teal" />
                <span className="text-[15px] text-muted">I understand this is a student practice session and not a professional service. I join at my own risk and can leave at any time. <i>Acknowledgment is saved with a timestamp.</i></span>
              </label>
            </div>
          )}
          <div className="card">
            <div className="label tracking-widest">MESSAGE TO THE HOST (OPTIONAL)</div>
            <JoinMessage starters={fallbackStarters(post.kind)} />
          </div>
        </div>
        <aside className="flex-none basis-[340px] w-full md:w-[340px]">
          <div className="bg-white border-2 border-teal rounded-[26px] p-6">
            <div className="label tracking-widest">SUMMARY</div>
            <div className="font-serif text-2xl leading-tight">{post.title}</div>
            <div className="my-3 text-[15px] text-muted">{chosen && <>{fmtDateTime(chosen.starts_at)}<br /></>}{post.location}<br />Host: {post.host?.full_name || "Member"}</div>
            <div className="border-t border-line pt-3 flex justify-between font-bold"><span>Due now</span><span>$0</span></div>
            <div className="text-[13px] text-muted mt-1 mb-5">{post.price_cents > 0 ? `Pay ${priceText(post)} to the host in person.` : "Free."}</div>
            <SubmitButton className="btn-primary w-full" pendingText="Joining…">Confirm and join</SubmitButton>
          </div>
        </aside>
      </form>
    </div>
  );
}
