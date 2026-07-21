# Feature Specification: Family Selection — Family Fit & Commitment Screening
## "Select the family, not the child"

> **Status: SCOPE REFRAME (2026-07-21) — direction set; concrete instruments PENDING the family
> brainlift (`docs/research/familyBrainlift.md`), so this is not yet loop-ready. Do NOT launch a build
> loop off this until the instruments below are settled with the operator.**

This spec was originally (mistakenly) written as the full admissions *pipeline*. Corrected: **our lane
is assessing the FAMILY's fit + commitment** for an ~8-year intensive program. The **child-facing
assessment** (CogAT, Track A/B eligibility, the Talent Snapshot *review* of the child's work) **and the
income-banded lottery** are the **separate admissions team's** (`docs/prd/ADMISSIONS_PRD.md`). We
**integrate** with those at the handoff; we do **not** rebuild them.

## What we select for (from `docs/research/familyBrainlift.md`)
The bet: *the family you admit decides more than the child.* So we screen the **family**:
- **Genuine commitment** — willing to both **pay for** and **put the child through** the program for
  ~8 years, and to reorganize family life around it.
- **True motivation** — do they actually want the child MIT-ready, for the right reasons (not status).
- **Parental drive + resilience** — grit, focus, and **resistance to social pressure** ("whether they
  fall to pressure" when relatives / school / board push back). *(brainlift SPOV 2)*
- **Household as the unit** — two-parent buy-in; sibling enrollment/spillover. *(SPOV 3)*
- **Binding multi-year commitment** — a filter that screens out families who quit. *(SPOV 3)*
- Weight family commitment over the child's intake score *(SPOV 1)*; treat a family's resolve against
  the "stolen childhood" objection as a positive signal *(SPOV 4)*.

## Scope fence
**IN (ours):** the family fit/commitment assessment + the family's screening journey — a family-facing
intake about commitment / motivation / household / resilience, a fit/commitment signal (not the child's
capability), and the family's decision surface. Synthetic-only, PR-only.
**OUT (the admissions team's — integrate, don't rebuild):** child assessment (CogAT, Track A/B
eligibility, Talent Snapshot review); the **income-banded lottery**; real financial/legal/consent machinery.

## Pending — blocks a loop-ready spec
The **concrete instruments** are still being developed by the operator in the family brainlift:
- exactly which family signals/questions we collect and how "fit/commitment" is scored;
- the binding multi-year commitment mechanism;
- two-parent buy-in + sibling handling;
- what the family-selection **output** is (a signal to the admissions team? a recommendation? a gate?)
  and how it hands off to their lottery/decision.

Once the brainlift settles SPOVs + instruments, this spec gets a loop-ready `P0…Pn` build path, machine-
checkable `SC-1…n`, and golden values — **then** we plan the family UI together and launch the loop.

## Not this (parked, not deleted)
The earlier "admissions pipeline" engine (CogAT routing, Track B review engine, income-banded lottery)
on branch `loop/gt100k-family-selection` is largely the **other team's** lane. It's parked (pushed to
remote), not deleted. Reusable *infrastructure* patterns from it — the application state machine,
contracts/versioning, and the replayable decision trace — may inform our family-fit domain; the
child-assessment and lottery domains are not ours to build.

## Visual direction (when we get to UI)
Family-facing, serious, warm-but-honest — a family weighing an 8-year commitment. Clean, calm, simple;
apply the simplicity rules in `~/code/gt100k-factory/docs/game-feel.md`. Not gamified; not a 3D world.

## Stack (when built)
pnpm monorepo, React 18 / Next 14 / TypeScript / vitest / Zod — a pure family-fit domain package +
in-memory adapters + a family-facing Next app; gate = `tsc -b` + `test` + `build`.
