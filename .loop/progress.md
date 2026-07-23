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
- [x] **P2 — Task 5** `Tagger` port + suggest→validate→accept pipeline (+ sub-topic minting), `CONFIDENCE_FLOOR=0.5`
- [x] **P3 — Task 6** validity harness: Krippendorff α (nominal, closed form) golden 0.5333 / 1.0, `ALPHA_BAR=0.667` trust gate, review queue + SC-4 resolver→queue wiring
- [x] **P2/P4 — Task 7** `@gt100k/tagger-stub` adapter (deterministic, CI) + domain index barrel
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

## Done this turn — P2 (Task 5): Tagger port + tagging pipeline
- `src/ports.ts` — the async seam: `interface Tagger { suggest(ref: ArtifactRef): Promise<TagSuggestion> }`
  + `ArtifactRef { id, kind, label, url? }`. This is the ONLY async surface; all domain logic stays
  pure/sync. Adapters (Task 7 stub, Task 8 tfy) implement this structural contract — domain never
  imports an adapter (no cycle).
- `src/pipeline.ts` — `CONFIDENCE_FLOOR = 0.5` (golden); `validateSuggestion(tax, s)` returns
  `{ok:true}|{ok:false,reason}` rejecting unknown-cabin / no-modes / invalid-mode /
  low-confidence (`< 0.5`); `acceptSuggestion(tax, ref, s)` validates (throws on invalid), reuses an
  existing sub-topic or **mints** a novel one via `tax.mintSubTopic` (sets `origin:"minted"`), and
  produces an `auto` artifact carrying the suggestion's confidence through `makeArtifact`.
- `test/pipeline.test.ts` (3 tests): valid → `auto` w/ `tagConfidence 0.8`; novel
  `music-sound/modular-synthesis` mints + `hasPath` true; unknown cabin / invalid mode /
  `CONFIDENCE_FLOOR-0.01` all rejected.
- Barrel note: `src/index.ts` still exports work-modes/taxonomy/records only (resolver/ports/pipeline
  join the public barrel at Task 7/9 per plan); pipeline test imports `../src/pipeline.js` directly.

