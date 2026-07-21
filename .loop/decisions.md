# Loop decisions — what was chosen and why (do not re-litigate)

## 2026-07-20 — T002 domain carrier shapes

- Chose `number` aliases for `LevelBand` and `VelocityBand`, matching the data model's ordinal-integer representation and the scalar `LearnerProfile.level` / `velocity` fields. Rejected wrapper objects because they would add an unpinned shape and complicate the golden fixtures.
- Chose literal-`true` markers for the always-on age, schedule, separation, and accommodation rules on `HardConstraints`, alongside `caliper`, `churn`, `nonHarmFloor`, and injected `benefitOf`. This preserves Fixture B's named hard-constraint shape while making those inviolable rules impossible to disable with `false`; rejected ordinary booleans because the spec does not permit opting out of a hard constraint.

## 2026-07-20 — T038 unspecified fixture carriers

- Chose unit weights for Fixture B's unspecified default `ObjectiveWeights`, identical in-caliper `10/10` values for M1–M6, the A-group's deterministic `10..12` pattern for D1–D6, and neutral snapshot metadata (`00000000` candidate hash and zero objective terms) for Fixture C. These values do not alter any pinned golden output; rejected inventing additional scoring or candidate behavior before its ordered task.
- Kept the benefit-free hard-constraint literals as `hardConfig` and exposed a typed `withBenefitOf` builder. B3 injects its pinned map, while B4 must explicitly receive the future production default from T040; rejected duplicating the default formula in fixture code because that could mask a missing or incorrect domain implementation.
- Chose `priorAssignmentId: null` on failed Fixture C `CommitResult`s because no new assignment is committed. Rejected returning the currently active assignment as the failed result's prior snapshot because the spec pins only retained repository state, not a successful lifecycle transition.
