# AGENTS.md — GT100K Team Golden Rules (ALL agents + humans MUST follow)

> Single source of truth for how agents (Claude Code, Codex, Cursor) and humans work in this repo.
> `CLAUDE.md` and tool configs point here. If any tool-specific file disagrees with this, **this wins** —
> **except** that `.specify/memory/constitution.md` and `GOVERNANCE.md` (G-class rights/safety) supersede
> this file; AGENTS.md governs workflow only (authority order in the Constitution's Governance section).

## Project
- **GT100K** — `PRD.md` is the canonical product spec; `RESEARCH-*.md` + `gtBrainlift.md` + `proposals/` hold background.
- **Current stage: pre-code / PRD.** The repo is docs-only today. Code lands behind the workflow below as implementation begins.

## Branching
- Trunk-based. Branch from latest `origin/main`. Name: `dev/<lane>/<slug>` (e.g. `dev/prd/citation-fixes`). Branches live < 1 day.
- Squash-merge only; linear history. **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:` …). PR body references issues: `Closes #<id>`.

## Lanes (CODEOWNERS)
- Only edit files your operator owns in `.github/CODEOWNERS`. Prefer a **NEW file** over editing a shared one.
- NEVER create barrel `index.ts` re-exports, a central route array, or edit an applied migration / `*.tfstate`.

## Worktrees & runtime
- One worktree per agent. NEVER open another dev's worktree. `.env.local` is **COPIED**, never symlinked.
- Repos live on **ext4** (`~/code/...`), never `/mnt/*`. Run the agent CLI fleet in **WSL2**.
- **pnpm** (not npm/yarn) for JS/TS. **uv** for Python.

## Merging & pushing
- All changes via **PR → merge queue**. **No direct pushes to `main`.**
- Force-push ONLY your own branch, ONLY `--force-with-lease --force-if-includes`. NEVER `--no-verify`. NEVER bypass required checks.

## Before opening a PR
- Rebase on `origin/main`. Keep PRs **< ~400 lines**. CI green. Address the AI reviewer's comments.

## Security (this repo is PUBLIC)
- Never commit `.env*`, credentials, tokens, or anything under `secrets/`. `gitleaks` runs in CI.
- No machine paths, proxy URLs, or internal identifiers in committed files.
- Child-data / PII governance applies to product code per the PRD — never put real user data in fixtures.

## Definition of Done
- Matches the relevant `PRD.md` section. Tests + docs updated. CI green. Reviewed (human or cross-model). Conventional Commit + `Closes #<id>`.
