# Error: GitHub push rejected, file over 100 MB (GH001)

**Date:** 2026-10-20
**Command:** `git push origin main`

## Error message
```
remote: error: GH001: Large files detected.
 ! [remote rejected] main -> main (pre-receive hook declined)
error: failed to push some refs
```

## Cause
- GitHub blocks any push that contains a file over **100 MB**.
- Commit `cbf694a` ("md files added") accidentally included the whole `node_modules/` folder (~3,700 files), including:
  `node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` (**130 MB**)
- A later commit (`e050935`) deleted `node_modules` and added `.gitignore`, but **git pushes the full history**, so the big file was still inside the older commit.

## Fix
Rewrite the unpushed commits to strip `node_modules` from history. This is safe because these commits were never on GitHub.
```bash
git branch backup-before-cleanup        # safety copy
git filter-branch --index-filter "git rm -r --cached --ignore-unmatch -q node_modules" -- origin/main..main
git push origin main
git branch -D backup-before-cleanup     # after the push works
```
Git LFS is **not** the right fix: `node_modules` should never be committed at all.

## Lessons
- Add `.gitignore` (with `node_modules`, `.next`, `.env.local`) **before** the first commit.
- Deleting a file in a new commit doesn't remove it from history.
- Check what's being committed with `git status` before `git add .`.
- `node_modules` can always be recreated with `npm install`, so it never belongs in git.
