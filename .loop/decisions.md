# Loop decisions — what was chosen and why (do not re-litigate)

## 2026-07-20 — T002 domain carrier shapes

- Chose `number` aliases for `LevelBand` and `VelocityBand`, matching the data model's ordinal-integer representation and the scalar `LearnerProfile.level` / `velocity` fields. Rejected wrapper objects because they would add an unpinned shape and complicate the golden fixtures.
- Chose literal-`true` markers for the always-on age, schedule, separation, and accommodation rules on `HardConstraints`, alongside `caliper`, `churn`, `nonHarmFloor`, and injected `benefitOf`. This preserves Fixture B's named hard-constraint shape while making those inviolable rules impossible to disable with `false`; rejected ordinary booleans because the spec does not permit opting out of a hard constraint.
