# GT100K — Active build scope (re-scoped 2026-07-21)

After an engineering review, the build focus narrowed to **developing a student's passion**
(main) and **family selection / admissions** (side). The social/game layer is paused. This
file is the source of truth for what the software factory works on; `docs/prd/` remains the
canonical product spec.

## Main focus — developing a student's passion
- **002-evidence-graph** — content-addressed provenance of a student's passion work (PRD §19). **Active.**
- **003-interest-lab** — the Passion / Interest Lab: repeated, varied encounters to find where a
  child *voluntarily returns*, tracked as mutable interest hypotheses (PRD §14). **Active.**
- **007-passion-tutor (NEW)** — a Socratic AI that *spontaneously interviews a student about their
  own passion project* (what it is, why it matters to them, how it works, what's next) to build
  ownership, metacognition, and evidence. Motivated by the finding that students often can't
  articulate their own projects. Distinct from the academic answer-blind tutor (PRD §13).
  **Planned — spec in progress.**

## Side focus — family selection (admissions)
- **008-family-selection (NEW)** — choosing which families enter the GT100K program: family
  application → CogAT routing → Track A/B eligibility → income-banded lottery. Source PRD:
  `docs/prd/ADMISSIONS_PRD.md`. **Planned — spec in progress.** Lower priority than passion work.

## Deprioritized (paused, NOT deleted — work preserved)
- **004-arena-game-world** — the RPG/quest game-experience layer (PRD §15.3). Paused; latest work in **PR #62**.
- **006-cohort-compiler** — cohort solver + RivalryMix + viewer (PRD §15). Paused; latest work in **PR #66**.

## Unchanged
- **001-daily-learning-loop** — academic mastery daily loop (merged; `apps/student-compass`).
- **005-foundation-spine** — platform infrastructure spine (foundational; built when needed).

## Software-factory loop status
- **Running:** evidence-graph UI (002), interest-lab (003, resumed with the simplicity mandate).
- **Stopped:** arena (004), cohort (006) — deprioritized.
- **To start once specs land:** passion-tutor (007), family-selection (008).

Rationale: engineers endorsed the passion lab and evidence graph, added the passion-project
Socratic tutor, and liked the family-selection idea from the brainlift; the arena/cohort social
layer is set aside for now.
