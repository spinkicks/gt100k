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

## 2026-07-21 — T106/T111 current-floor truthfulness

- Set every arena seat's `holdingFloor` marker to `false` because the settled `TurnAnalysis` input contains aggregate speaker descriptors and patterns but no current-speaker or turn-sequence carrier. Rejected treating the highest turn share or a dominance subject as the current floor holder because that would invent live state from historical aggregates; a later pulse may activate only when a truthful observable carrier exists.

## 2026-07-21 — T107/T111/T112 composed-view defaults

- Carried the rollback membership diff in `LedgerView.announce` as `removed:[…]; added:[…]`. Rejected adding an unpinned diff field to the settled Ledger shape; the existing polite live-region carrier is the accessible place for a display-only assignment change.
- Use the accepted hard floor as the conservative displayed lower bound when `pool` is omitted or incomplete; when the optional synthetic pool is present, compute the exact minimum through the injected domain `hard.benefitOf` function. Rejected inventing missing learner profiles or making the spec-explicit optional pool mandatory.
- Use stable kebab-case identifiers for the seven satisfied badge rows and require both the view flag and the optional standings payload's opt-in marker before exposing standings. Rejected human-label-only badge values and either opt-in source unilaterally enabling a comparison surface.

## 2026-07-21 — T108 structural guardrail scope

- Treat `position` as prohibited specifically on the public `StandingsView` ranking surface, while retaining the spec-required camera and 3D geometry positions in `ConstellationView`. The guardrail contract imports the public entrypoint types, recursively checks output keys, and scans the owning standings/RivalryMix source modules for forbidden field declarations. Rejected a package-wide text ban on `position` because it would directly contradict FR-028/FR-031 and the pinned 3D layout contract.

## 2026-07-21 — T113 fixture isolation

- Build Fixture V1's input from the already-typed synthetic domain Fixture B and deterministic public domain functions, while pinning every asserted view value explicitly in the view fixture. Rejected copying a second learner/assignment dataset that could drift from Fixture B, and rejected generating expected view output through `buildCohortArenaView` because that would make the golden self-validating.

## 2026-07-21 — T114 accessibility media hook

- Keep the spec-required `prefers-reduced-transparency` media query and suppress Biome's `noUnknownMediaFeatureName` diagnostic only on that at-rule. Rejected removing the accessibility preference or disabling the rule globally; Biome 1.9's CSS registry lags the Safari-exposed preference, while the fallback declaration remains harmless in browsers that do not support it.

## 2026-07-21 — T115 synthetic client composition

- Construct the synthetic assignment and pool in an app-owned pure factory, then build the single `CohortArenaView` once at module scope for every renderer region. Rejected importing test fixtures into production or recomputing separate 3D, HUD, 2D, and Ledger state because both would weaken the one-view parity boundary.
- Add an app-local `vitest.config.mts` for focused app contracts. Rejected changing the shared root Vitest include, accepting a no-tests run, or leaving the deterministic app composition without a RED/GREEN contract.
- Preserve the view package's emitted-ESM `.js` implementation specifiers through an app-local Next extension alias, but use extensionless re-exports at its public source entrypoint so webpack can statically discover named exports. Rejected suppressing the warning, relying on generated `dist`, or reaching into the package through an app-relative private source import.
- Schedule T118 and T119 before the richer T116 3D choreography because the operator explicitly requires the accessible/2D tier before 3D polish and `tasks.md` marks T116–T119 parallel once T115 exists. Rejected treating numeric task order as stronger than the stated MVP-first build order.

## 2026-07-21 — T118 accessible tree foundation

- Make the `role="tree"` composite the single keyboard Tab stop and identify the first expanded cohort through `aria-activedescendant`; keep every member and constraint visible as nested `treeitem` text. Rejected putting every tree item in the Tab sequence because that creates a long, non-standard navigation path; T132 owns the richer Arrow/Enter/Escape behavior on this foundation.
- Pair every satisfied state with a square check marker and the explicit `satisfied` text, while member assignment uses a distinct circular marker plus `assigned` text. Rejected color-only state because FR-040/FR-045 require shape, icon, and text parity.
- Configure the app-local Vitest transform for the automatic JSX runtime used by Next. Rejected adding a classic-runtime `React` import only for the test harness because the mismatch belongs at the app-local Vitest boundary.

## 2026-07-21 — T119 static-tier preference precedence

