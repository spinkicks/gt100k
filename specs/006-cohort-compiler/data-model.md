# Phase 1 Data Model: Cohort Compiler + RivalryMix

All identifiers are pseudonymous; no real PII (Constitution V; synthetic-only). Entities align to the PRD §28 public contracts `CohortAssignment` and `CohortHealthEvent`. The domain is pure: no wall-clock (time is passed in), no randomness, no I/O.

## AgeBand (enum)

`a6_8 | a9_11 | a12_14` — the developmental bands (PRD §14.13). Cohorts match within a band (hard constraint).

## LevelBand / VelocityBand (value)

Private, ordinal matchmaking inputs (PRD §15). Represented as integers (e.g. `0..N`).

| Field | Type | Notes |
|---|---|---|
| `level` | number | private level rating (ordinal); matchmaking input only |
| `velocity` | number | private pace/velocity rating (ordinal); matchmaking input only |

> These are **inputs only**. No fixed-ability caste rank, public tier name, or full-field ranking is derived from them (FR-006; G6).

## ScheduleAvailability (value)

| Field | Type | Notes |
|---|---|---|
| `blocks` | string[] | availability block keys (e.g. `"mon-pm"`); two learners are schedule-compatible if they share the required overlap |

## Accommodations (value)

| Field | Type | Notes |
|---|---|---|
| `needs` | string[] | accommodation tags (synthetic); stored separately from performance evidence (Constitution VI). Also the input to the benefit **accommodation-compatibility** factor: a need is *met* iff no peer conflicts with it |
| `conflicts` | string[] | optional incompatible-setting tags used only to test compatibility (never a protected-class proxy). The hard accommodations constraint rejects only a **mutual** block; a one-directional block is hard-feasible but lowers benefit |

## PairFlag (value) — prior-pairing history

One flagged prior pairing outcome for the benefit **prior-pairing-history** factor. Distinct from the hard
safeguarding `separations` (which is an inviolable keep-apart, not a soft friction signal).

| Field | Type | Notes |
|---|---|---|
| `ref` | string | the other learner's `learnerRef` in the prior pairing |
| `flag` | `positive \| negative` | reward a positive prior pairing; penalize a previously-flagged negative one |

## Role / WorkingRhythm (enums) — pace/role fit inputs

- **Role** (`preferredRole`): `anchor \| scout \| builder \| challenger \| scribe` — a learner's preferred
  working role (a working-style attribute, **independent of level/velocity**). Distinct from the assigned
  output role vector on `Cohort`.
- **WorkingRhythm** (`workingRhythm`): `steady \| burst \| flex` — working rhythm. Compatibility:
  `compatible(a,b) = a === "flex" OR b === "flex" OR a === b` (absent → treated as `flex`).

## LearnerProfile

Input to candidate generation and the solver (FR-001).

| Field | Type | Notes |
|---|---|---|
| `learnerRef` | string | pseudonymous learner id (no PII) |
| `ageBand` | AgeBand | hard-constraint dimension |
| `schedule` | ScheduleAvailability | hard-constraint dimension |
| `accommodations` | Accommodations | hard-constraint dimension; no penalty (Constitution VI) |
| `level` | number | private level band (matchmaking input) |
| `velocity` | number | private velocity band (matchmaking input) |
| `separations` | string[] | safeguarding-separation `learnerRef`s to keep apart (hard) |
| `priorAssignmentRef` | string \| null | prior `CohortAssignment` id (for churn/rollback) |
| `pairHistory` | PairFlag[]? | prior-flagged `positive`/`negative` pairings (default `[]`); benefit **prior-pairing-history** input, **caliper-independent** |
| `preferredRole` | Role? | preferred working role (default: absent → treated as unique); benefit **pace/role-fit** input, **caliper-independent** |
| `workingRhythm` | WorkingRhythm? | working rhythm (default: absent → treated as `flex`); benefit **pace/role-fit** input, **caliper-independent** |

## Caliper (value)

The near-peer bound (FR-002).

