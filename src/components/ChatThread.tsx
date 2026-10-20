"use client";
/**
 * LIVE CHAT WINDOW (used on /messages/<postId>)
 *
 * "use client" means this runs in the browser, because it has to react
 * instantly: new messages from others appear without refreshing the page.
 *
 * How it works:
 *  - The page loads the existing messages on the server and passes them in as `initial`.
 *  - This component then subscribes to Supabase Realtime: whenever a new row is
 *    added to the messages table for this post, the database pushes it here live.
 *  - Sending a message saves a row to the database; everyone else's screen
 *    picks it up through their own subscription.
 *  - It also fetches AI conversation starters you can tap to fill in the text box.
 */
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export function ChatThread({
  postId, userId, names, initial, starterQuery,
}: {
  postId: string;                 // which post's chat this is
  userId: string;                 // the logged-in user, so we know which bubbles are "mine"
  names: Record<string, string>;  // user id -> display name, for labeling others' messages
  initial: Message[];             // messages already loaded by the server
  starterQuery: { title: string; category: string; kind: string };
}) {
  // One database connection for the life of this component.
  const supabase = useRef(createClient()).current;
  // "State" = values that, when changed, make React redraw the screen.
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");           // what's typed in the box
  const [starters, setStarters] = useState<string[]>([]);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);    // invisible marker at the end, for auto-scroll

  // Listen for new messages in real time. The "return" cleanup unsubscribes when the user leaves the page.
  useEffect(() => {
    const channel = supabase
      .channel(`post-${postId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `post_id=eq.${postId}` }, (payload) => {
        const m = payload.new as Message;
        // Skip it if we already have it (e.g. our own message, added when we sent it).
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, supabase]);

  // Load conversation starters once from our /api/starters route.
  useEffect(() => {
    const qs = new URLSearchParams(starterQuery).toString();
    fetch(`/api/starters?${qs}`).then((r) => r.json()).then((j) => setStarters(j.starters ?? [])).catch(() => {});
  }, [starterQuery]);

  // Whenever a message is added, scroll smoothly to the newest one.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Send button: clear the box right away (feels fast), save the message,
  // and if saving fails, show the error and put the text back.
  async function send(e: React.FormEvent) {
    e.preventDefault(); // stop the browser's default full-page form reload
    const body = text.trim();
    if (!body) return;
    setError("");
    setText("");
    const { data, error } = await supabase.from("messages").insert({ post_id: postId, sender_id: userId, body }).select().single();
    if (error) { setError(error.message); setText(body); return; }
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]));
  }

  return (
    <div className="bg-cream border border-line rounded-[22px] flex flex-col h-[70vh] min-h-[420px]">
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
        <div className="self-center bg-beige rounded-full px-3.5 py-1 text-[13px] text-muted">Chat opened when the first person joined</div>
        {/* Message bubbles: mine on the right in teal, others on the left with their name. */}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`max-w-[75%] ${mine ? "self-end" : "self-start"}`}>
              {!mine && <div className="text-xs text-muted mb-0.5 ml-1">{names[m.sender_id] ?? "Member"}</div>}
              <div className={`rounded-2xl px-4 py-2.5 ${mine ? "bg-teal text-white rounded-br-sm" : "bg-white border border-line rounded-bl-sm"}`}>{m.body}</div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {/* Tappable starter suggestions; tapping one fills the text box. */}
      {starters.length > 0 && (
        <div className="px-5 pb-3">
          <div className="text-xs font-bold tracking-widest text-muted mb-2">AI CONVERSATION STARTERS</div>
          <div className="flex flex-wrap gap-2">{starters.map((s) => <button key={s} type="button" onClick={() => setText(s)} className="bg-teal-light text-teal-dark text-sm rounded-full px-3.5 py-1.5">{s}</button>)}</div>
        </div>
      )}
      {error && <p className="px-5 pb-2 text-sm text-coral-dark">{error}</p>}
      <form onSubmit={send} className="p-3 border-t border-line bg-white rounded-b-[22px] flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Write a message…" className="input !rounded-full" />
        <button className="btn-navy">Send</button>
      </form>
    </div>
  );
}
