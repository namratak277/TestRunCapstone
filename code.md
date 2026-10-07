# Code Reference

A beginner-friendly, file-by-file walkthrough of everything in `src/` and `supabase/`. For the product vision, see [README.md](README.md).

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Configuration Files](#configuration-files)
3. [lib/ — Shared Code](#lib--shared-code)
4. [middleware.ts — Session Refresh](#middlewarets--session-refresh)
5. [actions.ts — Server Actions](#actionsts--server-actions)
6. [components/](#components)
7. [app/ — Pages and Routes](#app--pages-and-routes)
8. [api/ — Route Handlers](#api--route-handlers)
9. [supabase/schema.sql — Database](#supabaseschemasql--database)
10. [Explaining This Project to a Developer](#explaining-this-project-to-a-developer)
11. [Explaining This Project to a Non-Technical Person](#explaining-this-project-to-a-non-technical-person)

---

## Project Structure

Instead of a folder tree, here's each folder and the files inside it, with a plain-English description of what each one does.

**Root folder**
- `README.md` — explains what the app is and why it exists
- `code.md` — this file
- `package.json` — the list of packages the app depends on (Next.js, React, Supabase, Zod, Tailwind)
- `tsconfig.json` — TypeScript settings; sets up the `@/` shortcut so code can write `@/lib/...` instead of a long relative path
- `tailwind.config.ts` — defines the app's colors and fonts
- `next.config.mjs` — Next.js's config file (empty right now, using all the defaults)
- `.env.example` — a template listing the 3 secret/config values the app needs to run

**supabase:**
- `schema.sql` — one script that builds the entire database: every table, every security rule, every helper function

**app:**
- `layout.tsx` — the outer wrapper every page sits inside (loads fonts, shows the header and bottom tab bar on every page)
- `globals.css` — site-wide styling, plus shortcut classes like `.btn` and `.card` used everywhere
- `page.tsx` — the Home page (`/`)
- `browse/page.tsx` — the Browse page (`/browse`)
- `new/page.tsx` — the New Post page (`/new`)
- `posts/[id]/page.tsx` — a single post's detail page
- `posts/[id]/join/page.tsx` — the "join this post" page
- `posts/[id]/confirmed/page.tsx` — the "you're in!" confirmation page
- `posts/[id]/live/page.tsx` — shown right after you create a post, so you can see it live
- `messages/page.tsx` — the list of all your chats
- `messages/[postId]/page.tsx` — one specific chat conversation
- `calendar/page.tsx` — your upcoming and past events
- `rate/[postId]/page.tsx` — the page for rating people after a meetup
- `profile/page.tsx` — your profile page
- `login/page.tsx` — the log-in page
- `signup/page.tsx` — the sign-up page
- `actions.ts` — every "write" action in the app (sign in, create a post, join a post, etc.) lives here
- `api/starters/route.ts` — a backend endpoint that returns AI-generated conversation starters
- `api/ics/[postId]/route.ts` — a backend endpoint that generates a downloadable calendar invite file

**components:**
- `Header.tsx` — the top navigation bar
- `TabBar.tsx` — the bottom navigation bar, shown on mobile
- `PostCard.tsx` — the small preview box shown for each post on the feeds
- `SpotsBar.tsx` — the little bar graphic showing how many spots in a post are filled
- `Logo.tsx` — the app's logo icon plus a decorative "running track" image
- `NewPostForm.tsx` — the form used to create a new post
- `JoinMessage.tsx` — the message box + suggested conversation-starter buttons shown when joining a post
- `ChatThread.tsx` — the live chat window
- `SubmitButton.tsx` — a reusable "Submit" button that shows a loading state while a form is saving

**lib:**
- `types.ts` — describes the "shape" of the app's data (what a Post looks like, what a Message looks like, etc.)
- `format.ts` — helper functions that turn raw data into readable text (like turning a timestamp into `"Sat, Oct 10, 2:30 PM"`)
- `starters.ts` — generates AI-written conversation-starter questions, with a backup list in case the AI is unavailable

**lib/supabase:**
- `server.ts` — connects to the database from pages and server code
- `client.ts` — connects to the database from the browser (used by client-side components)
- `middleware.ts` — checks whether a visitor is logged in and sends them to the login page if they try to view something that requires it

**src (top level):**
- `middleware.ts` — a small file that runs before every page loads, to keep the visitor's login session fresh

---

## Configuration Files

| File | What it does |
|---|---|
| `tsconfig.json` | Standard Next.js TypeScript setup. The one thing worth knowing: `"@/*": ["./src/*"]` means any import written as `@/lib/...` or `@/components/...` points into the `src/` folder. |
| `tailwind.config.ts` | Defines the color palette as named tokens (`teal`, `coral`, `navy`, `cream`, `beige`, `line`, `muted`) and two font variables (`--font-serif`, `--font-sans`) that get set up in `layout.tsx`. Components use these names instead of raw color codes. |
| `globals.css` | Pulls in Tailwind, then defines reusable style classes like `.btn`, `.card`, `.label`, `.input`, and `.chip`. These show up repeatedly across the app instead of long strings of utility classes. |
| `.env.example` | The only 3 settings the app reads: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both required to connect to the database), and `ANTHROPIC_API_KEY` (optional — only needed for the AI conversation starters). |
| `next.config.mjs` | Empty — the app just uses Next.js's defaults. |

---

## lib/ — Shared Code

### `lib/types.ts`
Just type definitions — no actual logic, just descriptions of what each piece of data looks like:
- `Kind = "skill" | "activity" | "request"` — the three categories a post can be.
- `Post` — what a post looks like, including the host's info and its scheduled times.
- `PostTime`, `Message` — describe those two tables directly.
- `KIND_LABEL` — turns each `Kind` into a friendly label ("Skill practice", "Activity", "Service request") shown on post cards and detail pages.

### `lib/format.ts`
Small functions that take raw dates/numbers and turn them into readable text (always shown in the `"America/New_York"` timezone):
- `fmtDateTime(iso)` → `"Sat, Oct 10, 2:30 PM"`
- `fmtDay(iso)` → `"Saturday, October 10"`
- `fmtTime(iso)` → `"2:30 PM"`
- `dayParts(iso)` → `{ dow: "SAT", day: "10" }`, used for the little date-chip shown on Home/Calendar
- `priceText(post)` → `"$15"` or `"Free"`
- `spotsText(post)` → `"3 spots open"` or `"2 of 4 spots filled"`

### `lib/starters.ts`
Generates AI conversation-starter suggestions, but never leaves a user without any:
- `fallbackStarters(kind)` — a fixed list of 3 questions per `Kind`. Always works, no internet call needed.
- `getStarters({ title, category, kind })` — if there's no `ANTHROPIC_API_KEY` set up, it just returns the fallback list right away. Otherwise it asks Claude (Anthropic's AI) for 3 short starter questions and returns those. If anything goes wrong (bad response, network issue, etc.) it quietly falls back to the static list instead of showing an error.

### `lib/supabase/server.ts`
Sets up a connection to the Supabase database for use on pages and in server actions — the kind of code that runs on the server, not in the user's browser.

### `lib/supabase/client.ts`
Sets up a connection to Supabase for use in the browser (currently only `ChatThread.tsx` needs this, since it has to listen for new chat messages live).

### `lib/supabase/middleware.ts`
`updateSession(request)` — runs on every page request, called from the root `middleware.ts`:
1. Connects to Supabase.
2. Checks who the current visitor is, refreshing their login session if it's about to expire.
3. Checks whether the page they're visiting requires being logged in (pages like `/new`, `/messages`, `/calendar`, `/profile`, `/rate`, and the post join/confirm/live pages).
4. If login is required and no one's logged in, redirects to `/login`, remembering where they were headed so they land back there after logging in.

---

## middleware.ts — Session Refresh

A tiny file at the project root — about ten lines. It just hands off to `updateSession()` above on every page load. It skips static files like images and fonts, so it only runs for actual pages.

---

## actions.ts — Server Actions

Every single "write" in the app (saving something to the database) goes through one of these functions in `src/app/actions.ts`. Forms call them directly — there's no separate backend API for these.

| Function | What it does |
|---|---|
| `signIn(formData)` | Logs the user in. If it fails, sends them back to `/login` with an error message. If it works, sends them wherever they were trying to go. |
| `signUp(formData)` | Creates a new account. A database trigger automatically creates a matching profile using the name provided at signup. If the user needs to confirm their email first, they're sent to `/login` with a "check your email" message instead of straight into the app. |
| `signOut()` | Logs the user out and sends them home. |
| `createPost(formData)` | Checks that the form data is valid (title length, price range, capacity, etc.), then saves the new post and its scheduled times to the database, then takes the user to the "your post is live" page. |
| `joinPost(formData)` | Lets a user join a post. All the actual rule-checking (is there room? did they agree to the waiver? etc.) happens inside the database itself, not in this function — see the schema section below. If something's wrong, it sends them back with an error message; otherwise, to the "you're confirmed" page. |
| `leavePost(formData)` | Removes the user from a post they'd joined. |
| `askQuestion(formData)` | Saves a question to a post (requires being logged in). |
| `answerQuestion(formData)` | Saves a host's answer to a question. |
| `submitRating(formData)` | Saves a rating (stars, tags, comment) after a meetup. If someone accidentally submits the same rating twice, it's silently ignored instead of showing an error. |
| `reportPost(formData)` | Saves a report about a post (requires being logged in). |

There are also two small helper functions at the top of the file: one safely pulls a trimmed string out of form data, and the other makes sure redirect links always stay inside the app (so a sneaky "next page" link can't send someone off-site).

---

## components/

| Component | Runs on | Purpose |
|---|---|---|
| `Header.tsx` | Server | The top nav bar: logo, nav links, search bar, and either "Log in / Sign up" or "New post / Avatar" depending on whether someone's logged in. |
| `TabBar.tsx` | Browser | The bottom nav bar shown on mobile: Home, Browse, a "+" button to make a post, Chats, and You. Highlights whichever tab matches the current page. |
| `PostCard.tsx` | Server | The preview tile shown on the Home/Browse/Profile feeds — shows the category, price, title, location/time, the spots bar, and how many spots are left. Turns navy and says "Booked" once it's full. |
| `SpotsBar.tsx` | Server | Draws up to 12 little bar segments, filling in however many spots are taken. |
| `Logo.tsx` | Server | The small icon shown in the header, plus a bigger decorative "running track" graphic used on a few pages. |
| `NewPostForm.tsx` | Browser | The form on `/new`: pick a category, add up to 3 time options, set capacity/price, and see a live preview as you type. |
| `JoinMessage.tsx` | Browser | A text box plus clickable suggested questions that get added into the message when clicked — used on the join page. |
| `ChatThread.tsx` | Browser | The live chat window. Listens for new messages in real time so they show up without refreshing the page, and also loads AI-suggested conversation starters. |
| `SubmitButton.tsx` | Browser | A "Submit" button that automatically disables itself and shows a loading label while its form is saving — reused across nearly every form in the app. |

---

## app/ — Pages and Routes

Every page here loads fresh data from the database each time it's visited, rather than using a cached version.

- **`layout.tsx`** — the wrapper every page sits inside: loads the fonts, shows the header and tab bar, sets the page title.
- **`page.tsx` (`/`)** — the homepage: a hero banner, the 3 colored category cards, a feed of open posts, an "upcoming" list for logged-in users, a safety tip, and a "how it works" section.
- **`browse/page.tsx` (`/browse`)** — search and filter posts (by keyword, type, "has open spots," "free only"), shown as a feed of `PostCard`s with clickable filter chips.
- **`new/page.tsx` (`/new`)** — the "create a post" page. Pre-selects a category if one was passed in the URL, then shows the `NewPostForm`.
- **`posts/[id]/page.tsx`** — the main post detail page. Shows different things depending on who's looking: the host sees "Open chat" and "Rate participants," someone who already joined sees "See your plan" and "Leave," and everyone else sees a form to pick a time and join.
- **`posts/[id]/join/page.tsx`** — confirms the chosen time, shows the waiver checkbox if needed, and includes the conversation-starter message box.
- **`posts/[id]/confirmed/page.tsx`** — the "you're in!" page: add-to-calendar and directions links, a "what happens next" checklist, and a link into the chat.
- **`posts/[id]/live/page.tsx`** — shown right after creating a post, showing exactly how it now appears to others.
- **`messages/page.tsx` (`/messages`)** — a list of every chat you're part of, as host or participant.
- **`messages/[postId]/page.tsx`** — one specific chat thread. Checks that you're actually allowed to be in it before showing the messages.
- **`calendar/page.tsx` (`/calendar`)** — your events split into "upcoming" and "past," pulling together both posts you host and posts you've joined.
- **`rate/[postId]/page.tsx`** — after a meetup, shows a rating form for each person you're allowed to rate (and skips anyone you've already rated).
- **`profile/page.tsx` (`/profile`)** — your info, a sign-out button, your stats, your posts, posts you've joined, and reviews you've received.
- **`login/page.tsx`, `signup/page.tsx`** — the log-in and sign-up forms.

---

## api/ — Route Handlers

### `api/starters/route.ts`
A small backend endpoint: given a post's title/category/type, it returns 3 AI-suggested conversation starters as JSON. Used by `ChatThread.tsx`.

### `api/ics/[postId]/route.ts`
A small backend endpoint that builds a downloadable calendar invite file (`.ics`) for a post, so people can add it to their own calendar app. Only works for people who are actually the host or a participant of that post.

---

## supabase/schema.sql — Database

One script you run once in the Supabase SQL editor to set up the whole database.

**Tables:** `profiles`, `posts`, `post_times`, `participants`, `messages`, `questions`, `ratings`, `reports` — see the [Data Model table in README.md](README.md#data-model) for what columns each one has.

**Automatic trigger:** whenever someone signs up, a matching `profiles` row is created automatically, using the name they typed in at signup.

**Two special database functions**, used instead of writing directly to certain tables. They're allowed to bypass the normal security rules temporarily, so they can safely do the checking themselves:
- `is_post_member(p_post)` — a quick check: "does this user host or belong to this post?" Used internally by the chat security rules.
- `join_post(p_post, p_time, p_message, p_waiver)` — handles someone joining a post. It checks, in order: are they logged in, is it not their own post, have they not already joined, is there still room, did they check the waiver box if required, and is the time they picked actually valid for this post. If any check fails, it stops and sends back an error message (which shows up on the join page). If everything passes, it adds them and fills one more spot — all in one atomic step, so two people can't accidentally grab the very last spot at the same time.
- `leave_post(p_post)` — removes someone from a post and frees up their spot.

**Security rules:** every table has rules controlling who can see or change which rows. The notable one: nobody — not even through the app — can directly insert a row into `participants`. The only door in is through `join_post()` above, which does all the validation itself. That guarantees no one can sneak into a full post or skip the waiver.

**Realtime:** the `messages` and `posts` tables are set up to broadcast live updates, which is what lets the chat window update instantly without refreshing.

---

## Explaining This Project to a Developer

**One-liner:** It's a Next.js app where people post a skill they're practicing, an activity, or a service request — others browse and join, then it opens a live chat and scheduling flow. Think Craigslist meets a practice-partner matchmaker.

**Stack, fast:** Next.js (App Router) + TypeScript + Tailwind on the frontend, Supabase (Postgres) for the database/auth/realtime, Zod for form validation, optional Claude API call for AI-generated conversation starters.

**The 3 things worth mentioning, since they're the actual design decisions:**

1. **All writes go through one `actions.ts`** — Server Actions called directly from form `action` props, no separate REST/API layer for mutations. Only two real API routes exist (`/api/starters`, `/api/ics/[postId]`), both GET-only utility endpoints.

2. **Concurrency-safe joins live in the database, not the app.** Joining a post calls a single Postgres function (`join_post`) that locks the row, validates capacity/waiver/ownership, and increments the counter — all in one transaction. That's deliberate: it means two people can't race for the last spot, and it means the `participants` table has *no insert policy at all* in RLS — the only way in is through that function.

3. **Middleware handles session refresh + route protection in one pass** — reads the Supabase session on every request and redirects unauthenticated users before they ever reach a protected page.

If someone asks "what's novel here" vs. a plain CRUD app, point at #2 — it's the one piece that isn't just scaffolding.

---

## Explaining This Project to a Non-Technical Person

Think of it like a community bulletin board, but for doing things together instead of just buying/selling stuff.

- Someone learning a hands-on skill — say, a cosmetology student who needs practice clients for their certification hours — posts: *"I'm learning to cut hair, need people to practice on, it's cheap (or free), here's where and when."*
- Someone who just wants to do something — *"Going to see a movie Saturday, need one more person"* — posts that instead.
- Someone who needs a cheap service — *"Looking for a low-cost haircut"* — posts a request.

Other people browse those posts and tap to join. Each post shows how many spots are left, and once it's full it's marked "Booked" so people stop trying to join something that's already full.

Once someone joins, a group chat opens up automatically so everyone can work out the details, and the meetup gets added to a calendar. Afterward, everyone rates each other — so if someone's unreliable or never shows up, that's visible to people deciding whether to meet them next time.

The whole point: it's easier to meet new people around something you're both already planning to do, than around a dating-app-style profile with no clear reason to meet.
