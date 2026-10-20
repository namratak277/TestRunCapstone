"use client";
import { useState } from "react";
import type { Kind } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

const LANES: { kind: Kind; n: number; title: string; sub: string; cls: string }[] = [
  { kind: "skill", n: 1, title: "Offer a service", sub: "Practice your craft on a real person", cls: "bg-teal text-white" },
  { kind: "activity", n: 2, title: "Host a plan", sub: "Movie, hike, game night, anything", cls: "bg-navy text-white" },
  { kind: "request", n: 3, title: "Request a service", sub: "Ask for what you need at a low price", cls: "bg-coral text-navy" },
];

export function NewPostForm({ action, initialKind, error }: { action: (f: FormData) => void; initialKind: Kind; error?: string }) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [times, setTimes] = useState<string[]>([""]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState(1);

  return (
    <form action={action}>
      <input type="hidden" name="kind" value={kind} />
      {times.map((t, i) => (t ? <input key={i} type="hidden" name="times" value={new Date(t).toISOString()} /> : null))}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {LANES.map((l) => (
          <button key={l.kind} type="button" onClick={() => { setKind(l.kind); if (l.kind === "skill" || l.kind === "request") setCapacity(1); }} className={`${l.cls} text-left rounded-[22px] p-5 border-4 ${kind === l.kind ? "border-coral" : "border-transparent"}`}>
            <div className="text-xs font-bold tracking-widest opacity-80">LANE {l.n}</div>
            <div className="font-serif text-2xl leading-tight my-1">{l.title}</div>
            <div className="text-sm opacity-90">{l.sub}</div>
          </button>
        ))}
      </div>
      {error && <p className="bg-coral-light text-coral-dark rounded-xl p-3 mb-4">{error}</p>}

      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex-1 basis-[480px] min-w-0 space-y-5">
          <div className="card space-y-4">
            <div className="label tracking-widest">THE BASICS</div>
            <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" required minLength={3} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder={kind === "activity" ? "Spider-Man on Saturday, need one more" : kind === "skill" ? "Learning nail tech, practicing on you" : "Looking for a low-price haircut"} /></div>
            <div><label className="label" htmlFor="category">Category</label><input id="category" name="category" maxLength={60} className="input" placeholder="Nails, haircuts, movies, hikes…" /></div>
            <div><label className="label" htmlFor="description">What will happen</label><textarea id="description" name="description" rows={4} maxLength={2000} className="input" placeholder="Describe the plan, what to bring, what to expect…" /></div>
          </div>

          <div className="card space-y-4">
            <div className="label tracking-widest">WHERE AND WHEN</div>
            <div><label className="label" htmlFor="location">Meeting place</label><input id="location" name="location" required maxLength={200} className="input" placeholder="Near campus · public place" /></div>
            <div>
              <span className="label">Time options (up to 3)</span>
              <div className="space-y-2">
                {times.map((t, i) => (
                  <input key={i} type="datetime-local" required={i === 0} value={t} onChange={(e) => setTimes((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} className="input" />
                ))}
              </div>
              {times.length < 3 && <button type="button" onClick={() => setTimes((a) => [...a, ""])} className="mt-2 font-bold text-teal">+ Add a time</button>}
            </div>
            <div><label className="label" htmlFor="duration_min">Duration (minutes)</label><input id="duration_min" name="duration_min" type="number" min={15} max={480} step={15} defaultValue={60} className="input" /></div>
          </div>

          <div className="card space-y-4">
            <div className="label tracking-widest">SPOTS AND PRICE</div>
            <div className="flex flex-wrap gap-6">
              <div>
                <span className="label">How many people</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setCapacity((c) => Math.max(1, c - 1))} className="w-9 h-9 rounded-full border-2 border-navy font-bold">−</button>
                  <b className="text-xl w-6 text-center">{capacity}</b>
                  <button type="button" onClick={() => setCapacity((c) => Math.min(50, c + 1))} className="w-9 h-9 rounded-full border-2 border-navy font-bold">+</button>
                </div>
                <input type="hidden" name="capacity" value={capacity} />
              </div>
              <div className="flex-1 basis-[180px]"><label className="label" htmlFor="price">Price in dollars (0 = free)</label><input id="price" name="price" type="number" min={0} step="1" value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="0" /></div>
            </div>
            <p className="text-sm text-muted">Payment is settled in person for now.</p>
          </div>

          <div className="card space-y-3">
            <div className="label tracking-widest">SAFETY</div>
            <label className="flex gap-3 items-center"><input type="checkbox" name="requires_waiver" defaultChecked={kind === "skill"} key={kind} className="w-5 h-5 accent-teal" /> Require a waiver before people join</label>
            <p className="text-sm text-muted">A chat opens automatically for everyone who joins, with AI conversation starters.</p>
          </div>
        </div>

        <aside className="flex-none basis-[320px] w-full md:w-[320px] space-y-4">
          <div className="label tracking-widest">PREVIEW</div>
          <div className="card">
            <span className="rounded-full px-3 py-1 text-[13px] font-bold bg-coral-light text-coral-dark">{LANES.find((l) => l.kind === kind)!.title}</span>
            <div className="font-serif text-2xl leading-tight my-3">{title || "Your title shows here"}</div>
            <div className="text-sm text-muted">{Number(price) > 0 ? `$${price}` : "Free"} · {capacity} {capacity === 1 ? "spot" : "spots"}</div>
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="Posting…">Post it</SubmitButton>
        </aside>
      </div>
    </form>
  );
}
