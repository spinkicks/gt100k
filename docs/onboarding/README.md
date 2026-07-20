# GT100K — Teammate Onboarding

Get set up to run the **same** agent factory the operator runs: same two models,
same MCPs, same context-hygiene, same review gate, same branch/PR/CI rules. The
goal is one shared pipeline — your work and the operator's flow through the same
gates, so we stay tightly integrated.

## 0. Platform
- The **loop harness + review pipeline** are plain `bash` + `node` + `gh` +
  `codex`/`claude` — they run on macOS or Linux/WSL.
- The **Slack bridge / decision escalation** is a WSL + systemd daemon the
  **operator hosts**. You do **not** run your own — you're in the shared Slack
  workspace, get pinged there, and coordinate through GitHub PRs + Slack.
- On Windows, work inside **WSL2 (Ubuntu)** to match the operator exactly.

## 1. Fastest path
Hand `teammate-setup.sh` to your Claude Code agent:

> "Run `docs/onboarding/teammate-setup.sh` step by step. Stop and ask me if any step errors. For the TrueFoundry token and GitHub login, prompt me — don't guess."

Or run it yourself: `bash docs/onboarding/teammate-setup.sh`

## 2. What it installs
- **Claude Code** (`claude-opus-4-8[1m]`, fast mode) **+ Codex** (`gpt-5.6-sol`) — the same agents the operator and the loop use.
- **superpowers** (methodology), **impeccable** (design), a curated skill set.
- **MCP servers (all three)**: `context7` (live docs), `aws-knowledge` (AWS docs), `terraform` (HashiCorp registry).
- **Context hygiene**: auto-compaction at ~40% of the window on every agent.
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
Every agent compacts at ~40% of its window to avoid context rot. The setup script applies it; to (re)apply on any machine:
```bash
bash ~/code/gt100k-factory/harness/setup-context-hygiene.sh
```
Details + the headless gotcha: `gt100k-factory/docs/context-hygiene.md`.

## 8. Staying tightly integrated — the checklist
- Same two models, same 3 MCPs, same context-hygiene, same review gate, same `dev/<lane>/<slug>` → PR → CI → squash rules.
- **One pipeline:** all work becomes PRs on `spinkicks/*`; loop PRs go through the consensus + adversarial-QA review before merge.
- **Shared Slack:** the operator hosts the bridge and receives decision DMs (color-coded by severity). Raise blockers there; don't spin up a second bridge.
- **Keep `gt100k-factory` pulled** — the harness, review pipeline, skills, and hygiene policy evolve there.
