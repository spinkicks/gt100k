# Repo restructure — passion-centric (EXECUTED 2026-07-21)

**Status: DONE.** The repo was re-ordered into a passion-centric layout. Everything not part of the
passion product is archived (work preserved, just out of the build).

## Actual layout
```
gt100k/
├─ passion/                      # the PassionLab product (the only active workspace)
│  ├─ apps/       evidence-explorer · interest-lab · passion-tutor
│  ├─ packages/   evidence-graph · evidence-explorer-view · interest-lab · interest-lab-view · passion-tutor
│  └─ adapters/   evidence-* (deferred, hash-node, repo-memory, verifier-stub) · interest-* (artifact-stub, assent-stub, probe-catalog, repo-memory) · passion-tutor-memory
├─ specs/         002-evidence-graph · 003-interest-lab · 007-passion-tutor   (passion only)
├─ archive/
│  ├─ code/       student-compass, learning-loop, timeback-stub, repo-memory  (001 academics)
│  ├─ foundation-spine/   the whole Go/infra platform (cmd, pkg, services, proto, policies, infra, go.*, buf.*, Makefile, runbooks, workflows) + ci/foundation-spine.yml (005)
│  ├─ specs/      001-daily-learning-loop · 005-foundation-spine · 008-family-selection  (+ arena/cohort)
│  └─ pitch/, code/{arena,cohort}                                             (prior archives)
└─ docs/          SCOPE.md · PASSION-LAB-PLAN.md · this file · prd/ · research/
```
> No top-level `shared/` yet — nothing is genuinely cross-product right now (each passion pillar uses
> its own repo adapter; `repo-memory` turned out to be academic and was archived). Add `shared/` when a
> real cross-product package appears (e.g. the PassionLab design-system package).

## What changed mechanically (low-risk by design)
- `git mv` of the dirs above. **Imports use package names (`@gt100k/*`), so no import statements changed.**
- `pnpm-workspace.yaml` → `passion/{packages,adapters,apps}/*`.
- Root `tsconfig.json` `references` → `passion/...` (dropped the archived academic refs).
- Passion tsconfigs `extends` bumped one level (`../../` → `../../../tsconfig.base.json`) for the new depth.
- `vitest.config.ts` globs re-rooted to `passion/**`.
- Root `package.json` scripts (`lint`/`demo`/`build`) repointed off archived packages to passion ones.
- `foundation-spine.yml` CI moved out of `.github/workflows` (disabled with its archived code).
- **Gotcha handled:** `git mv` carried stale `node_modules` symlinks; a clean reinstall
  (`rm -rf` all `node_modules` → `pnpm install`) is required after a move like this.

## Verified green after restructure
`pnpm typecheck` (tsc -b) · `pnpm test` (383 passed) · `pnpm build` (all 3 apps compiled). Required CI
(`ci.yml`: gitleaks + large-file + hygiene) is path-agnostic and unaffected.

## In-flight branches
`loop/gt100k-interest-lab-v2` and `loop/gt100k-evidence-polish` were based on the OLD layout; they are
rebased onto this restructured `main` when their loops resume.
