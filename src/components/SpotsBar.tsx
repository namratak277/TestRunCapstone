/**
 * SPOTS PROGRESS BAR: one small segment per spot, colored in as people join.
 * e.g. capacity 4 with 3 joined -> three colored segments and one grey.
 * Turns coral when the post is booked.
 */
export function SpotsBar({ filled, capacity, booked }: { filled: number; capacity: number; booked?: boolean }) {
  // Cap at 12 segments so big groups don't draw dozens of tiny lines.
  const n = Math.min(capacity, 12);
  const on = booked ? "bg-coral" : "bg-teal";
  return (
    <div className="flex gap-1.5 my-3" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`flex-1 h-2 rounded-full ${i < filled ? on : "bg-line"}`} />
      ))}
    </div>
  );
}
