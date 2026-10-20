"use client";
/**
 * OPTIONAL MESSAGE TO THE HOST (on the Join page)
 *
 * A text box plus tappable conversation starters. Tapping a starter adds it
 * to the message. It runs in the browser because the box updates as you tap.
 * The text is sent along with the join form (name="message").
 */
import { useState } from "react";

export function JoinMessage({ starters }: { starters: string[] }) {
  const [text, setText] = useState("");
  return (
    <>
      <textarea name="message" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500} className="input" placeholder="Hi! I would love to join…" />
      <div className="label tracking-widest mt-4">CONVERSATION STARTERS</div>
      <div className="flex flex-wrap gap-2">
        {starters.map((s) => (
          <button type="button" key={s} onClick={() => setText((t) => (t ? t + " " : "") + s)} className="bg-teal-light text-teal-dark text-sm rounded-full px-3.5 py-1.5">{s}</button>
        ))}
      </div>
    </>
  );
}
