# Domain Docs

How the engineering skills consume this repo's domain documentation.

## Layout (multi-context monorepo)

- **`CONTEXT-MAP.md`** (root) — lists each modelled context and points to its `CONTEXT.md`. Read the
  ones relevant to your topic.
- **`passion/CONTEXT.md`** — the PassionLab glossary (the active context).
- **`docs/adr/`** — system-wide ADRs. Context-scoped ADRs may later live under `passion/**/docs/adr/`.

If a file doesn't exist yet, proceed silently — `domain-modeling` (via `grill-with-docs`) creates them
lazily as terms/decisions resolve.

## Use the glossary's vocabulary

When naming a domain concept (issue title, proposal, hypothesis, test name), use the term as defined in
the relevant `CONTEXT.md`; don't drift to synonyms it lists under `_Avoid_`. If a concept isn't in the
glossary, that's a signal: either you're inventing language the project doesn't use (reconsider) or
there's a real gap (note it for `domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it — don't silently override:

> _Contradicts ADR-0003 (…) — worth reopening because…_