| Field | Type | Notes |
|---|---|---|
| `levelTolerance` | number | max allowed level distance to be near-peer |
| `velocityTolerance` | number | max allowed velocity distance to be near-peer |
| `k` | number | max candidates returned per learner (kNN cap) |

## CandidateSet

Output of candidate generation for one learner (FR-002–FR-004).

| Field | Type | Notes |
|---|---|---|
| `learnerRef` | string | the subject learner |
| `candidates` | `{ ref: string; distance: number }[]` | within-caliper peers, sorted by `distance` then `ref` (deterministic) |
| `hash` | string | stable candidate-set hash over the ordered refs (determinism, SC-001) |

**Invariants**: excludes `learnerRef` itself and all `separations`; every candidate is within **both** calipers; ordering + hash are deterministic (FR-003/FR-004).

## HardConstraints (value)

The inviolable set the solver checks (FR-007/FR-008).

| Constraint | Rule |
|---|---|
| age | all members share an `ageBand` |
| schedule | all members are pairwise schedule-compatible (required overlap present) |
| safeguarding separation | no two members are in each other's `separations` (§15.2) |
| accommodations | no incompatible accommodation settings within a cohort |
| level-velocity caliper | all members pairwise within the `Caliper` (near-peer) |
| individual non-harm floor | **every** member's individual benefit ≥ the per-learner floor (hard, per-learner; **never averaged**, FR-009); benefit is a **real, caliper-independent** composite |
| churn budget | membership changes vs. prior snapshot ≤ the weekly `ChurnBudget.cap` (FR-016) |

**Config carriers** (fields on `HardConstraints`): `nonHarmFloor: number` (default `0.5`) and an **injected** `benefitOf(member, cohort) => number` used by the non-harm-floor check.

The floor rule is fixed: **reject the cohort if ANY member's `benefitOf(m,C) < nonHarmFloor`**, never averaged; the boundary is **inclusive**. `benefitOf` is **injectable** (production may supply a richer signal), and the MVP ships a concrete **default** — a deterministic composite of three factors **independent of the level/velocity caliper** (so the floor is not toothless):

`benefitOf(m,C) = 0.40·acc(m,C) + 0.35·hist(m,C) + 0.25·pace(m,C) ∈ [0,1]`

- `acc` — accommodation compatibility (fraction of `m.accommodations.needs` not blocked by a peer conflict; `1.0` if no needs).
- `hist` — prior-pairing history: `clamp01(0.5 + 0.5·pos/P − 1.0·neg/P)` over `m.pairHistory` restricted to peers (`P = |C|−1`; negatives penalized twice as hard as positives reward).
- `pace` — pace/role fit: `0.5·roleFit + 0.5·rhythmFit`, `roleFit = 1 − dupRole/P`, `rhythmFit = compatiblePeers/P`.

