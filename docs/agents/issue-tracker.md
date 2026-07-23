# Issue tracker: GitHub

Issues and PRDs for `spinkicks/gt100k` live as **GitHub Issues**. Use the `gh` CLI for all operations.
Per repo policy, pushes/PRs use the **`spinkicks`** account (see `AGENTS.md`) — never the Cursor GitHub
account.

## Conventions

- **Create**: `gh issue create --title "..." --body "..."` (heredoc for multi-line bodies).
- **Read**: `gh issue view <number> --comments`.
- **List**: `gh issue list --state open --json number,title,body,labels,comments`.
- **Comment**: `gh issue comment <number> --body "..."`.
- **Label**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
- **Close**: `gh issue close <number> --comment "..."`.

`gh` infers the repo from `git remote -v` inside the clone.

## PRs as a request surface: no

External PRs are **not** treated as feature requests for triage. (Flip to `yes` here if that changes.)

## Skill verbs

- "publish to the issue tracker" → create a GitHub issue.
- "fetch the relevant ticket" → `gh issue view <number> --comments`.
