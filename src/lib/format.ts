/**
 * DISPLAY FORMATTING HELPERS
 *
 * Small functions that turn raw database values into friendly text,
 * e.g. "2026-10-24T18:00:00Z" -> "Sat, Oct 24, 2:00 PM" or 0 cents -> "Free".
 * Keeping them in one place means every page shows dates and prices the same way.
 */
import type { Post } from "./types";

// All times are shown in Eastern time, since the app starts at UNCG (North Carolina).
const TZ = "America/New_York";

// "Sat, Oct 24, 2:00 PM"
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

// "Saturday, October 24"
export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });

// "2:00 PM"
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

// Splits a date into { dow: "SAT", day: "24" } for the little calendar-tile badges.
export const dayParts = (iso: string) => ({
  dow: new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" }).toUpperCase(),
  day: new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, day: "numeric" }),
});

// Price in cents -> "$5", "$7.50", or "Free".
export const priceText = (p: Pick<Post, "price_cents">) =>
  p.price_cents > 0 ? `$${(p.price_cents / 100).toFixed(p.price_cents % 100 ? 2 : 0)}` : "Free";

// Capacity summary: "3 spots open" when nobody has joined, otherwise "2 of 3 spots filled".
export const spotsText = (p: Pick<Post, "capacity" | "spots_filled" | "status">) => {
  if (p.status === "booked") return `${p.spots_filled} of ${p.capacity} spots filled`;
  const open = p.capacity - p.spots_filled;
  if (p.spots_filled === 0) return `${open} ${open === 1 ? "spot" : "spots"} open`;
  return `${p.spots_filled} of ${p.capacity} spots filled`;
};
