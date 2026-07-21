# GT100K — Active build scope (re-scoped 2026-07-21)

The build focus is **developing a student's passion**. The social/game layer is paused, and
**admissions / family selection is a separate team's responsibility — out of this platform's build
scope** (PRD §3.4/§3.5; owners: Tiffany + Aadi; `docs/prd/ADMISSIONS_PRD.md` is *their* PRD, kept here
only as the enrollment-handoff integration reference). This file is the source of truth for what the
software factory works on; `docs/prd/` remains the canonical product spec.

**Structure:** the repo is being reorganized around the **`passion/`** product (+ `shared/` + `archive/`)
— see [`RESTRUCTURE-PLAN.md`](RESTRUCTURE-PLAN.md) (executes after the in-flight loop PRs land).

## Focus — developing a student's passion
- **002-evidence-graph** — content-addressed provenance of a student's passion work (PRD §19). **Active** (chrome declutter in progress).
- **003-interest-lab** — the Passion / Interest Lab: repeated, varied encounters to find where a child
  *voluntarily returns*, tracked as mutable interest hypotheses (PRD §14). **Active** (production rebuild in progress).
- **007-passion-tutor** — a Socratic AI that *spontaneously interviews a student about their own passion
  project* to build ownership, metacognition, and evidence. Distinct from the academic answer-blind tutor
  (PRD §13). **Building.**

## Out of scope — admissions / family selection (separate team)
The admission + selection pipeline (family application → CogAT routing → Track A/B → Talent Snapshot →
income-banded lottery) is **owned and built by the admissions team** (`ADMISSIONS_PRD.md`), NOT this
platform (PRD §3.4/§3.5). Our `008-family-selection` spec + loop were **removed**; the engine the loop had
built is **parked on the `loop/gt100k-family-selection` branch** if the admissions team ever wants it. We
integrate only at the enrollment handoff.

## Archived (out of focus — in `archive/`, work preserved)
- **004-arena-game-world** — RPG/quest game layer (PRD §15.3). `archive/specs/004…`; PR #62 preserved.
- **006-cohort-compiler** — cohort solver + RivalryMix + viewer (PRD §15). `archive/specs/006…` + `archive/code/`; PR #66 preserved.
- **pitch deck** — `archive/pitch/index.html`.
- **001-daily-learning-loop** + **005-foundation-spine** — neither passion nor admissions; to `archive/` per `RESTRUCTURE-PLAN.md`.

## Software-factory loop status
- **Running:** interest-lab production rebuild (003), evidence-explorer declutter (002), passion-tutor (007). (Subwoofer is a separate repo.)
- **Removed/archived:** family-selection (008) removed (separate team); arena (004) + cohort (006) archived.
