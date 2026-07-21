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

## 2026-07-20 — T013/T021 bounded solver defaults

- Chose greedy-first option ordering with bounded alternative-partition repair: at most 512 complete six-member options per seed and 2,048 partition states, ranked by assigned cohort count first, soft-objective total second, then lexical membership key. Rejected irreversible first-fit because it can strand a feasible second cohort, and rejected exhaustive partitioning because the approved MVP is explicitly bounded rather than optimal.
- Chose at most two deterministic cross-cohort swap passes after construction. Every proposed assignment is lexically normalized, every cohort is rechecked against all hard constraints, and assignment-level churn is checked before a swap is accepted. Rejected cohort-local-only churn checks because multiple individually allowed swaps can exceed the weekly cap in aggregate.
- Derived unpinned snapshot metadata without time or I/O: FNV-1a over the complete candidate-set preimage, a content-derived `asg-*` id, ISO-week Monday as `start`, one week later as `plannedReview`, and arithmetic-mean cohort objective terms. Rejected wall-clock reads and additional function parameters because the settled `assignCohorts` signature supplies only the week key and domain inputs.
- Kept solver exports internal until the ordered T028 public-surface task. Rejected exporting them early because `tasks.md` explicitly groups all remaining US2 exports into that later checkpoint.

## 2026-07-20 — T014/T022 repository atomicity

- Preflight the full incoming roster against the active-assignment map, build replacement maps off to the side, and publish them only after validation. Rejected mutating learner-by-learner because a later duplicate conflict could leave a partial roster active.
- Preserve the injected `benefitOf` function while recursively copying every mutable assignment collection and record. Rejected `structuredClone` because `HardConstraints` deliberately carries that function and the platform clone algorithm cannot clone functions; rejected JSON cloning for the same reason and because it obscures the domain shape.
- Interpret `restore(currentAssignmentId)` through the retained `rollbackRef` (falling back to `priorAssignmentId`), reactivate the exact prior roster, and retain both historical snapshots. Rejected deleting the superseded snapshot because `getSnapshot` and later lifecycle work require immutable history.

## 2026-07-20 — T016/T024 bounded repair carrier

- Treat the `assignment` argument as the already-computed repair proposal and `prior` as the active baseline. The settled three-argument contract has no learner pool from which to generate or re-evaluate a swap, so `repairCohort` owns bounded-automation admission and lifecycle wiring while the solver owns feasible proposal construction; rejected inventing hidden learner data or a second repair search.
- Enforce the base `cap` without consuming recorded exception deltas in the automated path. An over-cap or size-changing proposal returns `staffExceptionRequired` even when an exception record is present, leaving that change to the existing human-owned commit path; rejected letting a prior exception silently widen the bounded-automation envelope.
- Use the proposal's injected `start` and `plannedReview` as the guide-veto window, set `rollbackRef` to the prior snapshot, and target one-click rollback by the repaired assignment ID (the argument accepted by `rollback`). Rejected wall-clock reads, an unpinned veto duration, and a rollback control that points at the prior ID instead of the active repaired snapshot.

## 2026-07-20 — T017/T025/T026 safeguarding hold carrier

- Represent a conflicting in-flight hold by adding an optional literal `paused: true` marker to the supplied move object. The settled route return is `Promise<void>`, so in-place marking makes the POL-007 result observable while leaving unaffected moves byte-for-byte unchanged; rejected changing the return type or rebuilding every move with an unpinned status field.
- Apply conflicting holds before awaiting the human-queue submission. This conservatively freezes affected movement even if the queue adapter fails, while still surfacing the submission error to the caller; rejected allowing a queue failure to leave a safety-conflicting move active.

## 2026-07-20 — T018/T027 post-lock shadow gate

- Inject an iterable of host-authorized locked assignment IDs into `ShadowBenefitEstimator` and copy it into a private set. Rejected a public `markLocked` method because the shadow adapter must not grant lock authority to itself, and rejected coupling the deferred estimator to a repository because the settled port requires only a post-lock logging seam.
- Reject an unlocked call with a stable error. The port returns `Promise<BenefitLCB>`, so returning `undefined` would widen the approved contract, while returning a placeholder before lock would violate FR-019/SC-006.

## 2026-07-20 — T028 public US2 surface

- Published the three injected US2 port types (`CohortRepository`, `SafeguardingSink`, and `BenefitEstimator`) beside the functions that consume or implement them, so package consumers can satisfy the root entrypoint's lifecycle and governance signatures without source-relative imports. Kept the export list explicit and kept `BenefitEstimator` absent from the exact solve/repair tuples; rejected wildcard exports because they could silently widen the public or learned-model boundary.

