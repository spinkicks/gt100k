# Loop progress — 009 Two-Axis Tagging (Domain × Work-Mode)

Headless TypeScript domain package + adapters. **No served app → LOOP_QA is N/A.** DoD gate =
`pnpm exec tsc -b` + `pnpm test` (repo-wide). No network in tests, no new external npm dep (TFY uses
native `fetch`, opt-in only). SYNTHETIC ONLY.

- **SPEC:** `specs/009-two-axis-tagging/spec.md` (SC-1…SC-8 + manual live call).
- **PLAN:** `docs/superpowers/plans/2026-07-22-two-axis-tagging.md` (Tasks 0–9, test-first, golden values).
- The prior Emberwood-world progress that was here is UNRELATED to this feature (different branch/loop);
  discarded. This feature is a clean start on branch `loop/009-two-axis-tagging`.

## Build path (spec §6 P0…P5 → plan Tasks 0–9)
- [x] **P0 — Task 0** scaffold `@gt100k/two-axis-tagging` (pkg.json, tsconfig, index, smoke; root tsconfig ref; pnpm install; gate green)
- [x] **P0 — Task 1** work-mode taxonomy: `WORK_MODES` (golden order), `WORK_MODE_DEFS`, `isWorkMode`
- [x] **P0 — Task 2** domain taxonomy: `CABINS` (8 golden), `SEED_SUBTOPICS`, `createTaxonomy`, `mintSubTopic` (idempotent-by-slug), `serializePath`, `isCabinId`
- [ ] **P1 — Task 3** records: `Artifact`/`ActionEvent`/`RawAction`/`TagSuggestion` + `makeArtifact` validator
- [ ] **P1 — Task 4** engaged-mode resolver (rule table, intersect-afforded, priority, reject-invalid, unresolved→review) + ≥8 golden fixtures — **the crux**
- [ ] **P2 — Task 5** `Tagger` port + suggest→validate→accept pipeline (+ sub-topic minting), `CONFIDENCE_FLOOR=0.5`
- [ ] **P3 — Task 6** validity harness: Krippendorff α (nominal, closed form) golden 0.5333 / 1.0, `ALPHA_BAR=0.667` trust gate, review queue
- [ ] **P2/P4 — Task 7** `@gt100k/tagger-stub` adapter (deterministic, CI) + domain index barrel
- [ ] **P4 — Task 8** `@gt100k/tagger-tfy` adapter (native fetch, no SDK, opt-in `tag:live`) + recorded-fixture parse test
- [ ] **P5 — Task 9** public API + `runDemo()` coverage matrix + README

## Done this turn — P0 (Tasks 0–2): scaffold + both taxonomies
- New package `passion/packages/two-axis-tagging` (mirrors `evidence-graph` conventions exactly:
  `type:module`, `main`/`types`→`src/index.ts`, tsconfig extends `../../../tsconfig.base.json`,
  test script `vitest run --root ../.. packages/two-axis-tagging/test`).
- `src/work-modes.ts` — 9 modes in golden order; each has `{id,gloss,produces,examples[],boundaryRules[]}`
  as DATA (§3.2 / §7 — definitions are data so the validity harness can sharpen/merge/split them).
- `src/taxonomy.ts` — 8 golden cabins (§3.1), seed sub-topics, `createTaxonomy()` with `hasPath`,
  idempotent `mintSubTopic` (slugified, parented to an existing cabin, never mints a new cabin),
  `serializePath`, `isCabinId`. `noUncheckedIndexedAccess`-safe (`?.` + `?? false`, no non-null `!`).
- `src/index.ts` barrel exports work-modes + taxonomy (will grow each task).
- Root `tsconfig.json`: **appended** `{ "path": "passion/packages/two-axis-tagging" }` (kept the
  existing evidence-explorer-view entry).

## Gate — GREEN
- `pnpm install` (non-frozen) — workspace symlink created (lockfile already up to date; 10 projects).
- `pnpm exec tsc -b` → exit 0.
- `pnpm test` → **157 passed (38 files)**; my package adds 8 (smoke 1 · work-modes 3 · taxonomy 4).
  Nothing else in the repo broke.

## Self-audit → SC coverage so far
- **SC-1** (stable IDs match the golden list) — **MET**: `taxonomy.test.ts` asserts the exact 8-cabin
  golden array + seed sub-topic paths resolve via `hasPath`; `work-modes.test.ts` asserts the exact
  9-mode golden order + every def has a non-empty gloss and a valid `produces`. Real golden assertions.
- SC-2…SC-8 — not yet (Tasks 3–9).

## NEXT
- **Task 3 (P1 setup): records + `makeArtifact` validator.** Test-first per plan Step 1 (valid gold
  artifact → `tagConfidence:1`, `tagStatus:"PROVISIONAL"`; reject empty afforded set; reject invalid
  domainPath). Then Task 4 (the resolver — the crux, ≥8 golden fixtures). Keep one coherent green
  increment per turn; commit boundary = plan's `git commit` lines.
