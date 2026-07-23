# Loop progress — 011-interest-inference

**Feature COMPLETE.** Pure deterministic Beta-Bernoulli interest-inference engine built to the whole spec.
Gate GREEN: `pnpm exec tsc -b` (exit 0) + `pnpm test` (44 files / 166 tests pass). No network, no LLM,
no external dependency (package.json has zero deps; lockfile only adds the workspace member).

> Note: the prior `progress.md` here was STALE content from a different lane (Emberwood/WORLD).
> Replaced with this lane's real state.

## What landed (all tasks, one increment)
- **Task 0 — scaffold:** `passion/packages/interest-inference/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`;
  appended `{ "path": "passion/packages/interest-inference" }` to root `tsconfig.json` references (kept the
  existing `evidence-explorer-view` entry); ran plain `pnpm install` (non-frozen) → symlinked.
- **Task 1 — P0:** `src/model.ts` (all types, golden constants, `DEPTH_FAMILIES`/`isDepthFamily`,
  `serializeCellKey`, `recencyWeight`, `clamp01`) + `test/model.test.ts`.
- **Task 2 — P1:** `src/fold.ts` (`buildPrior`, `CellAccum`, `foldEvents`) + `test/fold.test.ts`.
- **Task 3 — P2:** `src/posterior.ts` (`toBelief`) + `test/posterior.test.ts` (golden + thin).
- **Task 4 — P3:** `src/aggregate.ts` (`rankCandidates`, `attributionFor`) + `test/aggregate.test.ts`
  (ranking, maker→style, loyalist→domain, multi-sub-topic cabin lock).
- **Task 5 — P4:** `src/inference.ts` (`runInference`), `src/__fixtures__/interest.fixtures.ts`
  (golden events/priors + maker/loyalist grids), `test/golden-e2e.test.ts`, `test/attribution-fixtures.test.ts`,
  `src/demo.ts` + `src/demo-run.ts` + `test/demo.test.ts`, `test/inference.test.ts`, public `src/index.ts`, `README.md`.

## Self-audit — SC → proving test (all met)
- **SC-1** constants + `serializeCellKey` + recency (`0.5^(14/14)=0.5`, age0→1) → `test/model.test.ts` ✓
- **SC-2** prior α bonuses (`1.5`, default `1`, tilts→`2`), `beta_prior=1` → `test/fold.test.ts` (buildPrior) ✓
- **SC-3** folding excludes novelty + prompted, +α returns/depth, +β skips, ignores silence → `test/fold.test.ts` (α=5.5,β=1.5) ✓
- **SC-4** golden cell `mean≈0.7857`, `sd≈0.14507`, `lb≈0.64064`, `evidenceMass=4.5`, `confident=true` →
  `test/posterior.test.ts` **and** end-to-end `test/golden-e2e.test.ts` (through `runInference`) ✓
- **SC-5** thin cell (mass<3) `confident=false`, excluded from candidates → `test/posterior.test.ts` (thin) + `rankCandidates` filter ✓
- **SC-6** candidates = confident ∧ `lb≥0.6`, desc, cap 3, ties by key → `test/aggregate.test.ts` (`["a","d","b"]`) ✓
- **SC-7** attribution maker→`style`, loyalist→`domain` → `test/aggregate.test.ts` + `test/attribution-fixtures.test.ts` (fixture grids) ✓
- **SC-8** `runInference` well-formed (no scalar; candidates ⊆ cells; attribution only on candidates) → `test/inference.test.ts` ✓
- **SC-9** gate green → `tsc -b` exit 0 + `pnpm test` 166 pass ✓

## Demo (spec §2 "printed InterestRead")
`pnpm --filter @gt100k/interest-inference demo` prints an `InterestRead`: one confident candidate cell
`music-sound/audio-systems::build` (mean 0.833, lowerBound 0.692, confident, attribution "mixed"),
no scalar, no fixed label. Verified this turn.

## NEXT
None — feature is done and self-audited; `.loop-done` created. Wiring `009 ActionEvent → CellEvent` is
explicitly out of scope (a later step). A learned low-rank model is deferred (this ships the closed-form proxy).
