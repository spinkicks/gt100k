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
  **Spec ready:** `specs/007-passion-tutor/spec.md` — Socratic project-interview; loop starting.

## Side focus — family selection (admissions)
- **008-family-selection (NEW)** — choosing which families enter the GT100K program: family
  application → CogAT routing → Track A/B eligibility → income-banded lottery. Source PRD:
  `docs/prd/ADMISSIONS_PRD.md`. **Spec ready:** `specs/008-family-selection/spec.md` — full
  pipeline (application → routing → snapshot → review → lottery); loop starting. Lower priority than passion work.

## Archived (out of focus — moved to `archive/`, work preserved)
- **004-arena-game-world** — RPG/quest game-experience layer (PRD §15.3). Spec: `archive/specs/004-arena-game-world/`. No merged code (branch + **PR #62** preserved).
- **006-cohort-compiler** — cohort solver + RivalryMix + viewer (PRD §15). Spec: `archive/specs/006-cohort-compiler/`; code at `archive/code/` (app + packages + adapters, removed from the pnpm workspace + tsconfig). **PR #66** preserved.
- **pitch deck** — moved to `archive/pitch/index.html`.

## Unchanged
- **001-daily-learning-loop** — academic mastery daily loop (merged; `apps/student-compass`).
- **005-foundation-spine** — platform infrastructure spine (foundational; built when needed).

## Software-factory loop status
- **Running:** evidence-graph UI (002), interest-lab (003, resumed with the simplicity mandate).
- **Stopped:** arena (004), cohort (006) — deprioritized.
- **Starting now:** passion-tutor (007), family-selection (008).

Rationale: engineers endorsed the passion lab and evidence graph, added the passion-project
Socratic tutor, and liked the family-selection idea from the brainlift; the arena/cohort social
layer is set aside for now.
