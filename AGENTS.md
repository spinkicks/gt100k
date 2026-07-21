# AGENTS.md — GT100K Team Golden Rules (ALL agents + humans MUST follow)

> Single source of truth for how agents (Claude Code, Codex, Cursor) and humans work in this repo.
> `CLAUDE.md` and tool configs point here. If any tool-specific file disagrees with this, **this wins** —
> **except** that `.specify/memory/constitution.md` and `GOVERNANCE.md` (G-class rights/safety) supersede
> this file; AGENTS.md governs workflow only (authority order in the Constitution's Governance section).

## Project
- **GT100K** — `docs/prd/PRD.md` is the canonical product spec (see `README.md` for the full doc map); `docs/research/` + `docs/proposals/` hold background.
- **Current stage: active development.** PRD-driven implementation is underway; code ships behind the workflow below. `docs/prd/` remains the canonical spec.
- **New here?** Start with `docs/onboarding/` (`README.md` + `teammate-setup.sh`). It sets up the **same factory the operator runs**: Claude Code (`claude-opus-4-8[1m]`) **+** Codex (`gpt-5.6-sol`), 3 MCPs (context7, aws-knowledge, terraform), context hygiene (auto-compaction ~40%), the loop harness, and the consensus + adversarial-QA review gate. One shared pipeline: everyone's work flows through the same gates below.

## Branching
- Trunk-based. Branch from latest `origin/main`. Name: `dev/<lane>/<slug>` (e.g. `dev/prd/citation-fixes`). Branches live < 1 day.
- Squash-merge only; linear history. **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:` …). PR body references issues: `Closes #<id>`.

## Lanes (CODEOWNERS)
- Only edit files your operator owns in `.github/CODEOWNERS`. Prefer a **NEW file** over editing a shared one.
- NEVER create barrel `index.ts` re-exports, a central route array, or edit an applied migration / `*.tfstate`.

## Worktrees & runtime
- One worktree per agent. NEVER open another dev's worktree. `.env.local` is **COPIED**, never symlinked.
- Runtime is **macOS**: the agent CLIs (`claude` + `codex`), the loop harness, and the review gate all run natively. Repos live under `~/code/...`. (The Slack bridge / decision-escalation daemon is a WSL + systemd service the **operator hosts**; teammates use the shared Slack, not their own bridge.)
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
- Matches the relevant `docs/prd/PRD.md` section. Tests + docs updated. CI green. Reviewed (human or cross-model). Conventional Commit + `Closes #<id>`.
