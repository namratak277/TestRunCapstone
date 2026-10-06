# TestRunCapstone
Creating a website for people who want to turn their hobbies into a small business or get services for cheaper by newly learning businesses.

---

## Table of Contents
1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [Concept and Positioning](#concept-and-positioning)
4. [Core Features](#core-features)
5. [Post Types](#post-types)
6. [User Flow](#user-flow)
7. [Trust and Safety](#trust-and-safety)
8. [Payments](#payments)
9. [Competitive Landscape](#competitive-landscape)
10. [Academic Framing](#academic-framing)
11. [Business Model](#business-model)
12. [Tech Stack](#tech-stack)
13. [Architecture](#architecture)
14. [Data Model](#data-model)
15. [Build Order](#build-order)
16. [MVP Scope and Roadmap](#mvp-scope-and-roadmap)
17. [Brand](#brand)
18. [Getting Started](#getting-started)
19. [Project Conventions](#project-conventions)
20. [Open Decisions](#open-decisions)

---

## Overview

Test Run is a web app connecting people around a specific activity or service, not portfolio/user. Because the shared task is already defined, users have something to talk about from the first message, which removes the awkward "getting to know you" phase.

The project merges two ideas:
- **Business-oriented idea:** people post a service or skill they offer or need, sometimes with a price attached.
- **Professor's idea:** a connection-building app where a pre-defined activity acts as the icebreaker.

## The Problem

- Meeting new people around a photo or bio is awkward. Meeting them around a shared activity is not.
- Students in hands-on programs (cosmetology, nail tech, barbering, massage therapy, esthetics, personal training, photography, tutoring, UX) often need real people to practice on, sometimes for required certification hours, and have no dedicated place to find them.
- People who want to do something (see a movie, go hiking) often lack someone to go with.

## Concept and Positioning

Test Run leads with the **practice-partner** use case and treats general social activities as a second category.

Working positioning statement:

> Test Run is a practice-partner network where students learning a hands-on skill find real people to work with, and where any shared activity, paid or free, becomes the reason to meet.

**Name meaning:** "Test run" works literally (a practice run for someone learning a skill) and figuratively (trying out a plan or person before committing).

## Core Features

- Users create posts for an activity or a service.
- Others browse, join, or ask questions before joining.
- Each post shows a live count of how many people have connected.
- When capacity is reached the post shows as **Booked**; otherwise it stays **Open**.
- Once matched, the meeting is scheduled and can be added to each person's calendar.
- If more than one person joins, a group chat is created automatically so everyone can talk before the event.
- AI-generated conversation starters tied to the specific activity or skill.
- Post-event ratings and reviews.

## Post Types

**Service post (paid or low-cost skill practice)**
> "I'm a learning nail tech who wants to practice on someone. Low price for nails. [Name], [meeting location], [time options]."

Fields: title, description, price, location, time slot options, capacity, liability acknowledgment.

**Activity post (social, usually free)**
> "I want to go watch Spider-Man on [date]. Looking for someone to join."

Fields: title, description, location, date/time, capacity.

Both types share a `type` field in the data model but need different fields (price and time slots versus date and capacity).

## User Flow

1. Sign up, verify email, and complete a basic profile.
2. Pick a few interests during onboarding.
3. Browse the feed (filter by category, location radius, and date) or create a post.
4. Join a post or ask the poster a question.
5. Poster confirms; a group chat opens if capacity is greater than one (1:1 posts go straight to direct chat).
6. Event is scheduled and exported to the calendar.
7. After the event, both sides leave a rating and optional review.
8. Post auto-archives after the event date.

## Trust and Safety

Meeting strangers is the biggest risk area, so it is treated as a core feature.

- Email and phone verification, real name, and profile photo required before posting or joining.
- Report and block on every post, profile, and chat, with an admin review queue.
- Liability waiver checkbox (timestamped) before booking confirms on skill-practice posts.
- Safety banner suggesting public meeting spots for first meetups.
- No-show flagging that quietly affects a user's visibility.
- Ratings and reviews feed a trust score on profiles.
- Stretch goal: third-party ID verification.

## Payments

- **MVP:** no in-app payments. Users settle up in person (cash, Venmo, etc.). The app only facilitates the connection. This removes major liability and compliance burden for a student project.
- **v2 option:** Stripe Connect with a small platform fee and funds held until the service is marked complete.

## Competitive Landscape

The general "join an activity, meet people" space is crowded. Apps reviewed during research include Plus 1, PlusOne, PlusOnes, Sidekick, Loopa, Meet5, and Meetup. Most are purely social.

**Differentiators for Test Run:**
- Skill-practice marketplace combined with social activity-joining (the competitors reviewed are purely social).
- Focus on students who need practice hours and clients.
- Activity-specific AI conversation starters.
- Campus-first launch (UNCG) for a smaller trust surface.
- Possible future feature: verified practice-hour logging toward program requirements.

## Academic Framing

The capstone write-up can be grounded in Santa Fe Institute style complexity and network science:

- **Weak ties and bridging capital (Granovetter):** the product connects people who do not already know each other through a shared activity.
- **Homophily versus bridging:** the shared activity, not shared identity, is the bridge.
- **Emergent networks:** simple local rules (post, join, chat, meet) produce a growing social network over time.

## Business Model

Options under consideration (pick one for the capstone business section):
1. **Transaction fee** on paid service posts only; free for social activities.
2. **Freemium:** free posting and joining, paid tier for boosted visibility or unlimited posts.
3. **Flat marketplace fee** per successful booked connection.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React with Next.js |
| Backend, database, auth, realtime, storage | Supabase (Postgres underneath) |
| Calendar (v1) | `.ics` file generation |
| Calendar (v2) | Google Calendar API |
| Hosting | Vercel (frontend); Supabase hosted backend |
| Version control | GitHub |

**Why Supabase:** built-in auth, realtime subscriptions (chat, live "spots filled" counts), and file storage let effort go to product logic instead of plumbing, while the Postgres database still demonstrates real relational modeling.

## Architecture

Three layers:
- **Frontend:** feed, post detail, profile, chat, calendar view.
- **Backend/API:** auth, capacity and booking logic, matching rules (handled largely by Supabase plus database rules).
- **Database and realtime:** stores users, posts, connections, and messages; pushes live updates.

**Row Level Security (RLS):** rules attached to each table so the database itself enforces who can read, insert, update, and delete. For example, only a post's creator can update it, and only members of a chat can read its messages. Plan RLS alongside the schema.

**API keys:** the public (anon) key is safe in the frontend and is limited by RLS. The service-role key bypasses all security and must never be exposed or committed.

## Data Model

Entities (fields to be finalized):
- **User:** profile info, verification status, trust score
- **Post:** type (service/activity), title, description, location, date/time or time options, capacity, price (nullable), status (open/booked/archived)
- **Connection:** links a User to a Post they joined
- **Chat / Message:** tied to a Post once two or more people have joined
- **Event:** the finalized scheduled meeting (fields on Post, or a separate table if history is needed)
- **Review:** post-event rating tied to a completed Post and the user being reviewed

Key relationships: one Post has many Connections; one Post has one Chat; one Review links a completed Post to a reviewed User.

## Build Order

Build in dependency order so each piece is testable before the next depends on it:
1. Auth (sign up, log in, log out)
2. Profile (name, photo, verified status)
3. Post creation and feed display
4. Join/connection logic (capacity and booked state)
5. Chat
6. Calendar export
7. Ratings and reviews

**Milestone zero:** frontend connects to Supabase and confirms it.
**First coding session goal:** a user signs up, logs in, and sees a welcome message pulled from the database.

## MVP Scope and Roadmap

**MVP (v1)**
- Post creation for both types with location, time, and capacity
- Browse and join feed with connection counter and open/booked status
- Basic 1:1 and group chat
- `.ics` calendar export
- Simple profile with email-verified badge

**v2**
- AI conversation starters
- Ratings and reviews
- In-app payments (Stripe Connect)
- Google Calendar API integration
- Interest-based matching
- Third-party ID verification
- Practice-hour tracking

## Brand

**Name:** Test Run

**Palette**
| Role | Hex |
|---|---|
| Primary (teal) | `#2A9D8F` |
| Accent (coral) | `#F4A261` |
| Dark / text (navy) | `#264653` |
| Background | `#FDFCF9` |
| Charcoal | `#2B2B2B` |

**Logo direction:** the two-node mark (two connected dots) is the most flexible primary mark. A pin-plus-chat mark works as a secondary icon for meetup posts.

**Tagline ideas:** "Practice makes people." / "Find someone to practice with." / "Every skill needs a test run." (placeholders to refine)

## Getting Started

*Not yet implemented. Planned setup:*

1. Create the Supabase project (free tier) and note the project URL and anon key.
2. Scaffold the app with `create-next-app`.
3. Install the Supabase client library.
4. Create `.env.local` and add it to `.gitignore` immediately:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Verify the frontend can reach Supabase.
6. Connect the GitHub repo to Vercel so every push to main deploys.

## Project Conventions

- Commit early and often with descriptive messages.
- One feature branch per major piece (auth, posts, chat, etc.).
- Tag milestones (for example, `v0.1-auth`).
- Keep UI components, page-level views, and Supabase queries in separate places.
- Keep a running list of known bugs and limitations.
- Manually test capacity edge cases (exactly at capacity, simultaneous joins).

## Open Decisions

- [ ] Business model (transaction fee, freemium, or flat fee)
- [ ] Final payment handling for v2
- [ ] Final database schema and RLS rules
- [ ] Domain and social handle availability for "Test Run"
- [ ] Final logo and tagline
- [ ] Campus pilot scope (UNCG only for the demo)
- [ ] Trademark and naming check before any public launch