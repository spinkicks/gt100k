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
- [x] **P1 — Task 3** records: `Artifact`/`ActionEvent`/`RawAction`/`TagSuggestion` + `makeArtifact` validator
- [x] **P1 — Task 4** engaged-mode resolver (rule table, intersect-afforded, priority, reject-invalid, unresolved→review) + 9 golden fixtures — **the crux**
- [ ] **P2 — Task 5** `Tagger` port + suggest→validate→accept pipeline (+ sub-topic minting), `CONFIDENCE_FLOOR=0.5`
- [ ] **P3 — Task 6** validity harness: Krippendorff α (nominal, closed form) golden 0.5333 / 1.0, `ALPHA_BAR=0.667` trust gate, review queue
- [ ] **P2/P4 — Task 7** `@gt100k/tagger-stub` adapter (deterministic, CI) + domain index barrel
- [ ] **P4 — Task 8** `@gt100k/tagger-tfy` adapter (native fetch, no SDK, opt-in `tag:live`) + recorded-fixture parse test
- [ ] **P5 — Task 9** public API + `runDemo()` coverage matrix + README

## Done this turn — P1 (Task 3): records + `makeArtifact` validator
- `src/records.ts` — the record types the whole feature is built on:
  - `Artifact` (§3.3): `domainPath`, `affordedModes`, `kind`, `source`, `origin`, `tagConfidence`,
    `tagStatus`. `RawAction` (§3.5), `ActionEvent` (§3.4), `TagSuggestion` (§4), `DepthSignal`, plus
    the `ArtifactKind`/`TagSource`/`TagOrigin`/`TagStatus` unions.
  - `makeArtifact(tax, input)` validator: rejects a `domainPath` that doesn't resolve in the passed
    taxonomy, rejects an empty afforded set, rejects a non-work-mode; dedups `affordedModes`
    (order-preserving via `[...new Set()]`); `gold` ⇒ `tagConfidence:1`, else `tagConfidence ?? 0`.
  - `tagStatus` always starts `PROVISIONAL` — trust is only conferred later by the validity gate
    (Task 6 `applyTrust`/`topicTrust`), never at construction. This is the §7 decision [D6] made
    concrete: an artifact is not trusted just because it was minted.
- `src/index.ts` barrel grew to also export `./records.js` (work-modes + taxonomy + records now).

## Gate — GREEN
- `pnpm exec tsc -b` → exit 0 (composite build clean; `noUncheckedIndexedAccess`/`verbatimModuleSyntax` ok).
- `pnpm test` → **160 passed (39 files)**; this package now 11 (smoke 1 · work-modes 3 · taxonomy 4 ·
  records 3). No other package regressed.

## Self-audit → SC coverage so far
- **SC-1** (stable IDs match the golden list) — **MET** (Tasks 1–2; `taxonomy.test.ts` + `work-modes.test.ts`).
- **SC-2/SC-3 groundwork** — Task 3 lands the `Artifact`/`RawAction` shapes the resolver consumes and
  `makeArtifact`'s afforded/domain validation; the resolver invariant test itself is Task 4 (NOT yet met).
- SC-4…SC-8 — not yet (Tasks 4–9).

## Done this turn — P1 (Task 4): engaged-mode resolver (the crux)
- `src/resolver.ts` — `ACTION_MODE_RULES` (10 actionTypes → priority-ordered candidate modes) +
  `resolveEngagedModes(artifact, action)`: unknown actionType → `{ok:false, reason:"unresolved"}`;
  intersect candidates with `affordedModes` (order-preserving `.filter`), empty intersection →
  `{ok:false, reason:"invalid-for-artifact"}` (never coerced); first kept → `primary`, next → `secondary`.
  Deterministic on `(RawAction, Artifact)`. `GLOBAL_MODE_ORDER` exported for future tie-break auditing.
- `src/__fixtures__/resolver-cases.ts` — 9 golden `(RawAction, Artifact)` cases over two synthetic
  artifacts (`synth` affords perform/build/investigate; `mixingDesk` affords debug/investigate/explain):
  play→perform, assemble→build, inspect→investigate, tinker→{build,investigate}, write-melody→
  invalid-for-artifact (compose not afforded), wobble→unresolved, fix→debug, teach→explain,
  play(on mixer)→invalid-for-artifact.
- `test/resolver.test.ts` — 10 tests: each fixture asserts exact `{primary, secondary?}` OR
  `{ok:false, reason}`, plus a loop proving `engagedModes ⊆ affordedModes` on every ok result.

## Gate — GREEN
- `pnpm exec tsc -b` → exit 0 (composite build clean).
- `pnpm test` → **170 passed (40 files)**; this package now 21 (smoke 1 · work-modes 3 · taxonomy 4 ·
  records 3 · resolver 10). No other package regressed.

## Self-audit → SC coverage after Task 4
- **SC-2** (`engagedModes ⊆ affordedModes` for every valid action; non-intersecting → **rejected**, not
  coerced) — **MET** (`resolver.test.ts` subset-invariant loop + the two `invalid-for-artifact` cases).
- **SC-3** (deterministic resolver golden: exact primary+secondary, priority-ordered) — **MET** (the 9
  golden fixture cases in `resolver.test.ts`).
- **SC-4** (ambiguous/unknown action → `unresolved`, never guessed) — **resolver half MET** (the
  `wobble → unresolved` case). The *enqueue-to-review-queue* half is Task 6 (`createReviewQueue`); not
  yet wired. SC-4 not fully met until Task 6.
- SC-1 — still MET (Tasks 1–2). SC-5…SC-8 — not yet (Tasks 5–9).

## NEXT
- **Task 5 (P2): `Tagger` port + tagging pipeline.** Test-first per plan: `test/pipeline.test.ts`
  (accept valid suggestion → `auto` artifact w/ its confidence; mint a novel sub-topic on accept;
  reject unknown cabin / invalid mode / confidence < `CONFIDENCE_FLOOR=0.5`). Implement `src/ports.ts`
  (`Tagger`, `ArtifactRef`) + `src/pipeline.ts` (`CONFIDENCE_FLOOR`, `validateSuggestion`,
  `acceptSuggestion` minting novel sub-topics via `tax.mintSubTopic`). This is where SC-5 gets met.