- Resolve plain mode before the reduced-motion setting, then interpret `NEXT_PUBLIC_REDUCED_MOTION_DEFAULT=on|off` as an explicit operator override; `system`, an unset value, or an invalid value conservatively follows `useReducedMotion`. Rejected letting `off` defeat plain mode because FR-044 makes plain mode a low-spectacle path, and rejected treating an invalid value as `off` because the safe default is to honor the system preference.
- Keep the synthetic `CohortArenaView` module-scoped and switch renderers without rebuilding domain state. The optional test-factory flags exist only to prove `plainViewEquals` and reduced token resolution; the runtime 3D, 2D, HUD, and Ledger receive the same `VIEW` object. Rejected building separate reduced/plain runtime views because parity is stronger when renderer selection cannot alter the domain projection.
- Hide the decorative SVG geometry from assistive technology while rendering the same roles, constraints, floor, static compile announcement, and full Cohort Ledger in semantic DOM. Rejected making the SVG the sole state carrier because SC-014/SC-015 require keyboard and screen-reader parity independent of WebGL or motion.

## 2026-07-21 — T116 observatory motion and resource lifecycle

- Project the existing `CohortArenaView` into an app-local immutable scene model, using each mote's injected caliper-field position as its compile origin and its committed constellation position as its target. Parse the public `EASINGS` tokens once for r3f frame interpolation and cap the settled overshoot at the pinned `1.04`; rejected a second animation library, duplicated motion constants, or renderer-owned layout math.
- Keep the camera follow-free and run the full 3D canvas continuously only while that tier is selected, so the 900ms compile and 9000ms low-amplitude drift use `useFrame` without controls or wall-clock reads. Rejected `frameloop="demand"` because ambient drift would require a parallel invalidation scheduler, and rejected `OrbitControls` because the pinned camera is calm and non-following.
- Allocate the shared star/badge geometries and materials once per view, opt those instanced resources out of automatic disposal, and dispose them explicitly on lifecycle cleanup; declarative rings, lines, halos, and postprocessing remain owned by r3f. Render unassigned bench motes through the same star choreography with a separate calm pending material. Rejected one mesh per learner and a blue assigned treatment for pending learners.

## 2026-07-21 — T117 roster HUD motion boundary

- Keep roster state sourced directly from the one module-scoped `CohortArenaView` and pass only the selected presentation tier's reduced-motion boolean into the HUD. Rejected rebuilding a second reduced view or adding an app-local roster presenter because either would weaken parity or duplicate the committed view model.
- Convert the public CSS `EASINGS` token at the Motion boundary and use `resolveMotion("memberSwap", ...)` for card/member FLIP timing. Rejected duplicating cubic-bezier constants or accepting Motion's default spring because every interaction value must remain traceable to the pinned registry.
- Apply the required `0.97` press feedback to the existing plain-mode button, the only current HUD control, instead of inventing an "inspect cohort" action on otherwise informational cards. Rejected clickable non-actions because they would add an unpinned affordance and keyboard burden.

## 2026-07-21 — T120 seed-art vocabulary

- Commit nine 24px geometric SVGs: the five scene motifs (`star`, `hex`, `badge`, `floor-halo`, `seat`) plus the existing `STATE_CUES` icon vocabulary (`hex`, `bench`, `check`, `shield`, `veil`). Rejected inventing a parallel icon naming system because the pure view package already pins the semantic cue names consumed by every renderer.
- Give each asset an accessible title, a pinned palette default, and `currentColor` geometry with no filters, scripts, raster data, or remote references. Rejected generated bitmap art and decorative gradients because the spec requires small inline/procedural seed art that remains deterministic and overrideable.
- Keep the r3f renderer's existing `IcosahedronGeometry`, `OctahedronGeometry`, rings, circles, and lines as the active procedural fallback instead of adding a texture or model loader. Rejected wiring the seed files into a network-style loading path because FR-042 requires the app to run without external fetch and T120 only requires committed seed art plus a deterministic primitive fallback.

## 2026-07-21 — T121 production runtime smoke

- Run the seeded smoke against `next start` after a real production build and require an actual WebGL2 context. Rejected a source-only/HTML-only check and the development server because neither proves SC-014's production client mount, zero runtime errors, or renderer cleanup.
- Exercise live Canvas unmount/remount through the existing plain-mode control, then reload with `prefers-reduced-motion: reduce` for the system-preference path. Rejected requiring Playwright's post-hydration media emulation to notify Motion's hook because the pinned behavior is to honor the preference at render startup; the live plain-mode switch already supplies the deterministic unmount/disposal proof.
- Set `aria-hidden="true"` directly on `gl.domElement` during r3f creation while retaining the declarative Canvas prop. Rejected accepting an aria-hidden wrapper as equivalent because SC-014 and FR-040 explicitly name the canvas, and the browser smoke proved the generated canvas otherwise lacked the attribute.
- Keep Playwright app-local and route its ephemeral results into `.next`. Rejected shared test configuration/lockfile edits and committed runtime artifacts because this feature owns only its new app directory until final T136.