Full definitions and the derivation live in [spec.md § Golden Values → Pinned formulas](./spec.md#pinned-formulas-used-by-the-golden-fixtures). Golden [Fixture B4](./spec.md#fixture-b4-nonharm-default-bind-us2) asserts the **default** formula binds (mean `0.705 ≥ 0.5`, `D6 = 0.43` → rejected); [Fixture B3](./spec.md#fixture-b3-nonharm-reject-us2) injects an explicit map to assert the same per-member rule independent of the formula. The default `benefitOf` is implemented in `packages/cohort-compiler/src/benefit.ts`.

## ObjectiveWeights / ObjectiveTerms (value)

Deterministic **soft** scoring that ranks *feasible* assignments only (FR-013). Never overrides a hard constraint.

| Term | Meaning |
|---|---|
| `closePace` | reward tighter pace spread |
| `compatibleIntensity` | reward compatible intensity/dose settings |
| `roleCoverage` | reward covering needed roles |
| `pairHistory` | reward/penalize prior successful/failed pairings |
| `rivalryDose` | keep rivalry dose in band (a soft term, not a hard cap) |
| `churn` | penalize unnecessary membership change |
| `repeatedPairings` | discourage over-repeating the same pairs |

`ObjectiveTerms` is the per-assignment breakdown (one value per term) stored on the snapshot; `ObjectiveWeights` are the deterministic weights applied to produce the scalar rank.

## Cohort

| Field | Type | Notes |
|---|---|---|
| `members` | `{ ref: string; role: string }[]` | exactly six unless a recorded size exception (FR-010) |

## CohortAssignment (snapshot — §28)

The committed snapshot (FR-014; §28 `CohortAssignment`).

| Field | Type | Notes |
|---|---|---|
| `id` | string | assignment/snapshot id |
| `cohorts` | Cohort[] | the compiled cohorts |
| `memberRefs` | string[] | all assigned `learnerRef`s (for one-active-per-learner enforcement) |
| `levelBands` | `{ level: [number, number]; velocity: [number, number] }` | band ranges covered |
| `candidateSetHash` | string | hash of the candidate sets the solve used |
| `objectiveTerms` | ObjectiveTerms | soft-score breakdown |
| `constraints` | HardConstraints ref | the hard-constraint config in force |
| `start` | string | ISO start time (passed in, not clock-read) |
| `plannedReview` | string | ISO planned-review time |
| `priorAssignmentId` | string \| null | prior snapshot (rollback source) |
| `rollbackRef` | string \| null | reference used to restore the prior snapshot |
| `sizeExceptions` | `{ cohortIndex: number; approvedBy: string; reason: string }[]` | staff-approved non-six cohorts (FR-010) |

**Invariants**: one active assignment per learner (FR-011); six per cohort unless a `sizeException` (FR-010); hard constraints all honored (FR-008); churn within budget unless a recorded exception (FR-016).

## ChurnBudget (value)

| Field | Type | Notes |
|---|---|---|
| `weekKey` | string | the week the budget applies to (passed in) |
| `cap` | number | max membership changes this week |
| `used` | number | changes already applied this week |
| `exceptions` | `{ approvedBy: string; reason: string; delta: number }[]` | safety-owner-recorded over-budget approvals (FR-016) |

## CommitResult (value)

| Field | Type | Notes |
|---|---|---|
| `ok` | bool | whole-roster commit succeeded (atomic) |
| `assignmentId` | string \| null | committed snapshot id when `ok` |
| `priorAssignmentId` | string \| null | retained prior snapshot for rollback |
| `reasons` | string[] | machine-readable reasons when `!ok` (e.g. `churn-exceeded`, `duplicate-active-assignment`) |

## CohortHealthEvent (§28)

A bullying/coercion/exclusion report (FR-018; §28 `CohortHealthEvent`).

| Field | Type | Notes |
|---|---|---|
| `assignmentId` | string | the assignment context |
| `reporterRef` | string | pseudonymous reporter |
| `eventClass` | `bullying \| coercion \| exclusion \| other` | class of concern |
| `affectedMembers` | string[] | affected `learnerRef`s |
| `severity` | `low \| medium \| high` | triage severity |
| `evidenceScope` | string | what evidence is attached (synthetic) |
| `immediateAction` | string | action taken |
| `safeguardingLink` | string | link/handle into the safeguarding workflow |
| `followUpOwner` | string | named human owner |

**Invariants**: bypasses optimization → human sink; pauses conflicting cohort moves (POL-007); **cannot** reduce a learner's rating; peers receive **aggregated** health data only (§15.2, G7).

## TurnEvent (RivalryMix input)

One observable speaking turn (FR-020).

| Field | Type | Notes |
|---|---|---|
| `speaker` | string | pseudonymous speaker ref |
| `start` | number | turn start (ms or ordinal; passed in) |
| `duration` | number | turn duration |
| `overlap` | boolean | whether this turn began while another speaker held the floor (interruption signal) |
| `quality` | number? | optional 0..1 input-quality/confidence signal (packet loss / audio noise proxy) |

## TurnAnalysis (RivalryMix output)

Observable-only result (FR-020–FR-023).

| Field | Type | Notes |
|---|---|---|
| `perSpeaker` | `Record<speaker, { turnShare: number; speakingTime: number; interruptions: number }>` | observable descriptors |
| `patterns` | `{ kind: "dominance" \| "repeated_interruption"; evidence: string; subjects: string[] }[]` | detected patterns with triggering evidence |
| `confidence` | number | 0..1; lowered by missing/low-quality input |
| `suppressed` | bool | true when confidence < threshold → no patterns surfaced (FR-023) |

> **Prohibited by construction**: `TurnAnalysis` has **no** field for honesty, emotion, personality, or motivation, and none may be added (FR-022; G5/G6). Refused/missing analytics produce a `suppressed` result and change no status (FR-024).

## BenefitLCB (shadow — deferred)

Peer-effect causal-uplift lower-confidence-bound (FR-019; §15).

| Field | Type | Notes |
|---|---|---|
| `assignmentId` | string | the **locked** assignment it annotates |
| `lcb` | number | placeholder lower-confidence-bound (shadow) |
| `loggedAt` | string | post-lock timestamp (passed in) |
| `shadow` | `true` | always shadow; never read during a solve/repair |

## State transitions

```text
POOL (LearnerProfile[])
  -- generateCandidates(pool, caliper) --> CandidateSet[]        (US1; deterministic, hashed)
  -- assignCohorts(candidates, hard, weights, churn) --> CohortAssignment (proposed)   (US2)
       * every cohort feasible (all HardConstraints hold) or learner reported unassigned
  -- commit(repo, assignment, churn) --> CommitResult            (US2; atomic, one-active-per-learner)
       * ok  → prior snapshot retained as rollbackRef
       * !ok → nothing persisted (partial roster never persists)
  -- rollback(repo, assignmentId) --> prior CohortAssignment restored (US2; exact prior snapshot)
  -- repairCohort(assignment, churn) --> CohortAssignment | staff-exception-required (US2; in-budget only)
  -- routeHealthEvent(sink, event) --> SafeguardingSink (bypasses optimization; POL-007 hold)   (US2)
  -- [post-lock only] BenefitEstimator.log(assignmentId) --> BenefitLCB (shadow; never read back) (US2)

TURN EVENTS (TurnEvent[])
  -- analyzeTurns(turns, thresholds) --> TurnAnalysis            (US3; observable-only, confidence-gated)
```

## Deferred / stub types (production direction — non-production seams)

- **HNSW index** (behind `CandidateIndex`, PRD §15): the MVP `distance`/`kNN` adapter stands in; no HNSW type in this slice.
- **CP-SAT model** (PRD §15): the greedy+repair solver stands in; no CP-SAT/ILP type in this slice.
- **`MediaTurnSource`** (behind the stub port, §15.1): yields synthetic `TurnEvent[]`; real WebRTC/AudioWorklet/LiveKit capture deferred.
- **`BenefitEstimator`** (shadow, §15): returns a placeholder `BenefitLCB`; real causal-uplift under network interference deferred.
- **PostgreSQL commit** (behind `CohortRepository`, §15): in-memory atomic commit + rollback stands in.

---

# UI View Model — `packages/cohort-arena-view` (P7–P11)

The Viewer's view types live in `packages/cohort-arena-view`, computed by **pure, deterministic** functions
that read the committed `@gt100k/cohort-compiler` types **read-only** (no I/O, no wall-clock, **no
`Math.random`**). One `CohortArenaView` drives the **3D react-three-fiber canvas**, the **DOM + motion@^12
HUD**, the **2D-tier `project2D` rendering** (reduced-motion / plain / weak device / WebGL loss), and the
accessible Cohort Ledger (parity by construction). Positions are carried as exact **3D `{x,y,z}`** world
coordinates **and** their pure **`project2D` `{x,y}`** screen projection, so the 2D tier is a projection of the
one 3D layout, never a second layout. Guardrails are **structural** — the types below cannot represent a
caste/bottom-rank or an emotion/trait label. Golden constants + fixtures are pinned in
[spec.md § UI Golden Values](./spec.md#ui-golden-values--constants).

## CohortArenaView (composed — the one view)

Output of `buildCohortArenaView(input) → CohortArenaView`, where
`input = { assignment: CohortAssignment; priorAssignment?: CohortAssignment | null; pool?: LearnerProfile[]; candidateSets?: CandidateSet[]; hard: HardConstraints; churn: ChurnBudget; standings?: { self: { selfGain: number }; nearPeers: { pseudonym: string; gain: number }[]; optedIn: boolean }; rivalry?: TurnAnalysis | null; flags: ViewFlags }`.
The optional `pool` supplies each learner's level/velocity so `layoutField` can place the **field-start** (drift
origin) along the caliper gradient; if `pool` is absent, a mote's `field` is `null` and it simply appears at its
settled position (no drift).

| Field | Type | Notes |
|---|---|---|
| `constellation` | ConstellationView | mote + hex + bench layout (deterministic) |
| `cohorts` | CohortCardView[] | one per cohort; members, satisfied badges, floor readout, churn delta |
| `standings` | StandingsView \| null | opt-in; `null` when `optedIn:false` (default) |
| `rivalry` | ArenaRoomView \| null | `null` when no turn analysis supplied |
| `safeguarding` | SafeguardingView | pending events + paused moves (display only) |
| `motion` | Record<MotionKind, MotionSpec> | resolved per event via `resolveMotion` (honors `flags.reducedMotion`) |
| `presentation` | PresentationView | palette/type tokens + resolved age-band variant + plain flag |
| `ledger` | LedgerView | accessible DOM structure spec (AT source of truth) |

**Invariants**: identical inputs → **byte-identical** view (FR-029); `flags` only affect `motion` +
`presentation` — `constellation`/`cohorts`/`standings`/`rivalry`/`safeguarding` are **identical** across
reduced-motion/plain/band (`plainViewEquals`, FR-028/FR-044, SC-009).

## ViewFlags (value)

| Field | Type | Notes |
|---|---|---|
| `reducedMotion` | boolean | first-class equal mode; strips motion, keeps state (FR-039) |
| `plain` | boolean | low-spectacle mode; state-identical (FR-044) |
| `band` | `"6-8" \| "9-11" \| "12-14"` | age-band presentation (FR-044) |
| `standingsOptIn` | boolean | default **false**; gates the standings view (FR-035) |

## ConstellationView / MoteView / CohortHexView

Deterministic **3D** layout (`layoutConstellation` + `layoutField` + `project2D`, geometry pinned in `LAYOUT`).
`Vec3 = { x: number; y: number; z: number }` (world units, rounded to 3 dp); `Vec2 = { x: number; y: number }`
(screen px, integers).

| Type | Field | Type | Notes |
|---|---|---|---|
| ConstellationView | `world` | `{ width: number; height: number }` | 2D-tier viewport `1600×900` |
| | `camera` | `{ position: Vec3; target: Vec3; fov: number; near: number; far: number }` | pinned `CAMERA` (presentation constant) |
| | `fog` | `{ color: string; near: number; far: number }` | pinned `FOG` |
| | `hexes` | CohortHexView[] | one per cohort |
| | `bench` | MoteView[] | unassigned learners (calm "still compiling"; on the bench shelf) |
| | `caliperRadii` | number[] | display disc radii `[5,10,15]` world units (never gate anything) |
| CohortHexView | `cohortIndex` | number | order = domain cohort order |
| | `center` | Vec3 | `center(i)` per `LAYOUT` |
| | `center2d` | Vec2 | `project2D(center)` |
| | `floorHalo` | `{ pos: Vec3; radius: number }` | non-harm-floor halo (`FLOOR_Y`, `FLOOR_R`) |
| | `members` | MoteView[] | six, at the hex vertices |
| MoteView | `ref` | string | learner ref |
| | `pos` | Vec3 | settled 3D position (`memberPos(i,k)` or bench slot) |
| | `pos2d` | Vec2 | `project2D(pos)` — the 2D-tier position |
| | `field` | Vec3 \| null | caliper-gradient drift start (`layoutField`; `null` if no `pool`) |
| | `state` | `"assigned" \| "unassigned" \| "candidate"` | color+icon+text (never color alone) |
| | `role` | Role \| null | assigned role for a cohort member |

## CohortCardView

| Field | Type | Notes |
|---|---|---|
| `cohortIndex` | number | matches the hex |
| `members` | `{ ref: string; role: Role }[]` | six, role vector order |
| `badges` | `{ constraint: string; satisfied: boolean }[]` | the **seven** hard constraints; all `true` for an accepted cohort |
| `nonHarmFloor` | `{ minBenefit: number; floor: number; allAbove: boolean }` | from the domain; `allAbove = minBenefit ≥ floor` (display only, never re-derived) |
| `churnDelta` | number | churn vs. prior snapshot (0 when `prior = null`) |

## StandingsView (opt-in; nullable) — **structural guardrail**

`deriveStandingsView(self, nearPeers, { optedIn }) → StandingsView | null`. Returns `null` when
`optedIn:false` (default). When opted in:

| Field | Type | Notes |
|---|---|---|
| `band` | string | near-peer band label (anonymized) |
| `anonymizedPeers` | `{ pseudonym: string; gain: number }[]` | pseudonymous; near-peer only |
| `selfGain` | number | the learner's own gain |
| `gainToBandTop` | number | `max(all gains) − selfGain` (own-growth headroom) |

> **Prohibited by construction**: `StandingsView` has **no** `rank`, `position`, `percentile`, `outOf`, or
> any bottom-rank/"last of N" field, and none may be added (FR-035; G6; SC-012/SC-017). Gain-based,
> sprint-reset, near-peer, anonymized, opt-in — never a fixed-ability caste rank or full-field ranking.

## ArenaRoomView / SeatView / TurnPatternView (RivalryMix) — **structural guardrail**

`buildArenaRoomView(analysis: TurnAnalysis) → ArenaRoomView` (layout via `layoutArenaRing`).

| Type | Field | Type | Notes |
|---|---|---|---|
| ArenaRoomView | `seats` | SeatView[] | one per observed speaker, sorted by ref |
| | `patterns` | TurnPatternView[] | `dominance` / `repeated_interruption` with evidence (from the domain) |
| | `confidence` | number | from `TurnAnalysis` |
| | `suppressed` | boolean | true → render the "confidence low — prompts suppressed" veil; **0** patterns surfaced |
| SeatView | `speaker` | string | pseudonymous ref |
| | `pos` | Vec3 | 3D ring position (`RING_R=10`, center `{0,0,0}`) via `layoutArenaRing` |
| | `pos2d` | Vec2 | `project2D(pos)` — the 2D-tier position |
| | `turnShare` | number | observable descriptor |
| | `interruptions` | number | observable descriptor |
| | `holdingFloor` | boolean | current turn-holder (pulse) |
| TurnPatternView | `kind` | `"dominance" \| "repeated_interruption"` | observable only |
| | `subjects` | string[] | seat refs |
| | `evidence` | string | the observable triggering evidence text |

> **Prohibited by construction**: `ArenaRoomView`/`SeatView`/`TurnPatternView` have **no** honesty, emotion,
> personality, or motivation field, and none may be added (FR-037; G5/G6; SC-013). Low-quality/sparse input
> sets `suppressed:true` and surfaces no pattern (suppress, never mislabel). A refused/missing analytics case
> renders a neutral "analytics off" state and changes nothing.

## SafeguardingView (display only)

| Field | Type | Notes |
|---|---|---|
| `pending` | CohortHealthEvent[] | routed to the safeguarding lane (bypass optimization) |
| `pausedMoves` | `{ moveId: string; touches: string[] }[]` | conflicting moves frozen (POL-007) |
| `optimizationBypassed` | boolean | true when a health event is present |

> **Invariant**: display only — never mutates a standing, rating, or objective in the view (FR-038;
> SC-016). Rendered as a firm-but-not-alarm banner + a routed lane, never an alarm/red-flash.

## MotionSpec / MotionKind

`resolveMotion(kind: MotionKind, { reducedMotion }) → MotionSpec`.

| Field | Type | Notes |
|---|---|---|
| `kind` | MotionKind | one of the **19** kinds, e.g. `cameraEase`, `compile`, `floorHalo`, `rollback`, `turnPulse`, `interruptionArc`, `dominanceRing`, `standingsBar`, `press`, `hudToggle` |
| `mode` | `"animated" \| "reduced"` | `reduced` when `reducedMotion:true` |
| `durationMs` | number | from `MOTION` (animated) or the reduced column |
| `easing` | string | from `EASINGS` (animated) or `"linear"` (reduced) |

Exact table in [spec.md § UI Golden Values](./spec.md#ui-golden-values--constants) (Fixture V4). Every
`MotionKind` has both an animated and a reduced form (FR-039, SC-011).

## PresentationView / VisualBand

`resolveVisualBand(band) → VisualBand`.

| Field | Type | Notes |
|---|---|---|
| `palette` | typeof PALETTE | exact tokens |
| `typography` | typeof TYPOGRAPHY | exact tokens |
| `band` | AgeBand-like `"6-8" \| "9-11" \| "12-14"` | resolved band |
| `labelStyle` | `"story" \| "growth" \| "numeric"` | 6-8 story / 9-11 growth / 12-14 numeric |
| `markerScale` | number | `1.25 / 1.1 / 1.0` |
| `celebrationCeiling` | `"gentle" \| "standard"` | 6-8 gentle; others standard |
| `plain` | boolean | plain-mode flag |

The underlying `CohortArenaView` state is **identical** across bands/plain (`plainViewEquals`); only this
presentation varies (FR-044, SC-009/SC-015).

## LedgerView (accessible twin)

| Field | Type | Notes |
|---|---|---|
| `cohortTree` | `{ label: string; children: { label: string }[] }[]` | `role="tree"`; each node's accessible name = cohort + member + role + satisfied state |
| `standingsText` | string \| null | band-appropriate own-growth text (or `null` when off) |
| `rivalryList` | string[] | observable descriptors + patterns as text; veil text when suppressed |
| `safeguardingAlert` | string \| null | firm-not-alarm text when a health event is present |
| `announce` | string \| null | `aria-live="polite"` message (compile/rollback) |

Built by `buildLedger(view)` from the same `CohortArenaView`; the canvas is `aria-hidden` and the Ledger is
the AT source of truth (FR-040, SC-014).

## Golden constant registries (exact — unit-tested)

`PALETTE`, `TYPOGRAPHY`, `MOTION`, `EASINGS`, `LAYOUT` (the exact 3D geometry — `CAMERA`, `FOG`, `HEX_R`,
`center(i)`, `vertexLocal(k)`, bench, `FIELD_STEP`/`FIELD_REF`, `CALIPER_RADII`, `RING_R`, and the pure
`PROJECT`/`project2D`) — the exact values are pinned in
[spec.md § UI Golden Values](./spec.md#ui-golden-values--constants) and asserted by `art.test.ts` /
`motion.test.ts` / `layout.test.ts` (the last also asserts `project2D` of the golden 3D positions).

## UI view state transitions

```text
DOMAIN OUTPUT (CohortAssignment, CandidateSet[], TurnAnalysis, CohortHealthEvent — all synthetic/injected)
  -- buildCohortArenaView(input) --> CohortArenaView            (P7; pure, deterministic, one view)
       * plainViewEquals(view, reducedMotion|plain|band) holds  (state-identical; presentation varies)
  -- r3f/three 3D renderer <-- view.constellation / view.rivalry  (P8/P10; WebGL2 canvas, aria-hidden)
  -- 2D tier (project2D DOM/SVG) <-- same view                  (reduced-motion / weak device / WebGL loss)
  -- DOM + motion@^12 HUD <-- view.cohorts / standings / safeguarding  (P8/P9)
  -- buildLedger(view) --> LedgerView                           (P8; accessible twin, AT truth)
```
