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
- **CellEvent mapping** — a primary return event (`kind` from `returnState`, magnitude = `depth`);
  a reduced secondary return event at `depth × secondaryWeight` (default **0.5**); one depth event
  per `DEPTH_FAMILY` signal (non-family signals ignored).
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
(`voluntary_return` in `supporting`, `skip:1` in `disconfirming`).
