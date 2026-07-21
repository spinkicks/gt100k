# Repo restructure plan — two products: `passion/` + `admissions/`

**Status:** approved 2026-07-21; **execute only AFTER** the four in-flight loop PRs merge
(interest-lab-v2, evidence-polish, passion-tutor, family-selection) — restructuring `main`
while they build on the current flat layout would cause large merge conflicts.

**Why it's low-risk:** imports use package *names* (`@gt100k/…`), not paths. So we move
directories and update only (1) `pnpm-workspace.yaml` globs, (2) root `tsconfig.json` reference
paths, (3) the lockfile. No import statements change. Package names stay the same.

## Target layout
```
gt100k/
├─ passion/          # developing the student's passion
│  ├─ apps/       interest-lab, evidence-explorer, passion-tutor
│  ├─ packages/   interest-lab, interest-lab-view, evidence-graph, evidence-explorer-view, passion-tutor
│  └─ adapters/   interest-artifact-stub, interest-assent-stub, interest-probe-catalog,
│                 interest-repo-memory, evidence-deferred, evidence-hash-node,
│                 evidence-repo-memory, evidence-verifier-stub
├─ admissions/       # choosing the family (not the child)
│  ├─ apps/       family-portal
│  ├─ packages/   admissions-contracts, admissions
│  └─ adapters/   admissions-*            (as they land)
├─ shared/
│  └─ adapters/   repo-memory             # generic in-memory repo, cross-product
├─ archive/         arena, cohort, pitch  (existing) + academics + infra (below)
├─ specs/           002-evidence-graph, 003-interest-lab, 007-passion-tutor, 008-family-selection
└─ docs/            SCOPE.md, RESTRUCTURE-PLAN.md, prd/ (incl. ADMISSIONS_PRD.md), FACTORY-MAP.md
```

## Move map (current → new)
- `apps/interest-lab` → `passion/apps/interest-lab`
- `apps/evidence-explorer` → `passion/apps/evidence-explorer`
- `packages/{interest-lab, interest-lab-view, evidence-graph, evidence-explorer-view}` → `passion/packages/…`
- `adapters/{interest-*, evidence-*}` → `passion/adapters/…`
- `adapters/repo-memory` → `shared/adapters/repo-memory`
- **admissions (from PR #008):** `apps/family-portal` → `admissions/apps/…`; `packages/{admissions-contracts, admissions}` → `admissions/packages/…`; `adapters/admissions-*` → `admissions/adapters/…`
- **passion-tutor (from PR #007):** `apps/passion-tutor` → `passion/apps/…`; `packages/passion-tutor` → `passion/packages/…`

## Archive (out of the 2-product scope; revive if they return)
- `apps/student-compass`, `packages/learning-loop`, `adapters/timeback-stub` → `archive/code/…`
- `specs/001-daily-learning-loop` → `archive/specs/001-daily-learning-loop`
- `specs/005-foundation-spine` → `archive/specs/005-foundation-spine`
(joins the already-archived arena (004), cohort (006), and pitch.)

## Execution runbook (one PR)
1. Confirm the four in-flight PRs are merged to `main`; `git pull`.
2. `git mv` per the move map + archive list; create `passion/`, `admissions/`, `shared/`.
3. Update `pnpm-workspace.yaml` globs → `passion/apps/*`, `passion/packages/*`, `passion/adapters/*`,
   `admissions/apps/*`, `admissions/packages/*`, `admissions/adapters/*`, `shared/adapters/*`.
4. Update root `tsconfig.json` `references` paths to the new locations.
5. `pnpm install` (regenerate lock) → `pnpm exec tsc -b` → build each app. Must be GREEN before commit.
6. Update `docs/SCOPE.md`, `AGENTS.md`, and any path references in docs.
7. Open one PR, verify, merge.

## Fold in at the same time
- **Upgrade `review-pr.sh` QA to drive the app** (adversarial walkthrough + functional/UX teardown)
  instead of judging from screenshots, so the 2×2 consensus stops rubber-stamping demos. (Pairs with
  the loop-finish adversarial usability gate already in the harness.)

## Notes / deferred
- Specs kept flat (grouped by `SCOPE.md`); co-locating specs under each product is a later option
  (would require the harness `.loop/FEATURE` convention to learn the product path).
- Package renames to `@gt100k/passion-*` / `@gt100k/admissions-*` intentionally skipped (churny; names
  are already unique). Can revisit if desired.