## 2026-07-21 — T122 own-growth standings rendering

- Keep `StandingsPanel` stateless over the shared `view.standings` carrier and return no markup for `null`; retain Fixture V2's synthetic payload behind the existing default-false `standingsOptIn` flag. Rejected adding local opt-in state during T122 because T123 owns the control and a second state source could diverge from the composed view.
- Scale the own-growth bar against the derived near-peer band top (`selfGain + gainToBandTop`), clamped to `[0,1]`, without adding a renderer-owned domain field. Rejected a full-width decorative bar because it would conceal the exact remaining headroom and a peer-ordered bar set because it could imply a ranking.
- Keep the animated ticker hidden from assistive technology while exposing the exact final own-gain value as static screen-reader text; reduced/plain presentation renders the final number and bar immediately. Rejected announcing every animation frame because it would create noisy, motion-timed output instead of one stable state.

## 2026-07-21 — T123 interactive view recomposition

- Recompose and memoize one `CohortArenaView` from the three primitive runtime preferences (`plainMode`, the resolved reduced-motion tier, and `standingsOptIn`), then pass that same object to every renderer and the Ledger. This supersedes only the module-scoped-view portion of the T115/T119 decisions now that a spec-required flag is interactive; rejected local panel-only state or independently rebuilt renderer projections because either would let the visual and accessible standings surfaces diverge.
- Keep the standings control as a conventional pressed button whose visible name changes between `Standings off` and `Standings on`, with `aria-controls` referencing both conditional outputs. Rejected a custom switch or animated reveal because the pinned frequent-action token is instant and the product surface benefits from a familiar, keyboard-native affordance.

## 2026-07-21 — T124 domain-authoritative churn presentation

- Read the base cap and already-used membership changes only from the injected domain `ChurnBudget`; derive remaining capacity as `max(0, cap - used)`. Sum the existing `view.cohorts[].churnDelta` carriers only for a separately labeled `display only` readout. Rejected subtracting the view delta from remaining capacity or re-deriving membership churn in the renderer because either would let an uncommitted visualization impersonate domain budget consumption.
- Bound the visual and ARIA meter at the base cap while retaining the exact used value in text and `aria-valuetext`; when domain exceptions permit used churn above the base cap, label that state `Recorded exception`. Rejected an overflowing meter or a hard-coded within-budget label because both would misrepresent a valid recorded-exception path.

## 2026-07-21 — T125 immutable rollback presentation

- Build the current A7 and prior A6 snapshots independently from immutable domain assignments, then select one shared `CohortArenaView` for every renderer during rollback. Rejected mutating the current assignment or retargeting only the canvas because either would violate SC-016 or desynchronize the HUD/2D/Ledger presentation.
- Keep both snapshot members in one stable instanced star carrier and animate each new target from its live transform. Rejected separate assigned/pending instance groups because A6/A7 would remount when their snapshot state changes, discarding the presentation position needed for an interruptible reversal.

## 2026-07-21 — T127 truthful arena pulse and frame ownership

- Reused the T106 aggregate-truth decision: the Fixture V3 `TurnAnalysis` supplies exact seats, descriptors, patterns, and confidence but no current-speaker carrier, so the production summary renders all `holdingFloor` flags false. The 3D and 2D renderers activate their pulse/static highlight only when a truthful `SeatView.holdingFloor` marker is supplied; rejected treating dominance or highest historical turn share as a live floor holder.
- Use an on-demand r3f frame loop for an absent/static floor holder and switch to `always` only while a truthful holder needs the pinned 1200ms pulse. Rejected continuously rendering the otherwise static second Canvas because the production smoke showed it could exhaust the 30s behavioral-test budget under software WebGL.

## 2026-07-21 — T128 observable evidence geometry

- Derive a dominance ring only from an observable `dominance` pattern and that subject seat's exact turn share. Derive an interruption arc only when a `repeated_interruption` subject and a distinct truthful `holdingFloor` seat both exist; rejected aiming an aggregate interruption at the dominant/highest-share speaker because `TurnAnalysis` does not identify the interrupted floor holder and the UI must not invent one.
- Animate the exact partial torus and raised bezier once through the pinned `dominanceRing`/`interruptionArc` tokens, requesting demand-loop frames only until each entrance settles. Keep continuous frames owned solely by the already-truthful turn-holder pulse; rejected looping historical evidence indefinitely and rejected a 2.4-world-unit arc in favor of a restrained 2.4px line.

