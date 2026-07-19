# GT100K — Teammate Onboarding

Get set up to work on GT100K with the same agentic workflow (macOS + Claude Code).

## Fastest path
Hand `teammate-setup.sh` to your Claude Code agent:

> "Run `docs/onboarding/teammate-setup.sh` step by step. Stop and ask me if any step errors. For the TrueFoundry token and GitHub login, prompt me — don't guess."

Or run it yourself: `bash docs/onboarding/teammate-setup.sh`

## What it installs
- **Claude Code** + **superpowers** (methodology), **impeccable** (design enforcer), a **curated skill set**
- **MCP server**: context7 (live docs) — the only one we run (2026-07 audit; native reasoning/fetch + `gh` cover the rest)
- **uv**, **gh**, **node**
- Clones `spinkicks/gt100k` into `~/code`

## Secrets you provide (never commit)
- **TrueFoundry token** → `~/.claude/settings.json` env (`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`). Use *your own* token.
- **GitHub** → `gh auth login`.

## The rules
Read **`AGENTS.md`** at the repo root — it's the single source of truth (branching, PR flow, lanes). Everything ships via **branch → PR → CI → squash-merge**. Never push to `main`.

## Daily flow
1. `cd ~/code/gt100k`
2. `claude` (or run `/speckit-specify` to turn PRD sections into tasks)
3. Work on a branch → open a PR → CI must pass → merge.
