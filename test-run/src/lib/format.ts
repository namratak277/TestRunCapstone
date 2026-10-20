import type { Post } from "./types";

const TZ = "America/New_York";

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export const dayParts = (iso: string) => ({
  dow: new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" }).toUpperCase(),
  day: new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, day: "numeric" }),
});

export const priceText = (p: Pick<Post, "price_cents">) =>
  p.price_cents > 0 ? `$${(p.price_cents / 100).toFixed(p.price_cents % 100 ? 2 : 0)}` : "Free";

export const spotsText = (p: Pick<Post, "capacity" | "spots_filled" | "status">) => {
  if (p.status === "booked") return `${p.spots_filled} of ${p.capacity} spots filled`;
  const open = p.capacity - p.spots_filled;
  if (p.spots_filled === 0) return `${open} ${open === 1 ? "spot" : "spots"} open`;
  return `${p.spots_filled} of ${p.capacity} spots filled`;
};