## 2026-07-21 — T030/T032 synthetic media-source defaults

- Inject a per-room record into `SyntheticMediaTurnSource` and copy every turn at construction and read boundaries. Rejected a single fixed turn array because it would ignore the settled `roomRef` port parameter, and rejected a callback/provider seam because this adapter is intentionally synthetic and contains no I/O.
- Return an empty turn array for an unknown room so missing analytics flows into the existing suppressed/no-status-change behavior. Rejected throwing because absence is an expected FR-024 input condition, distinct from a malformed media-plane operation.
- Expose an immutable runtime status marker with `production: false` and the deferred WebRTC, AudioWorklet, and LiveKit targets. Rejected provisioning any media dependency or relying only on an untestable comment because FR-025/SC-008 require a clearly marked, buildable non-production seam.

## 2026-07-21 — T034 executable documentation contract

- Encoded the README acceptance surface in a focused Vitest contract covering every public function, all five ports and buildable adapters, every deferred production direction, and the synthetic/observable guardrails. Rejected an untested prose-only README because the loop requires a test-first increment and later public-surface changes could otherwise silently make the documentation stale.

## 2026-07-21 — T035 testable synthetic demo

- Exposed the demo orchestration as `runCohortCompilerDemo()` returning a deterministic JSON-safe summary, with the package `demo` command responsible only for printing it. Rejected a console-only script because its end-to-end quickstart claims would not be directly contract-testable.
- Reused the typed golden fixtures and added Fixture C's synthetic A7 to Fixture B's pool, producing two feasible cohorts, one deterministic unassigned learner, and a meaningful two-member in-budget repair that can be committed and rolled back. Rejected live/generated data and a zero-churn repair because neither would make the governance path as legible.
- Imported the sibling safeguarding and shadow adapters through feature-local source paths and added adapter-local TypeScript project references. Rejected adding undeclared package-name imports or updating the shared lockfile, which is outside this feature's allowed shared-file surface.

## 2026-07-21 — T036 focused Vitest root

- Run the `@gt100k/cohort-compiler` test script from the workspace root and filter it to `packages/cohort-compiler/test`. The required filtered command executes scripts from the package directory, while the shared Vitest config intentionally uses workspace-root `packages/**` and `adapters/**` includes; rejected `--passWithNoTests` because it would weaken the gate, and rejected an unfiltered root run because the focused command must prove the domain package independently.

## 2026-07-21 — T102/T109 art-token structure

- Kept `PALETTE` as the exact flat primitive registry and represented `TYPOGRAPHY` as named no-fetch families plus six scale rows and the global `tabular-nums` feature. Rejected CSS variables or external font loading in the pure view package because the app owns rendering and the spec pins a framework-independent token registry.
- Added a minimal semantic `STATE_CUES` registry for assigned, unassigned, satisfied, paused, and suppressed states, with each cue referencing a palette color plus an icon name and text. Rejected leaving color-independence as a test-only table because later 3D, 2D, and Ledger renderers need one deterministic source; layout remains reserved for the dedicated T104/T110 contract.

## 2026-07-21 — T104/T110 layout inputs and package routing

- Kept the contract's one-argument `layoutConstellation(assignment)` behavior and added an optional synthetic pool with an empty default. When supplied, the pool provides field-start values and any pool reference absent from the assignment cohorts becomes a sorted calm bench mote; when absent, assigned motes receive `field: null`. Rejected adding unassigned state to the committed `CohortAssignment` domain type or inventing a second assignment carrier.
- Imported domain types through the compiler's public entrypoint using the repository's feature-local source-path convention and added an explicit package project reference. Rejected updating the shared lockfile merely to create a workspace symlink because shared dependency metadata is outside this feature's permitted files. Anchored the view-package test script at the workspace root so the shared root-relative Vitest globs execute rather than silently finding zero tests.

## 2026-07-21 — T105/T111 standings defaults

- Use the literal `"near-peer"` for the required anonymized band label. Rejected a named tier or level-derived label because those would create the public caste surface the structural guardrail forbids.
- Canonicalize output peers by pseudonym ascending, then gain ascending for a duplicate pseudonym, while copying every row. Rejected preserving caller order because equivalent synthetic inputs should produce byte-identical view output without mutating their arrays.
- Treat the learner's own gain as part of `max(all gains)`, so an empty peer band or a learner already at the band top yields zero own-growth headroom instead of `-Infinity` or a negative deficit. Rejected framing leading growth as debt; Fixture V2 remains pinned at `340 - 300 = 40`.
