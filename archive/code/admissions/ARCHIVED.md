# Archived — admissions-pipeline engine (parked, reference-only)

This is the earlier **admissions-pipeline engine** (`admissions` + `admissions-contracts`) built on the
`loop/gt100k-family-selection` branch and **never merged to `main`**. It implements the **child-facing
admissions pipeline** — an application state machine, routing, review, income-banded allocation/lottery,
a replayable decision-trace, and versioned contracts — which is largely the **separate admissions team's**
lane.

## Why it's here (not deleted)
Our lane is **family fit & commitment screening** ("select the family, not the child"), whose concrete
instruments are pending the family brainlift (`docs/research/familyBrainlift.md`). The reusable
**infrastructure patterns** here — the application **state machine**, the **versioned contracts**, and the
**replayable decision-trace** — may inform the family-fit domain when we build it. Kept as reference.

## Status
- **NOT** part of the active passion build — it lives under `archive/` and is **not** in the pnpm
  workspace (`passion/{packages,adapters,apps}/*`), so it is neither built nor tested.
- Old repo layout (root `packages/…`), preserved as-was.

Provenance: folded into `archive/code/` from `loop/gt100k-family-selection` (7 commits, ~6.2k lines) on
2026-07-22; the branch was then deleted (its work lives here).
