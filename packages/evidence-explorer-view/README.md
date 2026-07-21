# @gt100k/evidence-explorer-view

The **deterministic, framework-agnostic view model** for the Provenance Observatory (GT100K feature
`002-evidence-graph`, Part II). It reads the `@gt100k/evidence-graph` domain and produces everything a
renderer needs — a 2D + 3D layout, golden art / motion / visual / camera / tier registries, a build
timeline, a verification view, and an accessible Ledger — with **no React, no three.js, no DOM**.

> **Reads the domain, computes no grade and no crypto, deterministic layout.**
> This package never issues a grade (humans own outcomes — FR-E08) and never hashes anything itself: it
> consumes the domain's already-content-addressed graph + packet and a domain `Hasher` port for
> verification. Given one graph it emits byte-identical output every time — **no `Math.random`, no
> wall-clock, no `Math.sin`/`cos` in the golden layout path** (SC-E11 guardrails enforce this).

## Why a separate package

Three renderers — the cinematic R3F cosmos, the calm-2D SVG constellation, and the accessible DOM
Ledger — consume the **one** view model, so they can never drift (SC-E10 / SC-E14). Swapping the domain
`Hasher` adapter changes the content-address ids but not the view topology: the view depends only on the
graph's shape, not on id strings (proven in `test/integration.test.ts`).

## Public API

| Entry point | Purpose |
| --- | --- |
| `buildExplorerView(graph, packet, opts?)` | The composed `ExplorerView`: nodes + edges with 2D/3D positions, glyphs, colour roles, ranks, growth `birthOrder`, bounds/centre. |
| `buildFixtureGraph(hasher)` | The synthetic "speaker-v1" domain `{ graph, packet }` (needs a domain `Hasher`). |
| `explorerFixture(hasher)` | The full fixture bundle (graph, packet, ids, `verifierResult`) for verification/tests. |
| `buildVerificationView(packet, verifierResult, graph, hasher)` | Ordered verify steps (§U8.8) + `sealState` (`verified`/`mismatch`); re-derives each milestone hash from current content so a byte tamper surfaces. |
| `verifyWaveOrder(graph)` | Deterministic node→node edge order for the verify light-wave. |
| `applyTamper(fixture)` | Returns a bundle with only the byte-level released Artifact tampered (for the tamper demo). |
| `buildLedgerView(view, verification?)` | The accessible Ledger: `role="tree"` items with accessible names + described panels, a beat timeline, and verify status. |
| `resolveRenderTier(caps)` | The tier truth table (cinematic / standard3d / calm2d) from device caps + reduced-motion + override. |
| `resolveMotion(kind, { reducedMotion })` | The golden motion table — every row has a reduced equivalent (instant or ≤150ms). |

Golden registries are exported as constants: `MOTION`, `EASINGS`, `SPRINGS`, `RESOLVE_MOTION`,
`TIER_LADDER`, plus the art/visual/camera tables. Types (`ExplorerView`, `NodeView`, `EdgeView`,
`VerificationView`, `LedgerView`, `RenderTier`, `RenderCaps`, …) come from `./model`.

## Determinism & invariants

- **No grade / no crypto in the view** — grades are the domain's human-owned `Outcome`; hashing is the
  domain `Hasher` port. This package only reads and lays out.
- **Colour is never the sole cue** — every node carries a shape + glyph + text label; every thread a
  style token (FR-E04, grayscale-safe).
- **No accusation** — a `model` actor renders only as a cited `Assistance`/`Review`; there is no
  accusation field anywhere (FR-E08, guarded in `test/guardrails.test.ts`).
- **Tamper framing is confined** — `mismatch`/red appears only on the byte-level body + root diff, never
  on a person or `Outcome` (FR-E09).

## Develop

```bash
pnpm --filter @gt100k/evidence-explorer-view test    # view-package unit + golden tests (vitest)
pnpm typecheck                                        # tsc -b across the workspace
```

Dependency: `@gt100k/evidence-graph` (`workspace:*`) only. Consumed by `apps/evidence-explorer`.
