# Code Reference

A file-by-file walkthrough of everything in `src/` and `supabase/`. For the product vision, see [README.md](README.md).

**About the editor errors:** every file here will show red squiggles (`Cannot find module 'next'`, `Cannot find module 'react'`, `JSX element implicitly has type 'any'`, etc.) until you run `npm install` — there is no `node_modules` folder yet, so TypeScript has no type definitions to resolve against. That's the reason for *all* of them; none are actual logic bugs introduced by the code itself. Running `npm install` from the repo root fixes the overwhelming majority. If specific red squiggles remain after that, those are worth looking at individually.

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

---

## Project Structure

```
TestRunCapstone/
├── README.md                  product vision + current status
├── code.md                    this file
├── package.json                next/react/supabase/zod/tailwind
├── tsconfig.json               "@/*" path alias → "./src/*"
├── tailwind.config.ts          color tokens, fonts
├── next.config.mjs             empty (default config)
├── .env.example                the 3 env vars this app reads
├── supabase/
│   └── schema.sql              every table, RLS policy, and SQL function
└── src/
    ├── middleware.ts           runs on every request, refreshes auth session
    ├── lib/
    │   ├── types.ts            Post / Message / Kind TypeScript types
    │   ├── format.ts           date/price/spots-text formatting helpers
    │   ├── starters.ts         AI conversation-starter logic + fallback list
    │   └── supabase/
    │       ├── server.ts       Supabase client for Server Components/Actions
    │       ├── client.ts       Supabase client for "use client" components
    │       └── middleware.ts   session-refresh + protected-route logic
    ├── components/
    │   ├── Header.tsx          top nav bar (server component, reads auth state)
    │   ├── TabBar.tsx           bottom mobile nav (client component)
    │   ├── PostCard.tsx        the post preview tile used on feeds
    │   ├── SpotsBar.tsx        the row of filled/empty capacity bars
    │   ├── Logo.tsx            LogoMark (header icon) + Track (hero/decoration svg)
    │   ├── NewPostForm.tsx     the 3-lane post-creation form (client component)
    │   ├── JoinMessage.tsx     optional message + starter chips on the join page
    │   ├── ChatThread.tsx      realtime chat UI (client component)
    │   └── SubmitButton.tsx    submit button that shows pending state
    └── app/
        ├── layout.tsx          root layout: fonts, <Header/>, <TabBar/>
        ├── globals.css         Tailwind layer + .btn/.card/.input/.chip classes
        ├── page.tsx            Home ("/")
        ├── browse/page.tsx     Browse ("/browse")
        ├── new/page.tsx        New post ("/new")
        ├── posts/[id]/
        │   ├── page.tsx        Post detail
        │   ├── join/page.tsx   Join flow (waiver + message)
        │   ├── confirmed/page.tsx  "You're in" screen
        │   └── live/page.tsx   "Your post is live" screen (shown after creating)
        ├── messages/
        │   ├── page.tsx        Chat list
        │   └── [postId]/page.tsx  Single chat thread
        ├── calendar/page.tsx   Upcoming/past events + .ics/rate links
        ├── rate/[postId]/page.tsx  Post-meetup rating form
        ├── profile/page.tsx    Own posts, joined posts, stats, reviews
        ├── login/page.tsx      Log in
        ├── signup/page.tsx     Sign up
        ├── actions.ts          every Server Action (all writes go through here)
        └── api/
            ├── starters/route.ts        GET — AI conversation starters
            └── ics/[postId]/route.ts    GET — downloads a .ics calendar file
```

---

## Configuration Files

| File | What it does |
|---|---|
| `tsconfig.json` | Standard Next.js TS config. The one thing worth knowing: `"@/*": ["./src/*"]` — every `@/lib/...` or `@/components/...` import resolves relative to `src/`. |
| `tailwind.config.ts` | Defines the color palette as named tokens (`teal`, `coral`, `navy`, `cream`, `beige`, `line`, `muted`) and two font variables (`--font-serif`, `--font-sans`) set up in `layout.tsx`. Every component references these tokens instead of raw hex values. |
| `globals.css` | Imports Tailwind's three layers, then defines reusable classes in `@layer components`: `.btn`/`.btn-primary`/`.btn-navy`/`.btn-outline`, `.card`, `.label`, `.input`, `.chip`/`.chip-on`. These are what you'll see repeated across almost every page instead of long Tailwind utility strings. |
| `.env.example` | The only 3 environment variables the app reads: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required), `ANTHROPIC_API_KEY` (optional). |
| `next.config.mjs` | Empty — no custom Next.js config. |

---

