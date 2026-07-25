# @gt100k/signal-pipeline — the Signal Firewall

Turns raw child-interaction traces into the `CellEvent` stream that
[`@gt100k/interest-inference`](../interest-inference) (011) consumes. It is the bridge between the
discovery world and the inference engine, and it is where the guardrails live: novelty is
discounted, prompted returns are marked, ambient/undefined actions emit **nothing**, and skips
become the disconfirming signal.

Pure, deterministic, headless. **Synthetic data only** — no network, no LLM, no persistence.

## Pipeline

```
Interaction[]  ──resolveEngagedModes (009)──▶  ActionEvent  ──▶  CellEvent[]  ──runInference (011)──▶  InterestRead
   + SurfacedRecord[] ─────────────────────── skip derivation ──▶
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
- **skip derivation** — a `skip` is disconfirming evidence about a *known* interest, so it fires
  only on a cell the child **actually engaged before**, when that cell is **non-novel** and the
  artifact was surfaced in a session where the child did **not** re-engage it. A surfaced artifact
  the child never engaged emits no skip; a still-novel engaged cell emits no skip.

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
