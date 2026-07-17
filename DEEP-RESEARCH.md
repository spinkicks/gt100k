# Deep Research workflow

A multi-agent research harness for Claude Code. Give it a question; it fans out
web searches across several angles, fetches and reads the sources, adversarially
fact-checks every extracted claim with a 3-voter panel, and synthesizes a cited
report. Self-contained — the whole thing is one JS file at
[`.claude/workflows/deep-research.js`](.claude/workflows/deep-research.js), no
dependencies.

## How it works

Five phases:

1. **Scope** — decomposes the question into ~5 complementary search angles
   (e.g. broad/primary, academic, recent-news, contrarian, practitioner),
   picking angle sets that fit the domain.
2. **Search** — 5 parallel `WebSearch` agents (one per angle) return the top 4-6
   results each, ranked by relevance to the *original* question, skipping SEO spam.
3. **Fetch + extract** — results are URL-deduped and capped at 15 sources. Each
   source gets a `WebFetch` agent that rates source quality (primary / secondary /
   blog / forum / unreliable) and pulls 2-5 **falsifiable** claims, each with a
   supporting quote.
4. **Verify** — claims are ranked by importance x source quality (top 25 kept),
   then each faces **3 independent skeptic agents** told to *refute* it. A claim
   dies if >=2/3 refute it. Infra failures (all voters errored) are reported as
   "unverified", never silently counted as refuted.
5. **Synthesize** — merges semantic duplicates, groups claims into findings,
   assigns per-finding confidence, writes an executive summary, and lists caveats
   + open questions. Refuted and unverified claims are kept for transparency.

Search->Fetch runs as a pipeline (a source starts fetching the moment its angle
finishes); there's a barrier before Verify so the full claim pool is ranked
together. Total agent count ~= `1 + angles + sources + (claims x 3) + 1`.

## Install

**Per user (all projects):**

```bash
mkdir -p ~/.claude/workflows
curl -fsSL https://raw.githubusercontent.com/spinkicks/gt100k/main/.claude/workflows/deep-research.js \
  -o ~/.claude/workflows/deep-research.js
```

**Per project:** clone this repo (or copy `.claude/workflows/deep-research.js`
into your project's `.claude/workflows/`) and it's scoped to that project.

## Use

From inside Claude Code:

```
Workflow({ name: 'deep-research', args: 'your research question here' })
```

Or just ask Claude to "do deep research on X" — it will invoke the workflow with
your question as `args`. If the question is underspecified, narrow it first
(budget, region, use-case, etc.) for better results.

## Requirements

- Claude Code with the `WebSearch` and `WebFetch` tools available.
- `WebSearch` is US-only.
