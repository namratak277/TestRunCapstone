"use server";
/**
 * SERVER ACTIONS: everything that SAVES or CHANGES data lives here.
 *
 * "use server" means these functions run only on our server, never in the
 * browser. Forms across the app point at them (e.g. <form action={signIn}>);
 * when a user presses Submit, Next.js sends the form fields here.
 *
 * The usual pattern for each action:
 *   1. Connect to Supabase as the current user
 *   2. Read and check the form fields
 *   3. Write to the database (security rules still apply)
 *   4. Refresh any pages showing that data (revalidatePath)
 *   5. Send the user to the next page (redirect), with an error message in the URL if something failed
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Read a form field as trimmed text ("" if missing).
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
// Only allow redirects to our own pages ("/browse"), never to another website.
// This stops someone from crafting a login link that bounces users to a fake site.
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/");
// Make text safe to put in a URL (spaces -> %20, etc.).
const enc = (s: string) => encodeURIComponent(s);

// ---------- auth ----------

// Log in with email + password, then return to the page they came from.
export async function signIn(formData: FormData) {
  const supabase = createClient();
  const next = safeNext(str(formData, "next"));
  const { error } = await supabase.auth.signInWithPassword({
    email: str(formData, "email"),
    password: str(formData, "password"),
  });
  if (error) redirect(`/login?error=${enc(error.message)}&next=${enc(next)}`);
  redirect(next);
}

// Create a new account. The full name is saved with the account, and a
// database trigger copies it into the "profiles" table automatically.
export async function signUp(formData: FormData) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: str(formData, "email"),
    password: str(formData, "password"),
    options: { data: { full_name: str(formData, "full_name") } },
  });
  if (error) redirect(`/signup?error=${enc(error.message)}`);
  // If email confirmation is on in Supabase, there is no session yet.
  if (!data.session) redirect("/login?msg=Check your email to confirm your account, then log in.");
  redirect("/");
}

// Log out and go back to the home page.
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------- posts ----------

// The rules a new post must follow. Zod checks the form against these and
// gives a readable error ("title too short") instead of saving bad data.
const PostSchema = z.object({
  kind: z.enum(["skill", "activity", "request"]),
  title: z.string().min(3).max(120),
  category: z.string().max(60),
  description: z.string().max(2000),
  location: z.string().max(200),
  price: z.coerce.number().min(0).max(1000),
  capacity: z.coerce.number().int().min(1).max(50),
  duration_min: z.coerce.number().int().min(15).max(480),
});

// Create a new post from the "New post" form. It saves the post, then its
// time options (up to 3), then shows the "Your post is live" page.
export async function createPost(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/new");

  // Check the form fields against the rules above.
  const parsed = PostSchema.safeParse({
    kind: str(formData, "kind"),
    title: str(formData, "title"),
    category: str(formData, "category"),
    description: str(formData, "description"),
    location: str(formData, "location"),
    price: str(formData, "price") || 0,
    capacity: str(formData, "capacity") || 1,
    duration_min: str(formData, "duration_min") || 60,
  });
  // Collect the chosen time options, dropping blanks and invalid dates.
  const times = formData.getAll("times").map(String).filter(Boolean).map((t) => new Date(t)).filter((d) => !isNaN(d.getTime()));
  if (!parsed.success || times.length === 0) {
    const msg = !parsed.success ? parsed.error.issues[0].message : "Add at least one time option";
    redirect(`/new?error=${enc(msg)}`);
  }
  // Save the post. Price is converted from dollars to cents.
  const p = parsed.data;
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      host_id: user.id,
      kind: p.kind,
      title: p.title,
      category: p.category,
      description: p.description,
      location: p.location,
      price_cents: Math.round(p.price * 100),
      capacity: p.capacity,
      duration_min: p.duration_min,
      requires_waiver: formData.get("requires_waiver") === "on",
    })
    .select("id")
    .single();
  if (error || !post) redirect(`/new?error=${enc(error?.message ?? "Could not create post")}`);

  // Save the time options, linked to the new post.
  const { error: tErr } = await supabase
    .from("post_times")
    .insert(times.slice(0, 3).map((d) => ({ post_id: post.id, starts_at: d.toISOString() })));
  if (tErr) redirect(`/new?error=${enc(tErr.message)}`);

  // Refresh Home and Browse so the new post shows up there right away.
  revalidatePath("/");
  revalidatePath("/browse");
  redirect(`/posts/${post.id}/live`);
}

// Join a post. Instead of inserting a row ourselves, we call the database
// function join_post() (see supabase/schema.sql). It checks capacity, the
// waiver and duplicate joins all at once, so two people can never grab the
// last spot at the same moment.
export async function joinPost(formData: FormData) {
  const supabase = createClient();
  const postId = str(formData, "post_id");
  const timeId = str(formData, "time_id") || null;
  const { error } = await supabase.rpc("join_post", {
    p_post: postId,
    p_time: timeId,
    p_message: str(formData, "message"),
    p_waiver: formData.get("waiver") === "on",
  });
  if (error) redirect(`/posts/${postId}/join?time=${timeId ?? ""}&error=${enc(error.message)}`);
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}/confirmed`);
}

// Leave a post you joined. The database function frees up your spot.
export async function leavePost(formData: FormData) {
  const supabase = createClient();
  const postId = str(formData, "post_id");
  await supabase.rpc("leave_post", { p_post: postId });
  revalidatePath("/");
  redirect(`/posts/${postId}`);
}

// ---------- questions ----------

// Ask the host a public question on their post (before deciding to join).
export async function askQuestion(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const postId = str(formData, "post_id");
  if (!user) redirect(`/login?next=${enc(`/posts/${postId}`)}`);
  const body = str(formData, "body");
  if (body) await supabase.from("questions").insert({ post_id: postId, user_id: user.id, body });
  revalidatePath(`/posts/${postId}`);
}

// The host answers a question. Database rules make sure only the host can do this.
export async function answerQuestion(formData: FormData) {
  const supabase = createClient();
  const postId = str(formData, "post_id");
  const answer = str(formData, "answer");
  if (answer) await supabase.from("questions").update({ answer }).eq("id", str(formData, "question_id"));
  revalidatePath(`/posts/${postId}`);
}

// ---------- ratings ----------

// Save a rating after a meetup: did they show up, stars, tags, and a comment.
// The database allows one rating per person per post, so a repeat submit is ignored.
export async function submitRating(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const postId = str(formData, "post_id");
  if (!user) redirect("/login");
  const stars = Number(str(formData, "stars")) || null;
  const { error } = await supabase.from("ratings").insert({
    post_id: postId,
    rater_id: user.id,
    ratee_id: str(formData, "ratee_id"),
    showed_up: str(formData, "showed_up") !== "no",
    stars,
    tags: formData.getAll("tags").map(String),
    comment: str(formData, "comment"),
  });
  if (error && !error.message.includes("duplicate")) redirect(`/rate/${postId}?error=${enc(error.message)}`);
  revalidatePath("/profile");
  redirect(`/rate/${postId}?done=1`);
}

// ---------- reports ----------

// Flag a post for review (safety feature). Saved for an admin to look at later.
export async function reportPost(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const postId = str(formData, "post_id");
  if (!user) redirect("/login");
  await supabase.from("reports").insert({ reporter_id: user.id, post_id: postId, reason: str(formData, "reason") || "Reported from post" });
  redirect(`/posts/${postId}?reported=1`);
}
