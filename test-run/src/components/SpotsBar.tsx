export function SpotsBar({ filled, capacity, booked }: { filled: number; capacity: number; booked?: boolean }) {
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
