# Error Notes

A log of the errors, warnings and "how do I…?" questions hit while building Test Run: what happened, why, and how it was solved.

- What each file does → [code.md](code.md)
- Setup and run steps → [README.md → Getting Started](README.md#getting-started)

| # | Issue | Type | Status |
|---|---|---|---|
| 1 | [Files lost when moving out of `test-run/`](#1-files-lost-when-moving-out-of-test-run) | Project setup | Fixed |
| 2 | [`Cannot find module './globals.css'` in the editor](#2-cannot-find-module-globalscss-in-the-editor) | Editor error | Harmless |
| 3 | [Can pages be named `confirmed.tsx` instead of `confirmed/page.tsx`?](#3-can-pages-be-named-confirmedtsx-instead-of-confirmedpagetsx) | Question | Answered |
| 4 | [GitHub push rejected: file over 100 MB (GH001)](#4-github-push-rejected-file-over-100-mb-gh001) | Git error | Fixed |
| 5 | [Is the app ready to run?](#5-is-the-app-ready-to-run) | Question | Answered |
| 6 | [Where is the "Confirm email" setting?](#6-where-is-the-confirm-email-setting) | Question | Answered |
| 7 | [Where do the Supabase API keys come from?](#7-where-do-the-supabase-api-keys-come-from) | Question | Answered |
| 8 | [Webpack "Serializing big strings" warning](#8-webpack-serializing-big-strings-warning) | Warning | Harmless |
| 9 | [Do I have to run `npm run dev` every time?](#9-do-i-have-to-run-npm-run-dev-every-time) | Question | Answered |

---

## Project setup

### 1. Files lost when moving out of `test-run/`
**Date:** 2026-10-20

**What happened:** The app was in a `test-run/` sub-folder, with the docs at the root. When everything was moved up to the root, `test-run/README.md` (the setup steps) was deleted instead of moved, and the duplicate `test-run/.gitignore` went with it.

**Fix:** Recovered the setup steps from git history (`git show 47f90f3:test-run/README.md`) and merged them into the main README. No code paths needed changing, because imports use the `@/` shortcut, which is relative to `src/`.

**Lesson:** Before deleting a folder after a move, check each file it held. Anything committed can be recovered with `git show <commit>:<path>`.

### 2. `Cannot find module './globals.css'` in the editor
**Date:** 2026-10-20

**What happened:** VS Code showed a red error on `import "./globals.css"` in `layout.tsx` after the move.

**Cause:** `next-env.d.ts` was missing. Next.js generates it automatically, and it's gitignored, so it didn't come along with the move. That file is what tells TypeScript that `.css` imports are allowed.

**Fix:** Nothing to change in the code. Running `npm run dev` once regenerates the file. `npx tsc --noEmit` confirmed 0 real errors.

### 3. Can pages be named `confirmed.tsx` instead of `confirmed/page.tsx`?
**Date:** 2026-10-20

**Answer:** No. The Next.js App Router (`src/app/`) requires every page to be a file named exactly `page.tsx`, and the folder name becomes the URL. A renamed file stops being a page and returns a 404. The older Pages Router allows `confirmed.tsx`, but switching would mean rewriting the server actions, data loading and layout.

**Fix for the real annoyance** (every tab labeled `page.tsx`): added [.vscode/settings.json](.vscode/settings.json) with `workbench.editor.customLabels.patterns`, so tabs show the folder name instead (e.g. `[id]/confirmed`). In Ctrl+P, typing `confirmed page` also finds the file.

---

## Git and GitHub

### 4. GitHub push rejected: file over 100 MB (GH001)
**Date:** 2026-10-20
**Command:** `git push origin main`

```
remote: error: GH001: Large files detected.
 ! [remote rejected] main -> main (pre-receive hook declined)
error: failed to push some refs
```

**Cause:**
- GitHub blocks any push that contains a file over **100 MB**.
- Commit `cbf694a` ("md files added") accidentally included the whole `node_modules/` folder (~3,700 files), including `node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` (**130 MB**).
- A later commit (`e050935`) deleted `node_modules` and added `.gitignore`, but **git pushes the full history**, so the big file was still inside the older commit.

**Fix:** Rewrote the unpushed commits to strip `node_modules` from history. This was safe because those commits had never reached GitHub.
```bash
git branch backup-before-cleanup        # safety copy
git filter-branch --index-filter "git rm -r --cached --ignore-unmatch -q node_modules" -- origin/main..main
git push origin main
git branch -D backup-before-cleanup     # after the push works
```
Git LFS is **not** the right fix: `node_modules` should never be committed at all.

**Lessons:**
- Add `.gitignore` (with `node_modules`, `.next`, `.env.local`) **before** the first commit.
- Deleting a file in a new commit doesn't remove it from history.
- Run `git status` before `git add .` to see what's about to be committed.
- `node_modules` can always be recreated with `npm install`, so it never belongs in git.

---

## Supabase setup

### 5. Is the app ready to run?
**Date:** 2026-10-20

**Answer:** The code was ready (packages installed, type check passing, Node v22), but the app would crash on the first page with `supabaseUrl is required`.

**Cause:** There was no `.env.local` file, only the `.env.example` template, so the app had no database address or key.

**Fix:** Create a Supabase project, run `schema.sql` once, copy `.env.example` to `.env.local`, fill in the keys (see #7), then `npm run dev`. Full steps are in the [README](README.md#getting-started).

**Watch out:** Running `schema.sql` a second time fails with "already exists", because the tables are already there.

### 6. Where is the "Confirm email" setting?
**Date:** 2026-10-20

**Question:** The Email provider panel only shows **Enable Email provider** and **Secure email change**. Which one gets turned off?

**Answer:** Neither.
- **Enable Email provider** must stay **on**, or sign-up and login stop working.
- **Secure email change** only affects changing an email address later.

**Where it actually is:** Supabase moved it. Go to **Authentication → Sign In / Providers → User Signups** section → turn off **Confirm email** → Save. Keep **Allow new users to sign up** on.

**Why turn it off:** so test accounts log in straight away instead of waiting for a confirmation email. This step is optional.

### 7. Where do the Supabase API keys come from?
**Date:** 2026-10-20

**Answer:** Supabase creates them automatically for every project; you copy them into `.env.local`. (What each variable is for is described in [code.md → Configuration Files](code.md#configuration-files).)

| Value | Where to find it | Looks like |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Connect** button at the top of the dashboard, or **Project Settings → Data API → Project URL** | `https://abcdefghijklm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings → API Keys → Legacy API Keys → `anon` `public`** | `eyJhbGci...` |

**Format:** `NAME=value`, with no quotes and no spaces around `=`. Restart `npm run dev` after saving.

**⚠️ Never use the `service_role` / secret key (`sb_secret_...`).** It bypasses every security rule in `schema.sql`, and anything named `NEXT_PUBLIC_...` is sent to every visitor's browser. The anon key is safe to expose because those rules limit what it can do.

---

## Running the app locally

### 8. Webpack "Serializing big strings" warning
**Date:** 2026-10-20

```
<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (268kiB) impacts deserialization performance
```

**Answer:** Harmless; nothing to fix. `<w>` means warning, not error. Next.js caches build pieces in `.next/cache` so restarts are faster, and webpack is noting that some cached pieces are large text strings that reload a few milliseconds slower. It comes from Next.js 14 internals, not from our code.

**How to tell a real problem:** red text, `Error:`, `Failed to compile`, or an error page in the browser. `✓ Ready` / `✓ Compiled` means everything is fine.

### 9. Do I have to run `npm run dev` every time?
**Date:** 2026-10-20

**Answer:** Once per work session, not after every change. While it's running, saving a file updates the browser automatically (hot reload).

**Restart it when:**
- the terminal was closed, or Ctrl+C was pressed
- `.env.local` changed (keys are only read at startup)
- a new package was installed with `npm install`
- it gets stuck on an error that saving again doesn't clear

`npm run dev` is only for local development. Once deployed to Vercel, the app runs online without your computer.