## Gate — GREEN
- `pnpm exec tsc -b` → exit 0. `pnpm test` → **173 passed (41 files)** (+3 from last turn's 170);
  this package's files: smoke 1 · work-modes 3 · taxonomy 4 · records 3 · resolver 10 · pipeline 3.
  No other package regressed.

## Self-audit → SC coverage so far
- **SC-1** (stable IDs) — **MET** (Tasks 1–2).
- **SC-2/SC-3** (resolver invariant + deterministic golden) — **MET** (Task 4; `resolver.test.ts`, 10 golden cases).
- **SC-4** (unresolved result exists) — resolver returns `{ok:false,reason:"unresolved"}` (Task 4);
  the review-queue wiring for it is Task 6 (partial → full at Task 6).
- **SC-5** (pipeline validate/accept/mint/reject) — **MET** this turn (`pipeline.test.ts` asserts
  auto-artifact + confidence passthrough + minted parented sub-topic + rejection of
  unknown-cabin/invalid-mode/low-confidence against `CONFIDENCE_FLOOR=0.5`).
- SC-6 (Krippendorff α + gate + queue), SC-7 (TFY parse), SC-8 (full gate incl. adapters) — not yet
  (Tasks 6–9).

## Done this turn — P3 (Task 6): validity harness
- `src/validity.ts` — `krippendorffAlphaNominal(units)` (nominal closed form
  `α = 1 − (n−1)(n − Σo_cc)/(n² − Σn_c²)`; per-unit coincidence weight `1/(m−1)`, units with <2 ratings
  skipped, degenerate `n==0`/single-category → 1.0); `ALPHA_BAR = 0.667` (golden); `topicTrust(alpha)`
  gate; `applyTrust(artifact, α)` consumer helper (PROVISIONAL→TRUSTED only ≥ bar — the gate is not dead
  code, [D6]); `ReviewItem`/`ReviewQueue` + `createReviewQueue()` (id-keyed Map: idempotent enqueue,
  resolve removes).
- `src/__fixtures__/rater-fixture.ts` — `DISAGREE_UNITS` (2 raters × 4 units over {build,perform},
  hand-verified α **0.5333**) + `PERFECT_UNITS` (3 distinct categories, α **1.0**).
- `test/validity.test.ts` (6 tests): α golden 0.5333 (±0.001) & 1.0 (±1e-6); `topicTrust` gates at bar
  (0.5333→PROVISIONAL, 0.667/1.0→TRUSTED); `applyTrust` promotes only above bar; queue enqueue/resolve;
  **SC-4 wiring** — resolver's `unresolved` fixture result (`wobble`→unresolved) enqueues
  `{id:"synth-01", reason:"unresolved"}`, proving unresolved actions are routed, never guessed.
- α re-verified numerically: `1 − 7·2/30 = 0.53333…` exact.

## Gate — GREEN
- `pnpm exec tsc -b` → exit 0. `pnpm test` → **179 passed (42 files)** (+6 from last turn's 173);
  this package's files: smoke 1 · work-modes 3 · taxonomy 4 · records 3 · resolver 10 · pipeline 3 ·
  validity 6. No other package regressed.

## Self-audit → SC coverage after Task 6
- **SC-1** (stable IDs) — MET (Tasks 1–2).
- **SC-2/SC-3** (resolver invariant + deterministic golden) — MET (Task 4).
- **SC-4** (ambiguous action → `unresolved`, enqueued for review, never guessed) — **now fully MET**
  (`validity.test.ts` "routes an unresolved resolver result to the queue"; resolver half was Task 4).
- **SC-5** (pipeline validate/accept/mint/reject) — MET (Task 5).
- **SC-6** (Krippendorff α golden + trust gate) — **MET** this turn (`validity.test.ts` α 0.5333/1.0 +
  `topicTrust`/`applyTrust` gate at `ALPHA_BAR=0.667`).
- SC-7 (TFY parse), SC-8 (full gate incl. adapters) — not yet (Tasks 7–9).

## Done this turn — P2/P4 (Task 7): StubTagger adapter + domain public barrel
- `passion/adapters/tagger-stub/` — first adapter package: `package.json`
  (`@gt100k/tagger-stub`, `dependencies: { "@gt100k/two-axis-tagging": "workspace:*" }`,
  `test: "vitest run"`), `tsconfig.json` (extends `../../../tsconfig.base.json`, project reference to
  `../../packages/two-axis-tagging`), `src/index.ts` = `class StubTagger implements Tagger`:
  seed lookup keyed by `ref.id` → fixed `TagSuggestion`; unknown ref → deterministic
  `{science-nature, [investigate], confidence:0, "stub-fallback"}` (confidence 0 < `CONFIDENCE_FLOOR`
  so a miss is routed to review, never fabricated as trusted). Structural `Tagger` impl — adapter
  depends on domain, domain never on adapter (no cycle).
- `test/stub.test.ts` (2 tests): seeded ref → exact `domainPath`/`confidence 0.9`; unknown ref →
  fallback `confidence 0` + non-empty modes.
- **Domain public barrel** `passion/packages/two-axis-tagging/src/index.ts` now also exports
  `./resolver.js`, `./ports.js`, `./pipeline.js`, `./validity.js` (was work-modes/taxonomy/records
  only) — this is what the adapters import `Tagger`/`ArtifactRef`/`TagSuggestion` from. No export-name
  collisions across the 7 modules.
- Root `tsconfig.json`: **appended** `{ "path": "passion/adapters/tagger-stub" }` (kept existing 2
  entries). `pnpm install` (non-frozen) ran — 11 workspace projects now, symlink created; lockfile
  unchanged ("Already up to date") but committed per loop rule.

## Gate — GREEN
- `pnpm install` → 11 workspace projects. `pnpm exec tsc -b` → exit 0.
- `pnpm test` → **181 passed (43 files)** (+2 from last turn's 179); new file
  `passion/adapters/tagger-stub/test/stub.test.ts` (2). No other package regressed.

## Self-audit → SC coverage after Task 7
- **SC-1, SC-2, SC-3, SC-4, SC-5, SC-6** — MET (Tasks 1–6, unchanged).
- **SC-5** now additionally has the CI-grade deterministic stub `Tagger` the spec §6 P2 calls for
  (`stub.test.ts`); the pipeline (`pipeline.test.ts`) already proved suggest→validate→accept.
- **SC-8** (full gate incl. adapters) — advancing: the adapter is now inside the composite build +
  test run and is green. Not yet fully MET until Tasks 8–9 land.
- SC-7 (TFY parse) — not yet (Task 8).

## NEXT
- **Task 8 (P4): `@gt100k/tagger-tfy` adapter** (`passion/adapters/tagger-tfy`) — native `fetch`, NO
  SDK, NO external dep, so **no `pnpm install` needed for deps** but a `pnpm install` still runs to
  symlink the new `@gt100k/tagger-tfy` package before `tsc -b` (else TS2307). Files: `src/parse.ts`
  (`parseTfySuggestion(raw): TagSuggestion | null` — validates cabin via `isCabinId`, modes via
  `isWorkMode`, confidence ∈ [0,1]; null on malformed/invalid), `src/index.ts` (`TfyTagger` +
  `tfyConfigFromEnv`), `src/__fixtures__/tfy-response.ts` (recorded response as `.ts`, NOT `.json` —
  repo tsconfig has no `resolveJsonModule`), `test/parse.test.ts` (SC-7: parses recorded fixture,
  null on malformed JSON / invalid mode / unknown cabin), `scripts/tag-live.ts` (opt-in, never in
  gate), `.env.local.example`. Append root tsconfig ref. `tag:live` requires `TFY_API_KEY` — never in
  the gate. Gate green offline.
