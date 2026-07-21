# `@gt100k/cohort-arena-view`

`@gt100k/cohort-arena-view` is the pure view-model layer for the Cohort & Arena Viewer. It reads `@gt100k/cohort-compiler` domain values read-only and produces one deterministic `CohortArenaView` for the 3D scenes, DOM HUD, 2D projection, and accessible Ledger.

## Guarantees

- Pure and deterministic: identical inputs produce byte-identical view state.
- The package performs no I/O, reads no wall-clock value, and calls no `Math.random`.
- Presentation flags change motion and visual treatment only. `plainViewEquals` verifies that domain-derived state stays equal.
- Standings expose no rank, position, percentile, or full-field placement.
- RivalryMix is observable-only and carries no trait or emotion field.

## Public API

### Composition and presentation

| Export | Purpose |
| --- | --- |
| `buildCohortArenaView` | Composes the single view from an assignment, domain constraints, optional prior assignment, standings, RivalryMix analysis, safeguarding input, and presentation flags. |
| `plainViewEquals` | Compares domain-derived renderer state while ignoring motion and presentation differences. |
| `buildLedger` | Projects cohort, standing, RivalryMix, and safeguarding state into semantic text. |
| `deriveStandingsView` | Returns `null` unless the near-peer gain view is opted in. |
| `buildArenaRoomView` | Converts observable `TurnAnalysis` output into seats, evidence patterns, confidence, and suppression state. |
| `resolveMotion` | Resolves one named motion kind to its animated or reduced `MotionSpec`. |
| `resolveVisualBand` | Resolves the `6-8`, `9-11`, or `12-14` presentation treatment. |

### Deterministic layout

| Export | Purpose |
| --- | --- |
| `layoutConstellation` | Builds cohort hexes, member positions, floor halos, and the unassigned bench. |
| `layoutField` | Maps level and velocity inputs onto the caliper field. |
| `layoutArenaRing` | Places observed speakers on the exact 3D seat ring. |
| `project2D` | Projects a 3D point onto the pinned 1600 by 900 orthographic plane. |
| `center`, `vertexLocal`, `benchSlot` | Expose the pinned cohort-center, hex-vertex, and bench-slot geometry helpers. |

### Golden registries

| Export | Stable contract |
| --- | --- |
| `PALETTE` | The 17 exact Compiler Observatory colors, including focus and semantic state colors. |
| `STATE_CUES` | Icon, shape name, text, and color pairings for assigned, unassigned, satisfied, paused, and suppressed states. |
| `TYPOGRAPHY` | Fetch-free display, body, and mono stacks plus the exact six-row type scale and tabular numerals. |
| `LAYOUT` | World, camera, fog, cohort hex, bench, caliper, arena ring, and 2D projection constants. |
| `MOTION` | Named duration values from instant through ambient drift. |
| `EASINGS` | Named CSS easing values used by 3D and DOM motion boundaries. |
| `MOTION_KINDS` | The complete stable list of motion events accepted by `resolveMotion`. |

Vitest pins every registry value. Notable layout goldens include a 1600 by 900 world, cohort radius 6, floor radius 8, arena-ring radius 10, and the projection `{ scale: 24, cx: 800, cy: 450 }`. Every motion kind has an explicit reduced form.

### Public types

The entrypoint exports the input and composed contracts `BuildCohortArenaViewInput`, `CohortArenaView`, `CohortCardView`, `ConstellationView`, `PresentationView`, `LedgerView`, `SafeguardingInput`, and `SafeguardingView`.

It also exports spatial types `Vec2`, `Vec3`, `MoteView`, `CohortHexView`, and `SeatLayout`; presentation types `ViewBand`, `ViewFlags`, `VisualBand`, `MotionKind`, and `MotionSpec`; standings types `StandingSelf`, `AnonymizedPeer`, and `StandingsView`; and RivalryMix types `SeatView`, `TurnPatternView`, and `ArenaRoomView`.

## Renderer boundary

Renderers consume the returned view without changing it:

- The 3D constellation and arena read the `{x,y,z}` positions.
- The reduced, plain, weak-device, and WebGL-loss tiers read the matching `project2D` positions.
- The HUD reads cohort, standing, churn, and safeguarding carriers.
- The Cohort Ledger reads `LedgerView` from the same composition pass.

The package contains no React, three.js, DOM, storage, media, or network dependency. The Next.js app owns those runtime concerns.

## Guardrails

The public standing surface has no rank field. RivalryMix accepts only observable turn-taking descriptors and the `dominance` or `repeated_interruption` pattern vocabulary. Low-confidence analysis suppresses patterns. Unsafe speaker labels and evidence fall back to neutral observable text.

The package does not compute assignments, benefit, churn, ratings, or turn analysis. It projects committed domain values read-only and keeps safeguarding state display-only.

## Verify

From the repository root:

```bash
pnpm --filter @gt100k/cohort-arena-view test
pnpm typecheck
pnpm lint
```
