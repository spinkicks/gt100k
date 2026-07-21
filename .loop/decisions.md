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
