# @gt100k/signal-pipeline — the Signal Firewall

Turns raw child-interaction traces into the `CellEvent` stream that
[`@gt100k/interest-inference`](../interest-inference) (011) consumes. It is the bridge between the
discovery world and the inference engine, and it is where the guardrails live: novelty is
discounted, prompted returns are marked, ambient/undefined actions emit **nothing**, and what a
session offered but the child did not take becomes the disconfirming signal.

Pure, deterministic, headless. **Synthetic data only** — no network, no LLM, no persistence.

## Pipeline

```
Interaction[]  ──resolveEngagedModes (009)──▶  ActionEvent  ──▶  CellEvent[]  ──runInference (011)──▶  InterestRead
   + SurfacedRecord[] ─────────────────── skip/decline derivation ──▶
```

`deriveSignals(input) → { actionEvents, cellEvents, dropped }`:

- **novelty** — per `(kidId, cellKey)` first-exposure tracking; an interaction within
  `noveltyWindowDays` (default **3**) of first-exposure is `novelty` (triggered situational
  interest, excluded by 011).
- **ActionEvent construction** — `resolveEngagedModes` maps `actionType → engagedModes`;
  `returnState` is `prompted` iff `interaction.prompted`, else `voluntary`. An **unknown artifact**
  or an action that **does not resolve** to an afforded mode is **dropped** (recorded in `dropped`,
  emits no signal — the Signal Firewall).
- **return horizon** — a voluntary engagement is `cross_day_return` (carrying `dayGap`) when the
  same `(kidId, cellKey)` was engaged on an **earlier UTC calendar day**, and `same_day_engagement`
  otherwise: a first-ever engagement, a reopen inside one session, or a re-entry in a different
  session the same day. Only the first scores; the second is recorded at weight 0. A prompted
  engagement is `prompted_return` regardless.
- **CellEvent mapping** — a primary return event; if a secondary mode is engaged, the same event
  against that cell marked `role: "secondary"` (the engine down-weights an inferred mode), carrying
  the same kind and `dayGap`; one depth event per `DEPTH_FAMILY` signal (non-family ignored).
- **skip / decline derivation** — per `(kidId, sessionId)`, the **not-chosen** set is every
  non-novel cell reachable from an artifact surfaced in that session that the child did not engage
  in it. Each not-chosen cell emits exactly one event, and every event from the session carries
  `choiceSetSize = |notChosen|` so 011 can treat one choice as one observation. A cell the child
  **engaged before** is a `skip` (disconfirming evidence about a known interest, keyed on the
  artifact's *engaged* cells, never on `affordedModes[0]`); a cell they have **never engaged** is a
  weaker `decline` (keyed on the artifact's afforded modes, since there is no engagement to key on).
  The two are disjoint by construction. Surfacing counts as an exposure for the novelty window,
  which is what lets a never-engaged cell ever leave it.

  **A session in which the child engaged nothing yields neither.** No choice happened, so there is
  nothing to infer from, and the old rule made the harm scale with the catalogue: a child who loaded
  the map, could not find a way in and left earned one disconfirming event against every cabin on
  screen. Those sessions cluster wherever the surface is hardest to read, so the error tracked cabin
  art rather than interest. `deriveSkips` therefore returns `{ events, silentSessions }` rather than
  a bare array, and `deriveSignals` passes `silentSessions` out: a rule that removes signal has to be
  auditable, or a surface that stamps a different `sessionId` on its surfacings than on its
  interactions would silence every skip and decline in the product while every other number kept
  moving. See `docs/decisions/2026-07-27-no-choice-no-decline.md`.

  Mode-less actions (an `open`) are presence, not a pass-over: they build no event, but they mark the
  artifact's cells engaged for the session so the child is not scored as having skipped the one thing
  they demonstrably looked at.

## Golden defaults

| Constant | Value |
|---|---|
| `noveltyWindowDays` | `3` |
| `secondaryWeight` | `0.5` |
| `defaultDepth` | `1` |

## Commands

```sh
pnpm --filter @gt100k/signal-pipeline test   # unit + golden + 011 integration
pnpm --filter @gt100k/signal-pipeline demo   # synthetic scenario → CellEvents → 011 read
```

The demo feeds a synthetic scenario (six voluntary `build` returns, a prompted `investigate`, a
`build` skip) through `deriveSignals` and into `runInference`, yielding a **confident** `build` cell
(`cross_day_return` in `supporting`, `skip:1` in `disconfirming`).
