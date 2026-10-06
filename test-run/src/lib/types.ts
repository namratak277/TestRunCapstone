export type Kind = "skill" | "activity" | "request";

export type PostTime = { id: string; post_id: string; starts_at: string };

export type Post = {
  id: string;
  host_id: string;
  kind: Kind;
  title: string;
  category: string;
  description: string;
  location: string;
  price_cents: number;
  capacity: number;
  duration_min: number;
  requires_waiver: boolean;
  spots_filled: number;
  status: "open" | "booked";
  created_at: string;
  host?: { full_name: string } | null;
  post_times?: PostTime[];
};

export type Message = { id: string; post_id: string; sender_id: string; body: string; created_at: string };

export const KIND_LABEL: Record<Kind, string> = {
  skill: "Skill practice",
  activity: "Activity",
  request: "Service request",
};