## 2026-07-21 — T129 suppression and missing-analytics states

- Treat a null rivalry view or a zero-seat rivalry view as the same neutral `analytics off` presentation. Rejected adding an unpinned status field to `ArenaRoomView`, and rejected presenting an empty/refused input as low confidence because Fixture E and SC-013 require no status change for missing analytics.
- For non-empty `suppressed:true` rooms, animate only the pinned 300ms `suppressVeil` fog uniforms through the existing demand frame loop, lower scene lighting/emissive energy, and retain exact icon/shape/text in both 3D and static tiers. Rejected a perpetual render loop, a new animation dependency, or any pattern geometry under suppression.

## 2026-07-21 — T130 observable-only Ledger boundary

- Keep active, suppressed, and analytics-off RivalryMix accessibility state inside the existing `LedgerView.rivalryList`, sourced from the shared pure view. Rejected renderer-side inference because it could diverge from the canvas/2D state, and rejected widening the settled Ledger contract with another status field.
- Format confidence and turn share as deterministic percentages rounded to one decimal, preserve observable interruption counts and approved pattern evidence, retain speaker descriptors under suppression, and surface the exact neutral analytics-off text for null or zero-seat input. Rejected raw fractional shares because repeating decimals are poor screen-reader copy.
- Treat speaker identifiers and evidence as untrusted at the pure view boundary: preserve safe opaque references, alias unsafe/prohibited references, admit only the two typed observable pattern kinds and their generated evidence grammars, and fall back to neutral threshold evidence. Reapply the sanitizer in public `buildLedger` for defense in depth. Rejected rendering arbitrary evidence because a structurally safe field can still carry a prohibited trait label as text.

## 2026-07-21 — T131 display-only safeguarding projection

- Complete the existing pure view seam with an optional `{ pending, activeMoves }` safeguarding input, then derive copied pending events and only the moves whose touched refs intersect an affected member. Rejected an app-only `SafeguardingView` override and rejected accepting a precomputed bypass boolean because the view contract explicitly requires a `CohortHealthEvent` to produce the conflicting-move display state without mutating the domain.
- Freeze only star instances touched by a paused move at their live presentation positions and tint them with the pinned safeguard token; every unrelated star continues its existing compile/rollback frame updates. Rejected freezing an entire cohort or changing assignment membership because the hold is display-only and POL-007 is move-specific.
- Animate only a decorative shield sweep while keeping the banner copy visible from first paint; reduced/plain mode resolves the same state instantly and the Ledger remains the assistive-technology alert. Rejected hiding or moving the content during the sweep, alarm-red treatment, flashing, and programmatic focus theft.

## 2026-07-21 — T132 single-stop Ledger navigation

- Extend the T118 `aria-activedescendant` foundation as a single-tab-stop composite: Up/Down/Home/End traverse visible nodes, Right/Left enter or collapse branches, Enter toggles the active cohort for switch users, and Escape returns to and collapses its parent cohort. Rejected putting all 28 tree items in the Tab sequence because that would create a long non-standard path and make the supporting Ledger state harder to reach.
- Reuse the pinned `STATE_CUES` names for assigned, unassigned, satisfied, suppressed, and paused marks, while neutral observable/analytics-off items receive explicit non-semantic marks and text. Rejected color-only styling and a new icon vocabulary; the app contains no sound surface, so no caption carrier is invented.

## 2026-07-21 — T133 adaptive 3D performance tiers

- Treat a frame as over budget above 25ms and require at least 270 misses in a 360-frame window before changing tiers. The first sustained miss moves full 3D to degraded 3D; a second complete miss window moves to 2D. Rejected reacting to a single long frame or short startup window because shader compilation, background scheduling, and ordinary jitter must not discard the spatial tier.
- Keep one app-level runtime state for both canvases: WebGL2 absence or a context-loss event from either canvas moves directly to the existing state-identical `project2D` tier, while the HUD, Ledger, standings, rollback, and preference state remain mounted. Rejected independent canvas-local fallbacks because they could desynchronize the observatory and RivalryMix room or strand controls behind a failed renderer.
- In degraded 3D, render exactly half of the learner-star instances deterministically while retaining every safeguarding-paused learner, lower DPR to 1, disable antialiasing and bloom/postprocessing, and keep shadows off; badges, floor guarantees, HUD, and Ledger remain complete. Rejected sampling away paused learners or changing the underlying `CohortArenaView`, because performance degradation may reduce spectacle but cannot erase safety state or domain truth.
