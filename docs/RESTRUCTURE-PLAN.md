# Repo restructure plan — one product: `passion/` (+ `shared/` + `archive/`)

**Status:** approved 2026-07-21; **execute only AFTER** the in-flight passion loops merge
(interest-lab rebuild, evidence-explorer declutter, passion-tutor) — restructuring `main` while they
build on the current flat layout would cause large merge conflicts.

> Admissions / family selection is a **separate team's** responsibility and **out of this platform's
> scope** (see `SCOPE.md`, PRD §3.4/§3.5), so there is **no `admissions/` product** here. The engine an
> earlier loop mistakenly built is parked on the `loop/gt100k-family-selection` branch for that team.

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
├─ shared/
│  └─ adapters/   repo-memory             # generic in-memory repo
├─ archive/         arena, cohort, pitch (existing) + academics + infra (below)
├─ specs/           002-evidence-graph, 003-interest-lab, 007-passion-tutor
└─ docs/            SCOPE.md, RESTRUCTURE-PLAN.md, prd/ (incl. ADMISSIONS_PRD.md — kept as integration ref), FACTORY-MAP.md
```

## Move map (current → new)
- `apps/interest-lab` → `passion/apps/interest-lab`
- `apps/evidence-explorer` → `passion/apps/evidence-explorer`
- `packages/{interest-lab, interest-lab-view, evidence-graph, evidence-explorer-view}` → `passion/packages/…`
- `adapters/{interest-*, evidence-*}` → `passion/adapters/…`
- `adapters/repo-memory` → `shared/adapters/repo-memory`
- **passion-tutor (from its PR):** `apps/passion-tutor` → `passion/apps/…`; `packages/passion-tutor` → `passion/packages/…`

## Archive (out of scope; revive if they return)
- `apps/student-compass`, `packages/learning-loop`, `adapters/timeback-stub` → `archive/code/…`
- `specs/001-daily-learning-loop` → `archive/specs/…`; `specs/005-foundation-spine` → `archive/specs/…`
(joins the already-archived arena (004), cohort (006), pitch.)

## Execution runbook (one PR)
1. Confirm the in-flight passion PRs are merged to `main`; `git pull`.
2. `git mv` per the move map + archive list; create `passion/`, `shared/`.
3. Update `pnpm-workspace.yaml` globs → `passion/apps/*`, `passion/packages/*`, `passion/adapters/*`, `shared/adapters/*`.
4. Update root `tsconfig.json` `references` paths to the new locations.
5. `pnpm install` (regenerate lock) → `pnpm exec tsc -b` → build each app. Must be GREEN before commit.
6. Update `docs/SCOPE.md`, `AGENTS.md`, and any path references in docs.
7. Open one PR, verify, merge.

## Fold in at the same time
- **Upgrade `review-pr.sh` QA to drive the app** (adversarial walkthrough + functional/UX teardown) instead
  of judging from screenshots — pairs with the loop-finish adversarial usability gate already in the harness.

## Notes / deferred
- Specs kept flat (grouped by `SCOPE.md`); co-locating specs under the product is a later option.
- Package renames to `@gt100k/passion-*` intentionally skipped (churny; names already unique).
