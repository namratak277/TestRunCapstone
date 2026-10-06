import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitRating } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const TAGS = ["On time", "Friendly", "Felt safe", "Skilled", "Good conversation"];

export default async function RatePage({ params, searchParams }: { params: { postId: string }; searchParams: { error?: string; done?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: post } = await supabase.from("posts").select("id, title, host_id, host:profiles!host_id(full_name)").eq("id", params.postId).single();
  if (!post) notFound();
  const { data: parts } = await supabase.from("participants").select("user_id, who:profiles!user_id(full_name)").eq("post_id", post.id);

  const isHost = post.host_id === user!.id;
  const isParticipant = (parts ?? []).some((p: any) => p.user_id === user!.id);
  if (!isHost && !isParticipant) notFound();

  const targets: { id: string; name: string }[] = isHost
    ? (parts ?? []).map((p: any) => ({ id: p.user_id, name: p.who?.full_name || "Member" }))
    : [{ id: post.host_id, name: (post.host as any)?.full_name || "Host" }];
  const { data: done } = await supabase.from("ratings").select("ratee_id").eq("post_id", post.id).eq("rater_id", user!.id);
  const doneIds = new Set((done ?? []).map((d: any) => d.ratee_id));

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-6 py-8">
      <div className="text-teal font-bold text-sm tracking-wider">AFTER THE MEETUP</div>
      <h1 className="font-serif text-4xl md:text-5xl leading-tight mt-1 mb-1">How was your test run?</h1>
      <p className="text-muted mb-6">{post.title}</p>
      {searchParams.done && <p className="bg-teal-light text-teal-dark rounded-xl p-3 mb-4">Thanks! Your rating was saved.</p>}
      {searchParams.error && <p className="bg-coral-light text-coral-dark rounded-xl p-3 mb-4">{searchParams.error}</p>}
      {targets.length === 0 && <div className="card text-muted">Nobody has joined yet, so there is nobody to rate.</div>}
      {targets.map((t) =>
        doneIds.has(t.id) ? (
          <div key={t.id} className="card mb-5 text-muted">You already rated <b className="text-navy">{t.name}</b>.</div>
        ) : (
          <form key={t.id} action={submitRating} className="card mb-5 space-y-5">
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="ratee_id" value={t.id} />
            <div className="font-bold text-lg">Rate {t.name}</div>
            <div><span className="label tracking-widest">DID THEY SHOW UP?</span><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="showed_up" value="yes" defaultChecked className="accent-teal" /> Yes</label><label className="flex items-center gap-2"><input type="radio" name="showed_up" value="no" className="accent-teal" /> No</label></div></div>
            <div><span className="label tracking-widest">YOUR RATING</span><div className="flex gap-3">{[1, 2, 3, 4, 5].map((n) => <label key={n} className="flex items-center gap-1"><input type="radio" name="stars" value={n} defaultChecked={n === 5} className="accent-teal" />{n}★</label>)}</div></div>
            <div><span className="label tracking-widest">WHAT WENT WELL</span><div className="flex flex-wrap gap-2">{TAGS.map((tag) => <label key={tag} className="flex items-center gap-2 border border-line rounded-full px-3.5 py-1.5 text-sm has-[:checked]:bg-teal has-[:checked]:text-white"><input type="checkbox" name="tags" value={tag} className="hidden" />{tag}</label>)}</div></div>
            <div><label className="label tracking-widest" htmlFor={`c-${t.id}`}>COMMENT (OPTIONAL)</label><textarea id={`c-${t.id}`} name="comment" rows={3} maxLength={500} className="input" placeholder="Share what it was like…" /></div>
            <SubmitButton pendingText="Saving…">Submit rating</SubmitButton>
          </form>
        )
      )}
      <Link href="/calendar" className="font-bold">← Back to calendar</Link>
    </div>
  );
}
