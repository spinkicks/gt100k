# GT100K — Active build scope (2026-07-21)

Two products: **passion** (developing the student's passion) and **admissions — the FAMILY-facing part**
(family selection). The social/game (arena/cohort) layer is paused. This file is the source of truth for
what the software factory works on; `docs/prd/` remains the canonical product spec.

## The admissions boundary (important — do not conflate)
WE build **family selection = screening the FAMILY** for fit + commitment: whether they'll genuinely
commit to ~8 years (**pay AND put the child through it**), truly want the child MIT-ready (right reasons),
have the parental drive + **resistance to social pressure**, household buy-in, and a binding commitment
(family brainlift SPOVs 1–4, `docs/research/familyBrainlift.md`). The **separate admissions team** owns the
**child-facing assessment** (CogAT, Track A/B eligibility, Talent Snapshot review) **and the income-banded
lottery** (Tiffany + Aadi) — an external process, integrated at the handoff; no admissions doc is hosted in
this repo. We **integrate** at the handoff; we do **not** rebuild those. Concrete family instruments are
being developed in the family brainlift.

## Passion — developing the student's passion
**Umbrella:** these unify into ONE **PassionLab** app (evidence graph + Socratic tutor + interest lab
+ new **Motivate** & **Wellbeing** pillars) — see `docs/PASSION-LAB-PLAN.md` (living draft; the two new
pillars pend Felipe's passion brainlift).
- **002-evidence-graph** — content-addressed provenance of a student's passion work (PRD §19). **Active** — declutter landed (PR #77); **complete UI revamp in flight** (Claude + design skills; establishes PassionLab's shared design system).
- **003-interest-lab** — the Passion / Interest Lab (PRD §14). **Active** (production rebuild in progress).
- **007-passion-tutor** — Socratic AI that interviews a student about their own passion project (PRD §13-adjacent). **Done (PR #78).**
- **009-passion-lab** — the unified shell + Motivate + Wellbeing pillars. **Planning** (`docs/PASSION-LAB-PLAN.md`).

## Admissions — family-facing (family selection)
- **008-family-selection** — **family fit & commitment screening** ("select the family, not the child"):
  assess genuine 8-year commitment (pay + participate), true motivation, parental resilience to pressure,
  and household buy-in. Concrete instruments **pending the family brainlift** (`docs/research/familyBrainlift.md`).
  Not the admissions pipeline. The earlier pipeline engine (CogAT/Track-B/lottery) is the other team's lane —
  **parked** on `loop/gt100k-family-selection` (pushed, not deleted). Loop stays paused until the brainlift
  settles → then finalize the loop-ready spec + plan the family UI together.

## Archived (out of focus — in `archive/`, work preserved)
- **004-arena-game-world** (`archive/specs/004…`, PR #62) · **006-cohort-compiler** (`archive/specs/006…` + `archive/code/`, PR #66) · **pitch** (`archive/pitch/`).
- **001-daily-learning-loop** + **005-foundation-spine** — neither passion nor admissions; to `archive/` per `RESTRUCTURE-PLAN.md`.

## Software-factory loops
- **Running:** interest-lab rebuild (003), evidence-explorer **UI revamp** (002, Claude + design skills). (Subwoofer = separate repo.)
- **Done, in review:** passion-tutor (007, PR #78), evidence declutter+HUD (002, PR #77).
- **Paused:** family-selection (008) — awaiting the family brainlift (`docs/research/familyBrainlift.md`) to settle the fit/commitment instruments; then finalize the spec + plan the family UI.
