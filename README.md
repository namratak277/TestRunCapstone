# TestRunCapstone
Creating a website for people who want to turn their hobbies into a small business or get services for cheaper by newly learning businesses.

---

## Table of Contents
1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [Core Features](#core-features)
4. [Post Types](#post-types)
5. [User Flow](#user-flow)
6. [Trust and Safety](#trust-and-safety)
7. [Business Model and Payments](#business-model-and-payments)
8. [Competitive Landscape](#competitive-landscape)
9. [Academic Framing](#academic-framing)
10. [Tech Stack](#tech-stack)
11. [Architecture](#architecture)
12. [Data Model](#data-model)
13. [Current Status](#current-status)
14. [Brand](#brand)
15. [Getting Started](#getting-started)
16. [Project Conventions](#project-conventions)
17. [Open Decisions](#open-decisions)

---

## Overview

Test Run is a web app connecting people around a specific activity or service, not a portfolio or bio. Because the shared task is already defined, users have something to talk about from the first message.

It merges two ideas: people post a service or skill they offer or need (sometimes with a price), and a connection-building app where a pre-defined activity is the icebreaker.

> Test Run is a practice-partner network where students learning a hands-on skill find real people to work with, and where any shared activity, paid or free, becomes the reason to meet.

"Test run" works literally (a practice run for someone learning a skill) and figuratively (trying out a plan or person before committing).

## The Problem

- Meeting new people around a photo or bio is awkward; meeting them around a shared activity is not.
- Students in hands-on programs (cosmetology, barbering, massage therapy, personal training, photography, tutoring, UX) often need real people to practice on for certification hours, with no dedicated place to find them.
- People who want to do something (see a movie, go hiking) often lack someone to go with.

## Core Features

- Create a post for an activity or a service; others browse, join, or ask questions first.
- Each post shows a live spots-filled count and flips to **Booked** once capacity is reached.
- Once matched, the meeting is scheduled and can be added to a calendar.
- Joining opens a chat (group if capacity > 1, direct if 1:1), with AI-generated conversation starters.
- Post-event ratings and reviews.

## Post Types

Posts come in three kinds, sharing one `type` field but different relevant fields:

| Kind | Example | Key fields |
|---|---|---|
| **Skill practice** | "Learning nail tech, practicing on you. Low price, [location], [time options]." | price, time options, capacity, liability waiver |
| **Activity** | "Going to see Spider-Man Saturday, need one more." | date/time, capacity |
| **Service request** | "Looking for a low-price haircut." | price, time options |

## User Flow

1. Sign up, verify email, complete a basic profile.
2. Pick a few interests during onboarding.
3. Browse the feed (filter by category, location, date) or create a post.
4. Join a post or ask the poster a question.
5. A chat opens (group if more than one joiner, direct for 1:1).
6. Event is scheduled and exported to a calendar.
7. After the event, both sides leave a rating and optional review; the post auto-archives.

## Trust and Safety

Meeting strangers is the biggest risk, so it's treated as a core feature, not an afterthought:

- Email/phone verification, real name, and profile photo required before posting or joining.
- Report and block on every post, profile, and chat, with an admin review queue.
- Timestamped liability waiver before booking confirms on skill-practice posts.
- Safety banner suggesting public meeting spots for first meetups.
- No-show flagging and ratings feed a trust score on each profile.
- Stretch goal: third-party ID verification.

## Business Model and Payments

**MVP:** no in-app payments — users settle up in person (cash, Venmo). Keeps liability and compliance burden low for a student project.

**Revenue options for later** (pick one for the capstone business section):
1. Transaction fee on paid service posts only; free activities stay free.
2. Freemium — free posting/joining, paid tier for boosted visibility or unlimited posts.
3. Flat marketplace fee per booked connection.
4. v2: Stripe Connect, platform fee, funds held until the service is marked complete.

## Competitive Landscape

The "join an activity, meet people" space is crowded (Plus 1, Sidekick, Loopa, Meet5, Meetup), but those apps are purely social. Test Run differentiates by:
- Combining a skill-practice marketplace with social activity-joining.
- Focusing on students who need practice hours and clients.
- Activity-specific AI conversation starters and a campus-first (UNCG) launch for a smaller trust surface.

## Academic Framing

The capstone write-up leans on network science: **weak ties and bridging capital** (Granovetter) — the product connects strangers through a shared activity rather than shared identity — and **emergent networks**, where simple local rules (post, join, chat, meet) grow a social network over time.

## Tech Stack

| Layer | Library / tool | Used for |
|---|---|---|
| Framework | Next.js 14 (App Router) | Routing, Server Components, Server Actions |
| UI | React 18, TypeScript | Components, type checking |
| Styling | Tailwind CSS | All component classes, custom tokens in `tailwind.config.ts` |
| Fonts | `next/font/google` (DM Serif Display, DM Sans) | Loaded in `layout.tsx` |
| Validation | Zod | New-post form in `actions.ts` |
| Backend | [Supabase](https://supabase.com) (`supabase-js`, `@supabase/ssr`) | Postgres, auth, Row Level Security, realtime |
| AI starters | Anthropic API (`claude-haiku-4-5`) | `lib/starters.ts`, optional — falls back to a static list without a key |
| Calendar export | Hand-rolled `.ics` generator | `api/ics/[postId]/route.ts`, no external library |
| Hosting (planned) | Vercel + Supabase | Not deployed yet |

## Architecture

- **Frontend** — Server Components by default; `"use client"` only where needed (`ChatThread`, `NewPostForm`, `JoinMessage`, `SubmitButton`, `TabBar`).
- **Backend** — Server Actions in `actions.ts` handle all writes; `/api/starters` and `/api/ics/[postId]` are route handlers for non-HTML responses.
- **Database** — Postgres via Supabase. RLS is enabled on every table; `join_post()`/`leave_post()` are `security definer` SQL functions so capacity/waiver checks happen atomically instead of racing in app code. `ChatThread.tsx` subscribes to a realtime channel for live messages.
- **Sessions** — `middleware.ts` refreshes the Supabase auth cookie on every request; separate client factories exist for server vs. client components.
- **API keys** — only the anon key belongs in the frontend (RLS-limited); the service-role key must never be committed. Neither exists in this repo yet.

## Data Model

| Table | Key fields | Notes |
|---|---|---|
| `profiles` | `id`, `full_name` | auto-created on signup by a trigger |
| `posts` | `host_id`, `kind`, `title`, `location`, `price_cents`, `capacity`, `spots_filled`, `status` | `status` is a **generated** column (`open`/`booked`) |
| `post_times` | `post_id`, `starts_at` | up to 3 per post |
| `participants` | `post_id`, `user_id`, `time_id`, `waiver_at` | unique per post+user; inserted only via `join_post()` |
| `messages` | `post_id`, `sender_id`, `body` | realtime-enabled |
| `questions` | `post_id`, `user_id`, `body`, `answer` | public Q&A |
| `ratings` | `post_id`, `rater_id`, `ratee_id`, `stars`, `tags`, `comment` | unique per rater/ratee/post |
| `reports` | `reporter_id`, `post_id`/`user_id`, `reason` | insert-only, no admin UI yet |

## Current Status

Every page and server action listed above has working code, but the app has **never been run** — no `node_modules`, no `.env.local`, no Supabase project created or `schema.sql` applied anywhere.

**Built:** auth, post creation/feed/browse with filters, join/leave with atomic capacity checks, realtime chat with AI (or fallback) conversation starters, Q&A, `.ics` calendar export, star ratings with tags/comments, report-a-post.

**Not built:** payments, photo upload, phone/ID verification, blocking, admin report queue, Google Calendar sync, interest-based matching, practice-hour tracking, post auto-archiving, host-approval on join (joins currently auto-accept if a spot is open).

**Next milestone:** create a Supabase project, apply `schema.sql`, add `.env.local`, and confirm sign-up works end to end — see [Getting Started](#getting-started).

## Brand

**Name:** Test Run

| Role | Hex |
|---|---|
| Primary (teal) | `#2A9D8F` |
| Accent (coral) | `#F4A261` |
| Dark / text (navy) | `#264653` |
| Background | `#FDFCF9` |

**Logo:** a two-node mark (two connected dots) as the primary mark; a pin-plus-chat mark as a secondary icon.
**Tagline ideas (placeholders):** "Practice makes people." / "Every skill needs a test run."

## Getting Started

The app lives at the repo root (`src/`, `supabase/`, `package.json`) — no sub-folder.

1. Create a Supabase project, open **SQL Editor → New query**, paste in [`supabase/schema.sql`](supabase/schema.sql), and run it.
2. Copy the project URL and anon key from **Settings → API**.
3. Copy `.env.example` to `.env.local` and fill in the two Supabase values (`ANTHROPIC_API_KEY` is optional — leave blank to use the built-in fallback starters).
4. `npm install`
5. `npm run dev`, then sign up through `/signup` to confirm it reaches Supabase and creates a `profiles` row.
6. Connect the repo to Vercel so pushes to `main` deploy (not done yet).

## Project Conventions

- Commit early and often with descriptive messages.
- One feature branch per major piece (auth, posts, chat, etc.).
- Tag milestones (e.g. `v0.1-auth`).
- Keep a running list of known bugs and limitations.
- Manually test capacity edge cases (exactly at capacity, simultaneous joins).

## Open Decisions

- [ ] Business model (transaction fee, freemium, or flat fee)
- [ ] Final payment handling for v2
- [ ] Domain and social handle availability for "Test Run"
- [ ] Final logo and tagline
- [ ] Campus pilot scope (UNCG only for the demo)
- [ ] Trademark and naming check before any public launch
