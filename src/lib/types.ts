/**
 * DATA SHAPES
 *
 * TypeScript "types" describe what our data looks like, so the editor can
 * catch mistakes (like a typo in a field name) before the app runs.
 * These mirror the tables in supabase/schema.sql.
 */

// The three kinds of post, which the UI calls the three "lanes":
//   skill    = a student offering to practice a service on you
//   activity = a plan others can join (movie, hike...)
//   request  = someone asking for a low-cost service
export type Kind = "skill" | "activity" | "request";

// One proposed time slot for a post (a post can offer up to 3).
export type PostTime = { id: string; post_id: string; starts_at: string };

// A post, as stored in the "posts" table.
export type Post = {
  id: string;
  host_id: string;
  kind: Kind;
  title: string;
  category: string;
  description: string;
  location: string;
  price_cents: number;      // price stored in cents (500 = $5.00) to avoid decimal rounding errors
  capacity: number;         // how many people can join
  duration_min: number;
  requires_waiver: boolean;
  spots_filled: number;     // how many have joined so far
  status: "open" | "booked"; // computed by the database: "booked" once spots_filled reaches capacity
  created_at: string;
  // Optional extras that are filled in when a query also fetches related tables:
  host?: { full_name: string } | null;
  post_times?: PostTime[];
};

// One chat message. Each post has a single group chat.
export type Message = { id: string; post_id: string; sender_id: string; body: string; created_at: string };

// Human-friendly label shown on badges for each kind of post.
export const KIND_LABEL: Record<Kind, string> = {
  skill: "Skill practice",
  activity: "Activity",
  request: "Service request",
};
