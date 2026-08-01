# @gt100k/guide-console

The **guide console** — the Next.js app where a human promotes / parks / reopens / contests interest
hypotheses with the evidence in front of them. It renders the pure `consoleViewModel` from
`@gt100k/hypothesis-store`: it computes no belief and no gate math in the UI (that
lives in the domain package), and it never shows a scalar passion score or a fixed label — only
separated supporting / disconfirming evidence, coverage gaps, the next distinguishing probe, calibrated
uncertainty, lifecycle state, and the currently-legal human actions.

**Data.** Four synthetic children ship with it, derived by running the real orchestrator over authored
logs. Since 2026-07-27 it can also receive a real one: the discovery game posts sessions to
`POST /api/ingest`, which persists a profile and renders that child through identical code in the same
switcher. That path is off unless someone points the game at it, and refuses outright without a
guardian's consent on file for the purpose (`@gt100k/consent`). It has no authentication and no rate
limiting, so it is a local seam and not something to expose. It is a calm, legible **data console, not a game**.

## Run

```bash
pnpm --filter @gt100k/guide-console dev     # local dev server on :3020
pnpm --filter @gt100k/guide-console build   # production build (part of the gate)
pnpm --filter @gt100k/guide-console start   # serve the production build on :3020 (used by LOOP_QA)
pnpm --filter @gt100k/guide-console test    # app smoke tests (vitest, node env — no jsdom)
```

No secrets are required. Two optional env vars, both for the ingest path: `GT100K_PROFILE_DIR` (where
ingested profiles and `consent.json` live, default `.profiles`) and `GT100K_INGEST_ORIGIN` (the one
origin `POST /api/ingest` answers a preflight for, default `http://localhost:5178`, which is where the
discovery game runs). It is never `*`: the route takes children's behavioural data and writes it to
disk under a `kidId` the caller chooses.

## What the console shows

Seven tabs — **Overview, Hypotheses, Wellbeing, Plan, Family, Access, Maps** — each carrying a count
and a review dot when that lens holds an escalation. **Overview** is the landing view rather than
Hypotheses: guides are not technical, and the summary is what orients them before they act. Switching
child returns there, so a tab is never left pointing at the previous kid's section.

The Hypotheses tab is the core read: for the selected kid, a ranked list of **hypothesis cards**
(ordered by `lowerBound` desc), each with:

- **domain path + mode** and the **lifecycle state** (`EXPLORING → EMERGING → CANDIDATE → ACTIVE`, plus
  `PARKED / CONTESTED / REOPENED`), carried by a **glyph + text label** so meaning never rests on colour
  (WCAG 2.2 AA, grayscale-safe);
- the **lower-bound** of current evidence + whether the belief is **calibrated** (011's confidence gate),
  phrased *"current evidence suggests…"* — never *"you are an X"*;
- **supporting and disconfirming evidence shown separately** (never summed into one score);
- the **next probe** — the smallest distinguishing next test for that hypothesis;
- **coverage gaps** for the kid (domain×mode combinations observed on one axis but not yet sampled on the
  other);
- **allowed actions** as buttons — exactly the human transitions currently legal from that state. Promote
  from `EMERGING` is disabled until the graduation gate passes, so the surface never lies about what is
  legal.

Buttons drive the in-memory store through the domain package's human-owned transitions (`promote` /
`park` / `reopen` / `contest`) with a synthetic `guide` actor, then re-render. Nothing is ever deleted
(park is reversible → reopen returns to `EMERGING`). A first-run kid with no hypotheses shows
*"No hypotheses yet. Exploration in progress."*

## The `window.__qa` contract (spec §9)

This is a DOM console (no canvas), so `window.__qa.state()` plus DOM diffing is the operable surface the
usability gate drives. The page installs the contract once, backed by a `ref`, so `state()` /
`primaryAction()` always read the **current** store — never a stale render closure:

| member | value |
|---|---|
| `ready` | `true` once the client component has mounted |
| `error` | `null` (no init error) |
| `state()` | `{ selectedId, count, states, escalations }` — a small, stable snapshot; `states` is the ranked lifecycle list, so a promote is observable in the diff, and `escalations` counts the child's spikes the wellbeing engine flagged for a human |
| `primaryAction()` | promotes the **top gate-passed `EMERGING` candidate** (synthetic guide + passed gate + autonomy sign-off); a no-op only if no candidate has passed its gate |

The seed includes one confident hypothesis whose gate passes (a perseverance-artifact ref + a return
timeline at day 0 / day 20 / day 60), so `primaryAction()` is **live** and observably moves the top card
`EMERGING → CANDIDATE` in both `state()` and the DOM.

## LOOP_QA usability gate

The served app enables the `LOOP_QA` gate — it verifies the console is live and the primary action is not
dead by reading `window.__qa.state()` before and after a promote:

```bash
pnpm --filter @gt100k/guide-console build
LOOP_QA=1 \
LOOP_QA_CMD="pnpm --filter @gt100k/guide-console start" \
LOOP_QA_PORT=3020 \
  <run the loop harness>
```

The harness loads the console, asserts `window.__qa.ready === true` and `error === null`, snapshots
`state()`, invokes `primaryAction()`, and hard-fails if `state()` (and the DOM) did not change — i.e. if
the primary action is dead. Verified locally against `next start`: the top card promotes
`EMERGING → CANDIDATE` with no page errors.

## Accessibility & motion

- Semantic landmarks (`<main>` / `<header>` / `<h1>`), labelled action groups + buttons, an always-visible
  focus ring (WCAG 2.4.7), and a live `role="status"` empty state.
- State is a **glyph + text label**, so it is legible in grayscale (colour is only a secondary cue).
- Only `border-color` / `background` transition on buttons; `prefers-reduced-motion: reduce` disables all
  motion. **Manual verification** (tone / legibility / full a11y sweep) is operator-reviewed on the PR.
