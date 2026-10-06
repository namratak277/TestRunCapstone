import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { KIND_LABEL } from "@/lib/types";
import { fmtDateTime, priceText, spotsText } from "@/lib/format";
import { SpotsBar } from "@/components/SpotsBar";
import { askQuestion, answerQuestion, leavePost, reportPost } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function PostPage({ params, searchParams }: { params: { id: string }; searchParams: { reported?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("posts")
    .select("*, host:profiles!host_id(full_name), post_times(id, post_id, starts_at)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();
  const post = data as Post;
  const times = (post.post_times ?? []).slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const [{ data: qs }, { data: ratings }, { data: mine }] = await Promise.all([
    supabase.from("questions").select("*, asker:profiles!user_id(full_name)").eq("post_id", post.id).order("created_at"),
    supabase.from("ratings").select("stars").eq("ratee_id", post.host_id),
    user ? supabase.from("participants").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const rated = (ratings ?? []).filter((r: any) => r.stars);
  const avg = rated.length ? (rated.reduce((s: number, r: any) => s + r.stars, 0) / rated.length).toFixed(1) : null;
  const isHost = user?.id === post.host_id;
  const joined = !!mine;
  const booked = post.status === "booked";

  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-6">
      <Link href="/browse" className="font-bold text-[15px] no-underline">← Back to results</Link>
      {searchParams.reported && <p className="bg-teal-light text-teal-dark rounded-xl p-3 mt-3">Thanks. We will review this post.</p>}

      <div className="flex flex-wrap gap-7 items-start mt-4">
        <div className="flex-1 basis-[560px] min-w-0">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="rounded-full px-3 py-1 text-[13px] font-bold bg-coral-light text-coral-dark">{KIND_LABEL[post.kind]}</span>
            {post.requires_waiver && <span className="rounded-full px-3 py-1 text-[13px] font-bold bg-teal-light text-teal-dark">Waiver required</span>}
            <span className="rounded-full px-3 py-1 text-[13px] font-bold bg-beige">{booked ? "Booked" : spotsText(post)}</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08]">{post.title}</h1>
          <div className="text-muted text-[17px] mt-2 mb-6">{[post.location, priceText(post), post.category].filter(Boolean).join(" · ")}</div>

          <div className="card mb-5"><div className="label tracking-widest">ABOUT THIS TEST RUN</div><p className="whitespace-pre-line">{post.description || "No details yet."}</p><p className="text-muted mt-3 text-[15px]">Duration: about {post.duration_min} minutes.</p></div>

          <div className="card mb-5">
            <div className="label tracking-widest">TIME OPTIONS</div>
            {times.map((t) => <div key={t.id} className="border border-line rounded-2xl px-4 py-3 mb-2 font-bold">{fmtDateTime(t.starts_at)}</div>)}
          </div>

          <div className="card mb-5">
            <div className="label tracking-widest">YOUR HOST</div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-coral flex-none" />
              <div><div className="font-bold text-lg">{post.host?.full_name || "Test Run member"}</div><div className="text-sm text-muted">Verified student · {avg ? `${avg} stars from ${rated.length} ${rated.length === 1 ? "rating" : "ratings"}` : "New to Test Run"}</div></div>
            </div>
          </div>

          <div className="card mb-5">
            <div className="label tracking-widest">BEFORE YOU GO</div>
            <p className="text-[15px] text-muted">{post.requires_waiver ? "This is a student practice session, so a short waiver is part of joining. " : ""}Meet in a public place the first time. You can report or block anyone.</p>
            {user && !isHost && (
              <form action={reportPost} className="mt-3"><input type="hidden" name="post_id" value={post.id} /><button className="text-sm font-bold text-[#B0561A] underline">Report this post</button></form>
            )}
          </div>

          <div className="card">
            <div className="label tracking-widest">QUESTIONS FOR THE HOST</div>
            {(qs ?? []).length === 0 && <p className="text-muted text-[15px] mb-3">No questions yet.</p>}
            {(qs ?? []).map((q: any) => (
              <div key={q.id} className="bg-cream rounded-2xl p-4 mb-3">
                <div className="text-[15px]"><b>{q.asker?.full_name || "Member"}:</b> {q.body}</div>
                {q.answer ? <div className="text-[15px] text-teal-dark mt-1"><b>Host:</b> {q.answer}</div> : isHost ? (
                  <form action={answerQuestion} className="flex gap-2 mt-2"><input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="question_id" value={q.id} /><input name="answer" className="input" placeholder="Answer…" required /><SubmitButton className="btn-navy !py-2">Reply</SubmitButton></form>
                ) : <div className="text-sm text-muted mt-1">Waiting for the host to answer.</div>}
              </div>
            ))}
            {!isHost && (
              <form action={askQuestion} className="flex gap-2 mt-2"><input type="hidden" name="post_id" value={post.id} /><input name="body" className="input" placeholder="Ask a question about this post…" required /><SubmitButton className="btn-navy">Ask</SubmitButton></form>
            )}
          </div>
        </div>

        <aside className="flex-none basis-[360px] w-full md:w-[360px] md:sticky md:top-6">
          <div className="bg-white border-2 border-teal rounded-[26px] p-7">
            <div className="font-serif text-3xl leading-tight">{priceText(post)}</div>
            <div className="text-sm text-muted mt-1">Settle up in person</div>
            <SpotsBar filled={post.spots_filled} capacity={post.capacity} booked={booked} />
            <div className={`text-sm font-bold mb-4 ${booked ? "text-[#B0561A]" : "text-teal-dark"}`}>{spotsText(post)}</div>

            {isHost ? (
              <div className="space-y-3">
                <p className="text-[15px] text-muted">This is your post.</p>
                <Link href={`/messages/${post.id}`} className="btn-navy w-full">Open chat</Link>
                <Link href={`/rate/${post.id}`} className="btn-outline w-full">Rate participants</Link>
              </div>
            ) : joined ? (
              <div className="space-y-3">
                <p className="bg-teal-light text-teal-dark rounded-xl p-3 text-[15px] font-bold">You are in.</p>
                <Link href={`/posts/${post.id}/confirmed`} className="btn-primary w-full">See your plan</Link>
                <Link href={`/messages/${post.id}`} className="btn-outline w-full">Open chat</Link>
                <form action={leavePost}><input type="hidden" name="post_id" value={post.id} /><button className="w-full text-sm font-bold text-muted underline">Leave this post</button></form>
              </div>
            ) : booked ? (
              <div><div className="btn bg-line text-muted w-full">Booked</div><Link href={`/browse?type=${post.kind}&open=1`} className="block text-center font-bold mt-3">See similar posts</Link></div>
            ) : (
              <form action={`/posts/${post.id}/join`} method="get" className="space-y-3">
                <div className="space-y-2">
                  {times.map((t, i) => (
                    <label key={t.id} className="flex items-center gap-3 border border-line rounded-2xl px-4 py-2.5 cursor-pointer has-[:checked]:bg-teal-light has-[:checked]:border-teal">
                      <input type="radio" name="time" value={t.id} defaultChecked={i === 0} className="accent-teal" />
                      <span className="font-bold text-[15px]">{fmtDateTime(t.starts_at)}</span>
                    </label>
                  ))}
                </div>
                <button className="btn-primary w-full">Join this test run</button>
                <p className="text-[13px] text-muted text-center">You will not be charged. Nothing is final until you confirm.</p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
