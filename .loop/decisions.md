# Loop decisions — what was chosen and why (do not re-litigate)

## 2026-07-20 — T002 domain carrier shapes

- Chose `number` aliases for `LevelBand` and `VelocityBand`, matching the data model's ordinal-integer representation and the scalar `LearnerProfile.level` / `velocity` fields. Rejected wrapper objects because they would add an unpinned shape and complicate the golden fixtures.
- Chose literal-`true` markers for the always-on age, schedule, separation, and accommodation rules on `HardConstraints`, alongside `caliper`, `churn`, `nonHarmFloor`, and injected `benefitOf`. This preserves Fixture B's named hard-constraint shape while making those inviolable rules impossible to disable with `false`; rejected ordinary booleans because the spec does not permit opting out of a hard constraint.

## 2026-07-20 — T038 unspecified fixture carriers

- Chose unit weights for Fixture B's unspecified default `ObjectiveWeights`, identical in-caliper `10/10` values for M1–M6, the A-group's deterministic `10..12` pattern for D1–D6, and neutral snapshot metadata (`00000000` candidate hash and zero objective terms) for Fixture C. These values do not alter any pinned golden output; rejected inventing additional scoring or candidate behavior before its ordered task.
- Kept the benefit-free hard-constraint literals as `hardConfig` and exposed a typed `withBenefitOf` builder. B3 injects its pinned map, while B4 must explicitly receive the future production default from T040; rejected duplicating the default formula in fixture code because that could mask a missing or incorrect domain implementation.
- Chose `priorAssignmentId: null` on failed Fixture C `CommitResult`s because no new assignment is committed. Rejected returning the currently active assignment as the failed result's prior snapshot because the spec pins only retained repository state, not a successful lifecycle transition.

## 2026-07-20 — T039 test-only checkpoint

- Treated T039 as a validation-only increment whose focused test should pass immediately against the already-landed package scaffold and Fixture A, as the spec explicitly requires a green smoke test from iteration 1. Rejected inventing a production export or artificial failing assertion because either would exceed the task and distort the ordered public-API work reserved for T010.

## 2026-07-20 — T004/T007 green increment

- Paired T004's contract test with its T007 implementation in one increment because the loop harness may commit only a green tree. Rejected ending the turn with the intentionally failing T004 suite or weakening it to pass before `withinCaliper` existed.
- Named the pinned Manhattan ordering helper `caliperDistance` and kept it in `caliper.ts` beside `withinCaliper`; rejected embedding the calculation only in later candidate generation because T007 explicitly requires a reusable distance helper and TDD requires direct coverage for new behavior.

## 2026-07-20 — T005/T008 candidate-set ordering

- Chose to preserve the input pool order for the outer `CandidateSet[]`, while applying the spec-pinned distance/ref order only inside each subject's candidate list. This makes repeated runs byte-identical without inventing a full-pool ordering; rejected sorting subjects by private level/velocity or adding an unpinned ranking field.

## 2026-07-20 — T006/T009 candidate-index seams

- Represented the deferred production direction as a concrete `DeferredHnswCandidateIndex` that conforms to `CandidateIndex` but always rejects with a stable not-implemented error. Rejected adding an HNSW/ANN dependency or a passive status constant because the acceptance scenario requires the same port seam to be invocable while remaining explicitly unavailable.
- Made an unknown learner reference an error rather than returning an empty candidate set. This keeps “learner absent from the injected pool” distinct from Fixture A's legitimate `L5` empty-caliper result.

## 2026-07-20 — T010 public domain surface

- Chose explicit named value and type exports from `src/index.ts`. Rejected wildcard re-exports because later modules could leak into the public API, and rejected namespace exports because consumers need direct imports from `@gt100k/cohort-compiler`.
- Kept the T009 adapter's source-relative imports during bootstrap. Package-name imports from the adapter fail without a workspace link, and updating the shared `pnpm-lock.yaml` is outside this feature increment's allowed files. The package contract still verifies package-name imports through its self-reference.
- Widened only `boundaryBenefitByRef` to `Record<string, number>` so the strict declaration build permits lookup by `learnerRef`. Rejected casts or fixture-data changes because the existing map shape, values, and golden expectations are correct.

## 2026-07-20 — T011/T019 feasibility details

- Emit at most the first input-order offending pair for each pairwise hard constraint, while emitting every member below the non-harm floor. This keeps violations deterministic and machine-readable without flooding results with every transitive pair; rejected returning only a boolean or every duplicate pair.
- For the cohort-local `prior?` seam, compute churn as the symmetric membership difference against the prior cohort with greatest overlap, then compare `used + delta` with `cap + recorded exception deltas`. Rejected requiring a complete next assignment that the `isFeasibleCohort(members, hard, prior?)` contract does not receive.
- For a member with no peers, use neutral history `0.5` and full role/rhythm fit `1.0`, avoiding division by zero while preserving the formula's neutral/unique/compatible defaults. Rejected returning `NaN` or adding an unpinned minimum cohort-size rule to the seven-constraint predicate.

## 2026-07-20 — T012/T020 objective defaults

- Normalized every soft term to `[0,1]` and defined the unpinned MVP formulas from existing profile fields: inverse velocity spread for close pace; compatible working-rhythm pair share for intensity; coverage of the fixed `anchor/scout/builder/builder/challenger/scribe` slots for roles; positive/neutral/negative pair values for pair history; at-most-one challenger preference for rivalry dose; inverse symmetric membership churn against the greatest-overlap prior cohort; and the complement of the previously paired share for repeated pairings. Rejected zero-filled placeholder terms and new profile fields because both would weaken the approved model boundary.
- Treated missing optional role/rhythm/history signals as neutral rather than adverse, and made negative history override a contradictory positive flag for the same pair. Rejected penalizing synthetic learners for absent optional metadata or letting duplicate records push a normalized term outside `[0,1]`.
- Kept feasibility outside `scoreObjective`: its input is an already-feasible member set, and callers must apply `isFeasibleCohort` before ranking. Rejected duplicating hard constraints inside the scorer because its contract has no `HardConstraints` input and the spec requires a strict hard/soft separation.
