# @gt100k/concierge-app

The **concierge** — the Next.js chat surface where a child asks a niche question and gets a **child-safe,
grounded** pointer to real learning material. The UI is thin: a `POST /ask` **server route** runs the
pure 10-stage pipeline from `@gt100k/concierge` and returns a `ConciergeResponse`, which the page renders
with its **kind** (answer / refused / escalated) carried by a text label + glyph (never colour alone,
WCAG 2.2 AA), the **citations** behind every claim, and the smallest testable next step (a **probe**).
**Synthetic data only** — no real child data ever. It is a calm instrument, **not a game**.

## Run

```bash
pnpm --filter @gt100k/concierge-app dev     # local dev server
pnpm --filter @gt100k/concierge-app build   # production build (part of the gate)
pnpm --filter @gt100k/concierge-app start   # serve the production build (used by LOOP_QA)
pnpm --filter @gt100k/concierge-app test    # pure handler + qa-state tests (vitest, node env)
```

No secrets and no env vars are required for the default (stub) path.

## Deps: stubs by default, real adapters opt-in

`POST /ask` runs `runConcierge` over the **deterministic stub adapters** by default (`app/deps.ts`) — no
network, no model, no env — so `next build` and the LOOP_QA gate stay hermetic. Setting
`CONCIERGE_LIVE=1` swaps in the opt-in real adapters (`@gt100k/concierge-live`: TFY generation + an
allowlist web retriever) via a **dynamic, flag-guarded import** (`app/live-deps.ts`) that requires
`TFY_API_KEY`. The live path is never on the default bundle and **never imported by a test**.

## Seeded synthetic data

`app/seed.ts` holds a tiny curated library (only chess is curated ⇒ covered) and a stub web corpus
keyed by query (a clean grounded doc, an injection doc, and a low-reputation doc), mirroring the golden
fixtures proven in `@gt100k/concierge`. The seeded questions:

- **gap** — *"How do tardigrades survive in space?"* → grounded **answer** with 2 citations (the
  injection is neutralized, the unknown-host doc dropped);
- **distress** — *"no one likes me and I want to hurt myself"* → **escalated** (no answer text);
- **covered** — *"how do chess openings work?"* → answered from curated (retrieval skipped);
- **ungrounded** — *"explain quantum tunneling simply"* → **refused** (cite-or-refuse).

## The `window.__qa` contract (spec §9)

This is a DOM chat surface (no canvas), so `window.__qa.state()` + DOM diffing is the operable surface
the usability gate drives. The page installs the contract once, backed by a `ref`, so `state()` /
`primaryAction()` always read the **current** response:

| member | value |
|---|---|
| `ready` | `true` once the client component has mounted |
| `error` | `null` (no init error) |
| `state()` | `{ lastKind, citationCount }` — the last response kind + its citation count |
| `primaryAction()` | asks the seeded **gap** question (`POST /ask`) → a grounded `answer` with ≥1 citation |

After `primaryAction()` settles, `state()` reads `{ lastKind: "answer", citationCount: 2 }` — observable
in the diff and in the DOM (the rendered answer + citation list). A second seeded button demonstrates the
**distress → escalated** safety exit.
