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
lottery** (Tiffany + Aadi, `docs/prd/ADMISSIONS_PRD.md`). We **integrate** at the handoff; we do **not**
rebuild those. Concrete family instruments are being developed in the family brainlift.

## Passion — developing the student's passion
- **002-evidence-graph** — content-addressed provenance of a student's passion work (PRD §19). **Active** (chrome declutter in progress).
- **003-interest-lab** — the Passion / Interest Lab (PRD §14). **Active** (production rebuild in progress).
- **007-passion-tutor** — Socratic AI that interviews a student about their own passion project (PRD §13-adjacent). **Building.**

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
- **Running:** interest-lab rebuild (003), evidence declutter (002), passion-tutor (007). (Subwoofer = separate repo.)
- **Paused:** family-selection (008) — awaiting the family brainlift (`docs/research/familyBrainlift.md`) to settle the fit/commitment instruments; then finalize the spec + plan the family UI.