## lib/ — Shared Code

### `lib/types.ts`
Plain TypeScript types, no runtime code:
- `Kind = "skill" | "activity" | "request"` — the three post categories.
- `Post` — mirrors the `posts` table plus the two things that get joined in via Supabase's `select()` syntax: `host` (from `profiles`) and `post_times` (array).
- `PostTime`, `Message` — mirror their tables directly.
- `KIND_LABEL` — maps each `Kind` to its display label ("Skill practice", "Activity", "Service request"), used by `PostCard` and the post detail page.

### `lib/format.ts`
Pure formatting functions, all timezone-pinned to `"America/New_York"`:
- `fmtDateTime(iso)` → `"Sat, Oct 10, 2:30 PM"`
- `fmtDay(iso)` → `"Saturday, October 10"`
- `fmtTime(iso)` → `"2:30 PM"`
- `dayParts(iso)` → `{ dow: "SAT", day: "10" }`, used by the little date-chip UI on Home/Calendar
- `priceText(post)` → `"$15"` or `"Free"` (converts `price_cents` → dollars)
- `spotsText(post)` → `"3 spots open"` or `"2 of 4 spots filled"`

### `lib/starters.ts`
AI conversation starters, with a graceful fallback:
- `fallbackStarters(kind)` — a static, hardcoded array of 3 questions per `Kind`. Always available, no network call.
- `getStarters({ title, category, kind })` — if `ANTHROPIC_API_KEY` is unset, returns `fallbackStarters()` immediately. Otherwise calls the Anthropic Messages API directly via `fetch` (model `claude-haiku-4-5`), asking for 3 short starters as a JSON array in the response text, parses that array out, and falls back to the static list on any error (bad response, JSON parse failure, network error). This function is never allowed to throw — every path returns a string array.

### `lib/supabase/server.ts`
`createClient()` — builds a Supabase client for use in Server Components and Server Actions, wired to read/write the Next.js cookie store (`next/headers`). The `setAll` cookie write is wrapped in a `try/catch` because Server *Components* (not Actions) aren't allowed to set cookies — the middleware handles refreshing the session in that case instead.

### `lib/supabase/client.ts`
`createClient()` — builds a Supabase client for `"use client"` components (currently only `ChatThread.tsx`), using `createBrowserClient` instead of the server/cookie-based one.

### `lib/supabase/middleware.ts`
`updateSession(request)` — called from the root `middleware.ts` on every request:
1. Builds a Supabase client bound to the request/response cookies.
2. Calls `supabase.auth.getUser()`, which also refreshes the session cookie if the access token is close to expiring.
3. Checks the request path against a `PROTECTED` list (`/new`, `/messages`, `/calendar`, `/profile`, `/rate`) plus a regex for `/posts/[id]/join|confirmed|live`.
4. If the path needs auth and there's no user, redirects to `/login?next=<original path>` so the login action can send them back afterward.

---

## middleware.ts — Session Refresh

Ten lines at the project root: delegates straight to `updateSession()` above. The `config.matcher` excludes `_next/static`, `_next/image`, `favicon.ico`, and image file extensions, so the middleware only runs on actual page/data requests.

---

## actions.ts — Server Actions

Every write in the app goes through one of these functions (`src/app/actions.ts`), called directly as a form's `action` prop — no separate API layer for mutations.

