# Test Run

Practice-partner network and activity-joining app. Next.js 14 (App Router) + TypeScript + Tailwind + Supabase.

## Run it locally

1. Install Node 18.18+ and run `npm install`.
2. Create a free project at supabase.com.
3. In Supabase, open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and run it.
4. Copy `.env.example` to `.env.local` and fill in the URL and anon key (Project Settings → API).
5. For quick testing, turn off **Authentication → Providers → Email → Confirm email** so signup logs you straight in.
6. `npm run dev` and open http://localhost:3000.

Optional: add `ANTHROPIC_API_KEY` to `.env.local` for AI-written conversation starters. Without it the app uses a built-in list.

## Try the full flow

1. Sign up as user A, then **New post** (Offer a service) with a time and 1 spot.
2. Open a private window, sign up as user B, find the post in **Browse**, join it, and open the chat.
3. Back as user A the post now says Booked, and both of you see the chat update live.
4. Add to calendar (.ics), then rate each other from **Calendar**.

## Pages (matches the design canvas)

| Route | Screen |
|---|---|
| `/` | Home (marketing when logged out, dashboard when logged in) |
| `/login`, `/signup` | Auth |
| `/browse` | Search and filters |
| `/posts/[id]` | Post detail, time options, Q&A |
| `/posts/[id]/join` | Waiver, message, confirm |
| `/posts/[id]/confirmed` | "You're in", .ics, directions |
| `/new`, `/posts/[id]/live` | Create a post, post live |
| `/messages`, `/messages/[postId]` | Chats (realtime) |
| `/calendar` | Upcoming and past, .ics download |
| `/profile` | Stats, posts, reviews, log out |
| `/rate/[postId]` | Ratings |

## How the important parts work

- **Capacity and Booked status:** `join_post()` in `schema.sql` locks the post row, checks capacity, waiver and duplicates, then increments `spots_filled`. `posts.status` is a generated column, so Booked is always correct.
- **Security:** Row Level Security is on for every table. Joining only goes through `join_post()`. Chat is readable only by the host and participants.
- **Chat:** one chat per post (host plus everyone who joined) using Supabase Realtime.
- **Calendar:** `/api/ics/[postId]` builds a standards-compliant .ics file.
- **Mobile:** the same app is responsive. Under 768px the header collapses and a bottom tab bar appears. Make it installable later with a PWA manifest.

## Not built yet (roadmap)

Phone verification and profile photos, Stripe payments, Google Calendar sync, push notifications, admin report queue, block list, image uploads, email notifications (Resend), tests (Vitest).

## Deploy

Push to GitHub, import the repo in Vercel, add the same env vars, and set your Vercel URL under Supabase → Authentication → URL Configuration.
