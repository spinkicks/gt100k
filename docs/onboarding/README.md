# GT100K — Teammate Onboarding

Get set up to run the **same** agent factory the operator runs: same two models,
same MCPs, same context-hygiene, same review gate, same branch/PR/CI rules. The
goal is one shared pipeline — your work and the operator's flow through the same
gates, so we stay tightly integrated.

> **If you are an AI agent running this setup for your operator:** work top-to-bottom.
> Run `docs/onboarding/teammate-setup.sh` step by step and verify each step before
> continuing. **Stop and ask the human** for the two secrets — the TrueFoundry token
> and the GitHub login — never guess or invent them. Do not push to `main`. When
> finished, run the checks in §9 and report exactly what passed and what failed.

## 0. Platform — you're on macOS
- You run everything on **macOS**. The **loop harness + review pipeline** are plain
  `bash` + `node` + `gh` + `codex`/`claude` and run natively on macOS.
- The **Slack bridge / decision escalation** is a WSL + systemd daemon the **operator
  hosts** — you do **not** run your own. You're in the shared Slack workspace, get
  pinged there, and coordinate through GitHub PRs + Slack.
- **How we divide work:** split each effort into independent slices — one for you, one
  for the operator — and each works their slice on `dev/<lane>/<slug>` branches → PRs →
  CI → squash-merge into the same repos. Split by module/area so you don't edit the same
  files (that's what keeps merges clean). Same models, MCPs, hygiene, and review gate on
  both machines, so the two halves fit together.

## 1. Fastest path (hand this to an agent)
Give your Claude Code (or Codex) agent this one line:

> "Read `docs/onboarding/README.md` and set me up: run `docs/onboarding/teammate-setup.sh` step by step, verify each step, and stop to ask me for the TrueFoundry token and the GitHub login. Then run the §9 checks and report results."

Or run it yourself: `bash docs/onboarding/teammate-setup.sh`

## 2. What it installs
- **Claude Code** (`claude-opus-4-8[1m]`, fast mode) **+ Codex** (`gpt-5.6-sol`) — the same agents the operator and the loop use.
- **superpowers** (methodology), **impeccable** (design), a curated skill set.
- **MCP servers (all three)**: `context7` (live docs), `aws-knowledge` (AWS docs), `terraform` (HashiCorp registry).
- **Context hygiene**: Claude auto-compaction at ~40% of its window (Codex uses its default).
- **uv**, **gh**, **node**.
- Clones **`spinkicks/gt100k`** and **`spinkicks/gt100k-factory`** into `~/code`.

## 3. Secrets you provide (never commit)
- **TrueFoundry token** (your OWN) → Claude `~/.claude/settings.json` env (`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`) **and** Codex (`TFY_API_KEY` in your shell env).
- **GitHub** → `gh auth login`.

## 4. The rules (single source of truth)
Read **`AGENTS.md`** at the gt100k root — branching (`dev/<lane>/<slug>`), PR flow, lanes. Everything ships via **branch → PR → CI → squash-merge**; never push to `main`. Same rules for both of us — that's what keeps us integrated.

## 5. Daily flow (interactive)
1. `cd ~/code/gt100k`
2. `claude` (or `/speckit-specify` to turn PRD sections into tasks) — or `codex` for the Codex agent
3. Work on a `dev/<lane>/<slug>` branch → open a PR → CI must pass → squash-merge.

## 6. Running the factory (autonomous loop)
The harness lives in `~/code/gt100k-factory/harness`. To autonomously build a loop-ready repo:
```bash
~/code/gt100k-factory/harness/run-loop.sh ~/code/<repo> --check     # verify plumbing, no cost
nohup ~/code/gt100k-factory/harness/run-loop.sh ~/code/<repo> \
  > ~/.local/state/gt100k-factory/loop/<repo>.out 2>&1 &            # run it
```
- Works on `loop/<repo>`, commits each green increment, opens a PR — never touches `main`.
- Review a loop PR with the consensus + adversarial-QA gate (use `--recommend` first to watch it):
```bash
~/code/gt100k-factory/harness/review-pr.sh spinkicks/<repo> loop/<repo> --recommend
```
- Decisions the loop raises are DMed to the **operator** (shared Slack) — coordinate answers there.
- Parallel-safe: run one loop per repo; all state namespaces by repo. See `gt100k-factory/harness/README.md`.

## 7. Context hygiene (auto-compaction)
Claude compacts at ~40% of its 1M window to avoid context rot (Codex is left at its default). The setup script applies it; to (re)apply on any machine:
```bash
bash ~/code/gt100k-factory/harness/setup-context-hygiene.sh
```
Details + the headless gotcha: `gt100k-factory/docs/context-hygiene.md`.

## 8. Staying tightly integrated — the checklist
- Same two models, same 3 MCPs, same context-hygiene, same review gate, same `dev/<lane>/<slug>` → PR → CI → squash rules.
- **One pipeline:** all work becomes PRs on `spinkicks/*`; loop PRs go through the consensus + adversarial-QA review before merge.
- **Shared Slack:** the operator hosts the bridge and receives decision DMs (color-coded by severity). Raise blockers there; don't spin up a second bridge.
- **Keep `gt100k-factory` pulled** — the harness, review pipeline, skills, and hygiene policy evolve there.

## 9. Verify (agent: run these, report pass/fail)
```bash
claude -p 'pong'                          # Claude reachable via TrueFoundry
codex --version                           # Codex installed
claude mcp list                           # expect context7, aws-knowledge, terraform = Connected
gh auth status                            # GitHub authed
ls ~/code/gt100k ~/code/gt100k-factory    # both repos cloned
grep -q CLAUDE_AUTOCOMPACT_PCT_OVERRIDE ~/.claude/settings.json && echo "hygiene set"
~/code/gt100k-factory/harness/run-loop.sh ~/code/gt100k --check   # harness plumbing (optional)
```
Report which checks passed. Then read `~/code/gt100k/AGENTS.md` before doing any work.
