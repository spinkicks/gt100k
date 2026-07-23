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
- [ ] **P1 — Task 4** engaged-mode resolver (rule table, intersect-afforded, priority, reject-invalid, unresolved→review) + ≥8 golden fixtures — **the crux**
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

## NEXT
- **Task 4 (P1 — the crux): the engaged-mode resolver.** Test-first per plan: write the ≥9-case golden
  fixture `src/__fixtures__/resolver-cases.ts` (synth + mixingDesk artifacts), then `resolver.test.ts`
  asserting each `(RawAction, Artifact)` → exact `{primary, secondary?}` OR `{ok:false, reason}`, PLUS
  the `engagedModes ⊆ affordedModes` invariant loop. Implement `ACTION_MODE_RULES` (priority-ordered)
  + `resolveEngagedModes`: intersect candidates with afforded, empty→`invalid-for-artifact`, unknown
  action→`unresolved`, first kept→primary, next→secondary. This is where SC-2/SC-3/SC-4 get met.
