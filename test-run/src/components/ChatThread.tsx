"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export function ChatThread({
  postId, userId, names, initial, starterQuery,
}: {
  postId: string;
  userId: string;
  names: Record<string, string>;
  initial: Message[];
  starterQuery: { title: string; category: string; kind: string };
}) {
  const supabase = useRef(createClient()).current;
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [starters, setStarters] = useState<string[]>([]);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`post-${postId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `post_id=eq.${postId}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, supabase]);

  useEffect(() => {
    const qs = new URLSearchParams(starterQuery).toString();
    fetch(`/api/starters?${qs}`).then((r) => r.json()).then((j) => setStarters(j.starters ?? [])).catch(() => {});
  }, [starterQuery]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
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
