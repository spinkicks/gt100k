# Repo restructure plan — two products: `passion/` + `admissions/` (family-facing)

**Status:** approved 2026-07-21; **execute only AFTER** the in-flight loop PRs merge (interest-lab
rebuild, evidence-explorer declutter, passion-tutor, family-selection) — restructuring `main` while they
build on the current flat layout would cause large merge conflicts.

> **admissions/** here is the **family-facing** part only (family selection): family application/portal,
> family selection, income-banded lottery, decision/aid. The **child-facing** assessment (CogAT, Track A/B,
> Talent review) is the separate admissions team's (`ADMISSIONS_PRD.md`) — integrated, not rebuilt.

**Why it's low-risk:** imports use package *names* (`@gt100k/…`), not paths. So we move directories and
update only (1) `pnpm-workspace.yaml` globs, (2) root `tsconfig.json` reference paths, (3) the lockfile.
No import statements change. Package names stay the same.

## Target layout
```
gt100k/
├─ passion/          # developing the student's passion
│  ├─ apps/       interest-lab, evidence-explorer, passion-tutor
│  ├─ packages/   interest-lab, interest-lab-view, evidence-graph, evidence-explorer-view, passion-tutor
│  └─ adapters/   interest-*, evidence-*
├─ admissions/       # family-facing admissions (family selection)
│  ├─ apps/       family-portal
│  ├─ packages/   admissions-contracts, admissions
│  └─ adapters/   admissions-*
├─ shared/
│  └─ adapters/   repo-memory             # generic in-memory repo, cross-product
├─ archive/         arena, cohort, pitch (existing) + academics + infra (below)
├─ specs/           002-evidence-graph, 003-interest-lab, 007-passion-tutor, 008-family-selection
└─ docs/            SCOPE.md, RESTRUCTURE-PLAN.md, prd/ (incl. ADMISSIONS_PRD.md), FACTORY-MAP.md
```

## Move map (current → new)
- `apps/interest-lab` → `passion/apps/interest-lab`; `apps/evidence-explorer` → `passion/apps/evidence-explorer`
- `packages/{interest-lab, interest-lab-view, evidence-graph, evidence-explorer-view}` → `passion/packages/…`
- `adapters/{interest-*, evidence-*}` → `passion/adapters/…`
- `adapters/repo-memory` → `shared/adapters/repo-memory`
- **admissions:** `packages/{admissions-contracts, admissions}` → `admissions/packages/…`; `apps/family-portal` → `admissions/apps/…`; `adapters/admissions-*` → `admissions/adapters/…`
- **passion-tutor (from its PR):** `apps/passion-tutor` → `passion/apps/…`; `packages/passion-tutor` → `passion/packages/…`

## Archive (out of scope; revive if they return)
- `apps/student-compass`, `packages/learning-loop`, `adapters/timeback-stub` → `archive/code/…`
- `specs/001-daily-learning-loop` → `archive/specs/…`; `specs/005-foundation-spine` → `archive/specs/…`
(joins arena (004), cohort (006), pitch.)

## Execution runbook (one PR)
1. Confirm the in-flight PRs merged to `main`; `git pull`.
2. `git mv` per the move map + archive list; create `passion/`, `admissions/`, `shared/`.
3. Update `pnpm-workspace.yaml` globs → `passion/apps/*`, `passion/packages/*`, `passion/adapters/*`, `admissions/apps/*`, `admissions/packages/*`, `admissions/adapters/*`, `shared/adapters/*`.
4. Update root `tsconfig.json` `references` paths. 5. `pnpm install` → `pnpm exec tsc -b` → build each app (GREEN before commit).
6. Update `docs/SCOPE.md`, `AGENTS.md`, path refs. 7. One PR, verify, merge.

## Fold in at the same time
- **Upgrade `review-pr.sh` QA to drive the app** (adversarial walkthrough + teardown), pairing with the loop-finish usability gate.

## Notes
- Specs kept flat; package renames to `@gt100k/passion-*` / `@gt100k/admissions-*` skipped (names already unique).