| Function | What it does |
|---|---|
| `signIn(formData)` | Calls `supabase.auth.signInWithPassword`. On error, redirects back to `/login` with the error message in the query string. On success, redirects to the `next` param (defaults to `/`). |
| `signUp(formData)` | Calls `supabase.auth.signUp` with `full_name` in the user metadata (the `handle_new_user` DB trigger reads this to create the `profiles` row). If email confirmation is required, there's no session yet, so it redirects to `/login` with a "check your email" message instead of `/`. |
| `signOut()` | `supabase.auth.signOut()`, redirect to `/`. |
| `createPost(formData)` | Validates the form with a Zod schema (`kind`, `title` 3–120 chars, `category`, `description`, `location`, `price` 0–1000, `capacity` 1–50, `duration_min` 15–480). Parses up to 3 `times` values into `Date`s. Inserts the `posts` row, then inserts the `post_times` rows. Revalidates `/` and `/browse`, redirects to `/posts/[id]/live`. |
| `joinPost(formData)` | Calls the `join_post()` Postgres function via `supabase.rpc()` — all the capacity/waiver/duplicate-join validation happens in SQL (see schema below), not here. On error, redirects back to the join page with the message. On success, redirects to `/posts/[id]/confirmed`. |
| `leavePost(formData)` | Calls `leave_post()` via RPC, redirects back to the post. |
| `askQuestion(formData)` | Requires a signed-in user (redirects to login with a `next` param otherwise); inserts into `questions`. |
| `answerQuestion(formData)` | Updates a `questions` row's `answer` column. (Relies on the RLS policy to actually enforce that only the host can do this — there's no explicit host check in this function itself.) |
| `submitRating(formData)` | Inserts into `ratings` (`stars`, `showed_up`, `tags` array, `comment`). Ignores "duplicate" constraint errors silently (so re-submitting the same rating form twice doesn't show a scary error) but surfaces any other error. |
| `reportPost(formData)` | Requires sign-in, inserts into `reports`, redirects back to the post with `?reported=1`. |

Two small helpers at the top of the file: `str(formData, key)` (safe string extraction + trim) and `safeNext(next)` (only allows redirect targets starting with `/` and not `//`, to avoid open-redirect issues with the `next` query param).

---

## components/

| Component | Client/Server | Purpose |
|---|---|---|
| `Header.tsx` | Server | Logo, nav links (Home/Browse/Messages/Calendar, desktop-only), search bar (desktop-only), and either Log in/Sign up or New post/Avatar depending on `supabase.auth.getUser()`. |
| `TabBar.tsx` | Client (`usePathname`) | Mobile-only bottom nav: Home, Browse, a raised "+" post button, Chats, You. Highlights the active tab based on the current route. |
| `PostCard.tsx` | Server | The tile used on Home/Browse/Profile feeds — kind tag, price, title, location/time line, `SpotsBar`, and spots-left text. Switches to a solid navy "Booked" style once `status === "booked"`. |
| `SpotsBar.tsx` | Server | Renders up to 12 small bar segments, filling `filled` of them in teal (or coral if booked). |
| `Logo.tsx` | Server | `LogoMark` (the small rounded-badge icon in the header) and `Track` (the decorative running-track SVG used on Home/Login/Signup/Confirmed/Live pages). |
| `NewPostForm.tsx` | Client | The `/new` form. Local state for the 3 lane buttons (skill/activity/request), up to 3 datetime inputs, a capacity stepper, price, and a live preview card. Submits via the `action` prop passed in from the page (`createPost`). |
| `JoinMessage.tsx` | Client | A textarea plus clickable "starter" chips (from `fallbackStarters`) that append themselves into the textarea — used on the join page, separate from the AI-backed starters in `ChatThread`. |
| `ChatThread.tsx` | Client | Subscribes to a Supabase realtime channel (`postgres_changes` on `messages`, filtered to the current `post_id`) so new messages appear without a refresh. Also fetches `/api/starters` on mount for the AI-generated chips. Sends messages by inserting directly into `messages` from the browser client (RLS enforces who's allowed to). |
| `SubmitButton.tsx` | Client (`useFormStatus`) | A generic submit button that disables itself and swaps its label while its parent `<form>` is pending — reused by nearly every form in the app instead of each page managing its own pending state. |

---

## app/ — Pages and Routes

All pages are Server Components (`async function ...`) unless noted, and most set `export const dynamic = "force-dynamic"` so Supabase data is always read fresh rather than cached at build time.

- **`layout.tsx`** — root layout. Loads the two Google fonts via `next/font/google`, wraps every page in `<Header/>` … `<TabBar/>`, sets the page `<title>`/`<meta>`.
- **`page.tsx` (`/`)** — hero (different copy signed-in vs. signed-out), the 3 colored "lane" cards linking to `/new?kind=...`, an 8-post "Open this week" feed, an "upcoming" sidebar (signed-in users see their next 3 joined events, pulled from `participants`), a safety-tip box, and the 4-step "how it works" strip.
- **`browse/page.tsx` (`/browse`)** — builds a Supabase query from `searchParams` (`q` text search across title/category/description/location, `type`, `open=1`, `free=1`), renders results as `PostCard`s, and renders the active filters as chip links (`href()` helper merges the new filter into the existing query string).
- **`new/page.tsx` (`/new`)** — thin wrapper: reads `?kind=` from the URL to pre-select a lane, renders `<NewPostForm action={createPost} .../>`.
- **`posts/[id]/page.tsx`** — the big one. Loads the post, its `post_times`, questions (with asker names), and host ratings in parallel; computes `avg` rating, `isHost`, `joined`, `booked`. Renders differently depending on viewer role: host sees "Open chat"/"Rate participants"; a joined user sees "See your plan"/"Leave this post"; everyone else sees a time-picker + "Join this test run" form (a plain `<form method="get">` to `/posts/[id]/join`, not a Server Action, since it's just navigating with the chosen time in the query string).
- **`posts/[id]/join/page.tsx`** — shows the chosen time, a waiver checkbox (only if `requires_waiver`), and the `JoinMessage` starter-chip textarea. Submits to the `joinPost` Server Action.
- **`posts/[id]/confirmed/page.tsx`** — "You're in" screen: add-to-calendar (`.ics`) and Google Maps directions links, a "what happens next" list, and a card linking into the chat.
- **`posts/[id]/live/page.tsx`** — shown right after `createPost` redirects here. Re-renders the new post as a `PostCard` so the host can see exactly what others will see.
- **`messages/page.tsx` (`/messages`)** — lists every post the user hosts or has joined as a chat-list entry (no last-message preview, just the post title + "Group"/"1:1 chat" label).
- **`messages/[postId]/page.tsx`** — verifies the signed-in user is actually a member (host or participant) via a `memberIds` check, loads the last 200 messages and the names of everyone in the thread, then renders `<ChatThread/>`.
- **`calendar/page.tsx` (`/calendar`)** — two parallel queries (events you joined, events you host), merged and sorted by `starts_at`, split into "upcoming" (now − 1hr onward) and "past". Upcoming rows link to chat + `.ics`; past rows link to `/rate/[postId]`.
- **`rate/[postId]/page.tsx`** — figures out who you're allowed to rate (the host rates every participant; a participant rates only the host), skips anyone you've already rated, and renders one rating form per remaining person (showed-up radio, 1–5 stars, tag checkboxes styled as pills, optional comment).
- **`profile/page.tsx` (`/profile`)** — your info + sign-out button, a 3-stat row (test runs / average rating / no-shows), your own posts, posts you've joined, and reviews received.
- **`login/page.tsx`, `signup/page.tsx`** — split-screen layout (teal promo panel + form), submit to the `signIn`/`signUp` Server Actions.

---

## api/ — Route Handlers

### `api/starters/route.ts`
`GET` — reads `kind`/`title`/`category` from the query string (defaults `kind` to `"activity"` if it's not one of the three valid values), calls `getStarters()`, returns `{ starters: string[] }` as JSON. Used by `ChatThread.tsx`'s `fetch`.

### `api/ics/[postId]/route.ts`
`GET` — requires a signed-in user who is either the host or a participant of the post (otherwise 401/404). Finds the relevant start time (the participant's chosen time, or the earliest `post_times` entry if they're the host), computes an end time from `duration_min`, and hand-builds an RFC 5545 `VCALENDAR`/`VEVENT` text block (escaping `;`, `,`, backslashes, and newlines per the spec) — no calendar library involved. Returns it with `Content-Type: text/calendar` and a `Content-Disposition` that names the download `test-run-<first 8 chars of post id>.ics`.

---

## supabase/schema.sql — Database

Run once in the Supabase SQL editor; creates everything below in one pass.

**Tables:** `profiles`, `posts`, `post_times`, `participants`, `messages`, `questions`, `ratings`, `reports` — see the [Data Model table in README.md](README.md#data-model) for columns.

**Trigger:** `handle_new_user()` fires `after insert on auth.users` and creates the matching `profiles` row, reading `full_name` out of the signup's user metadata.

**Functions (both `security definer`, meaning they run with the privileges of the function owner, not the calling user — necessary because they need to bypass RLS to do their job safely):**
- `is_post_member(p_post)` — returns `true` if the current user hosts or has joined the given post. Written as a function specifically so the `messages` RLS policy can call it without triggering a recursive RLS check on `participants`.
- `join_post(p_post, p_time, p_message, p_waiver)` — the atomic join: locks the post row (`for update`), then checks in order — signed in, not your own post, not already joined, capacity not full, waiver acknowledged if required, chosen time actually belongs to this post — raising a SQL exception (which `actions.ts` surfaces as the redirect error message) on the first failure. If everything passes, inserts the `participants` row and increments `spots_filled` in the same transaction, so two people joining the last spot at the same instant can't both succeed.
- `leave_post(p_post)` — deletes the caller's `participants` row and decrements `spots_filled` (floored at 0) only if a row was actually deleted.

**Row Level Security:** enabled on every table. The notable design choice is that `participants` has **no insert policy at all** — the only way a row gets created is through `join_post()`, which runs as `security definer` and does its own validation, so there's no path in the app (or in the Supabase client directly) to insert a participant row without going through the capacity/waiver checks.

**Realtime:** `messages` and `posts` are added to the `supabase_realtime` publication, which is what lets `ChatThread.tsx` subscribe to live inserts.
