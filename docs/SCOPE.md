# GT100K — Active build scope (2026-07-21)

Two products: **passion** (developing the student's passion) and **admissions — the FAMILY-facing part**
(family selection). The social/game (arena/cohort) layer is paused. This file is the source of truth for
what the software factory works on; `docs/prd/` remains the canonical product spec.

## The admissions boundary (important — do not conflate)
WE build the **family-facing** side of admissions — **family selection**: the family application / portal,
choosing which **families** enter the program, the income-banded lottery (family income/household), and the
family's decision + aid journey. The **child-facing** side — *assessing the child* (CogAT, Track A/B
eligibility, the Talent Snapshot **review** of the child's work) — is the **separate admissions team's**
(Tiffany + Aadi, `docs/prd/ADMISSIONS_PRD.md`). We **integrate** with their assessment at the handoff; we
do **not** rebuild it. (Exact line to be confirmed with the operator; `ADMISSIONS_PRD.md` is authoritative.)

## Passion — developing the student's passion
- **002-evidence-graph** — content-addressed provenance of a student's passion work (PRD §19). **Active** (chrome declutter in progress).
- **003-interest-lab** — the Passion / Interest Lab (PRD §14). **Active** (production rebuild in progress).
- **007-passion-tutor** — Socratic AI that interviews a student about their own passion project (PRD §13-adjacent). **Building.**

## Admissions — family-facing (family selection)
- **008-family-selection** — the family's admissions journey: application → family selection → income-banded
  lottery → decision/aid. **Engine built** (contracts+hashing, application state machine, lottery,
  finalization) on branch `loop/gt100k-family-selection`; the **family portal UI** is pending a planning
  pass. The child-facing assessment pieces (CogAT routing / Track A-B / Talent review) belong to the other
  team — we integrate, not rebuild; spec 008 will be sharpened to our family-facing lane.

## Archived (out of focus — in `archive/`, work preserved)
- **004-arena-game-world** (`archive/specs/004…`, PR #62) · **006-cohort-compiler** (`archive/specs/006…` + `archive/code/`, PR #66) · **pitch** (`archive/pitch/`).
- **001-daily-learning-loop** + **005-foundation-spine** — neither passion nor admissions; to `archive/` per `RESTRUCTURE-PLAN.md`.

## Software-factory loops
- **Running:** interest-lab rebuild (003), evidence declutter (002), passion-tutor (007). (Subwoofer = separate repo.)
- **Paused at engine milestone:** family-selection (008) — resumes for the family portal UI after the boundary + UI planning.
