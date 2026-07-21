# Phase 1 Data Model: Arena Progression World

All identifiers are pseudonymous; no real PII, no sensitive data (Constitution V; §29; synthetic-only). All shapes are computed by pure functions in `packages/arena-world` — **no randomness, no wall-clock, no I/O**. Types reuse `Section` / `SECTIONS` from `@gt100k/learning-loop` (feature 001). Golden fixtures + values live in [spec.md](./spec.md) §7–§8; this file defines the shapes.

## AgeBand (enum)

`"6-8" | "9-11" | "12-14"` — the developmental bands the Specialization Planner uses (§14.7, §14.13).

## CompetencyNode

A node in the competency graph (§12), rendered as a map location/quest.

| Field | Type | Notes |
|---|---|---|
| `id` | string | stable node id |
| `title` | string | display title (pseudonymous; no PII) |
| `sections` | Section[] | one or more of `math \| science \| reading \| language` (cross-links allowed, §12) |
| `prerequisites` | string[] | node ids that must be **mastered** before this node is `available` |
| `region` | string | quest region (world grouping); one of the four fixture regions |
| `transferCritical` | boolean | high-impact node (§12.3); drives celebration intensity `high` |

## QuestWorld

The competency graph as a traversable map.

| Field | Type | Notes |
|---|---|---|
| `nodes` | CompetencyNode[] | all nodes |
| `edges` | `{ from: string; to: string }[]` | derived from `prerequisites` (from = prereq, to = node), stable order |
| `regions` | string[] | distinct regions, in stable declaration order |

**Validation**: node ids unique; every `prerequisites`/edge id exists; the prerequisite graph is a **DAG** (no cycles).

## NodePosition / WorldLayout *(derived)*

Deterministic overworld coordinates (spec §8.1). Pure function of the world; no randomness.

| Type | Shape | Notes |
|---|---|---|
| `NodePosition` | `{ nodeId: string; x: number; y: number }` | integer world units |
| `WorldLayout` | `{ positions: NodePosition[]; bounds: { x:0; y:0; width:2048; height:2048 } }` | region-grid layout; golden positions in spec §8.1 |

Constants: `REGION_SPACING = 1024`, `NODE_SPACING = 192`, `NODE_COLS = 3`, `NODE_OFFSET = 96`. Region origins per spec §5.1.

## NodeMasterySignal *(synthetic input)*

The §12 90%-independent-mastery gate output + the §13 independence reward for one node. Supplied by a stub/simulator — **not** computed here.

| Field | Type | Notes |
|---|---|---|
| `nodeId` | string | must exist in the world |
| `masteryCleared` | boolean | the node's own 90% **independent, unassisted** gate is met (§12) |
| `independenceReward` | number ≥ 0 | mastery-delta of **unassisted** work (§13); 0 for a post-rescue attempt |

A node with **no** signal is treated as `masteryCleared=false`, reward `0`.

## NodeState *(derived)*

`"locked" | "available" | "unlocked"` per node — deterministic from `NodeMasterySignal` + prerequisites (FR-002/3/4).

- `unlocked` ⇔ all `prerequisites` mastered **AND** this node's `masteryCleared === true`.
- `available` ⇔ all `prerequisites` mastered **AND** this node's `masteryCleared === false`.
- `locked` ⇔ any prerequisite not mastered.

(A node is "mastered" ⇔ its signal `masteryCleared === true`.) No time/visit input exists → grinding can never change a state.

## ProgressionState *(derived)*

Gain-based progression from the independence reward (§13), framed as growth vs. own past (§14.13).

| Field | Type | Notes |
|---|---|---|
| `cumulativeIndependenceReward` | number ≥ 0 | Σ `independenceReward` over `unlocked` nodes |
| `masteredCount` | int ≥ 0 | number of `unlocked` nodes |
| `regionsComplete` | string[] | regions where every node is `unlocked`, stable order |
| `tier` | Tier | derived via `tierForReward` |
| `growthVsPast` | `{ previous: number; current: number; delta: number }` | personal-progress framing (never a rank) |

## Tier

A gain-based level. **Cosmetic-only** — confers no access/matchmaking/standing power (FR-006).

| Field | Type | Notes |
|---|---|---|
| `index` | int ≥ 0 | tier ordinal |
| `label` | string | band-neutral display label (no caste/public-tier semantics, §15) |
| `minReward` | number ≥ 0 | inclusive threshold on `cumulativeIndependenceReward` |

**Derivation**: `tierForReward(reward, tierTable)` = highest tier whose `minReward ≤ reward`. Deterministic thresholds; no randomness. Golden table + boundaries in spec §7.2 / §8.4.

## Cosmetic

A purely expressive unlock. **No price field. No random/drop mechanic. Zero power.**

| Field | Type | Notes |
|---|---|---|
| `id` | string | stable id |
| `kind` | `"avatar-item" \| "world-theme" \| "base-theme" \| "celebration-effect"` | expressive category |
| `eligibility` | CosmeticRule | deterministic competence rule (below) |

**CosmeticRule** (one of, all deterministic):
- `{ type: "min-tier"; tierIndex: number }`
- `{ type: "min-unlocks"; count: number }`
- `{ type: "region-complete"; region: string }`

There is **deliberately no** `price`, `cost`, `currency`, `dropRate`, or `rarity` field — a purchase/loot mechanic is structurally unrepresentable (G1, §15.3, FR-007/8). Catalog fixture in spec §7.3.

## CosmeticEligibility *(derived)*

The learner's earned set. Deterministic from progression + node states (FR-007). Golden set in spec §8.4.

| Field | Type | Notes |
|---|---|---|
| `eligibleIds` | string[] | cosmetics whose rule is satisfied, **catalog (declaration) order** |
| `lockedIds` | string[] | not yet earned, catalog order |

## AvatarState

A pseudonymous, expressive-only avatar (§15.3, §29).

| Field | Type | Notes |
|---|---|---|
| `learnerRef` | string | pseudonymous; no real name/likeness/biometric |
| `equipped` | string[] | equipped cosmetic ids — must all be in `eligibleIds` |

**Invariant**: equipping requires eligibility; the avatar encodes **no** ability signal and confers **no** advantage (FR-010).

## CooperativeMissionResult *(synthetic input)*

| Field | Type | Notes |
|---|---|---|
| `missionId` | string | stable id |
| `feature` | string | the base feature/prop this mission accretes (deterministic) |
| `by` | string | pseudonymous contributor ref (attributable) |

## CohortBase

The persistent, co-built shared space (§15.3 "guild hall" / "Base Camp"). Deterministic accretion; zero power (FR-011).

| Field | Type | Notes |
|---|---|---|
| `cohortRef` | string | pseudonymous cohort id |
| `contributions` | `{ missionId: string; feature: string; by: string }[]` | attributable, append-only, stable order |
| `unlockedFeatures` | string[] | derived distinct set of base features/rooms/themes present, stable order |

**Derivation**: `applyCohortContribution(base, missionResult)` appends the contribution and recomputes `unlockedFeatures`. Same input sequence → identical base (replayable). Golden in spec §8.8.

## CelebrationEvent *(value object; not persisted)*

Classified learning-moment event (§14.12). **Never a loss.**

| Field | Type | Notes |
|---|---|---|
| `type` | `"independent-unlock" \| "productive-struggle"` | only these two; no loss type exists |
| `nodeId` | string? | for unlocks |
| `intensity` | `"low" \| "medium" \| "high"` | unlock+transferCritical→high; unlock→medium; struggle→low |
| `copyStyle` | `"process-praise"` | process, not trait/speed (§14.12 item 2) |

`classifyCelebration(signal)` returns `null` for incorrect attempts / help requests (no event, nothing removed — FR-013).

## MotionSpec *(derived)*

Deterministic rendering hints; the same for Phaser and any renderer, and stripped under reduced motion. Golden in spec §8.5.

| Field | Type | Notes |
|---|---|---|
| `mode` | `"animated" \| "static"` | `static` under reduced motion / plain |
| `particleCount` | int ≥ 0 | 24/12/6 by intensity; `0` when static |
| `durationMs` | int ≥ 0 | 800/600/400 by intensity; `150` when static |
| `cameraPunch` | boolean | `true` only for `high` intensity with motion on |

`celebrationMotionSpec(event, { reducedMotion })` → MotionSpec.

## RewardRepresentation *(derived, age-band resolved)*

How the identical economy is shown per band (§14.13, FR-017/18). Golden strings in spec §8.6.

| Field | Type | 6-8 | 9-11 | 12-14 |
|---|---|---|---|---|
| `band` | AgeBand | "6-8" | "9-11" | "12-14" |
| `headline` | `"concrete-marker" \| "growth-vs-past" \| "mastery-delta"` | concrete-marker | growth-vs-past | mastery-delta |
| `currencyLabel` | string | "I did it myself!" | "You vs. past-you" | "Independence reward" |
| `showRawNumber` | boolean | **false** | false | **true** |
| `comparisonDefault` | `"off" \| "opt-in"` | **off** | opt-in | opt-in |
| `failureCopy` | string | warm concrete retry | "not yet" + strategy | diagnostic + self-authored next step |

## NearPeerStanding *(derived, opt-in; default off)*

§15 / G6 guardrailed standing. `deriveStanding(self, nearPeers, options)` returns `null` unless `options.optedIn === true`. Golden in spec §8.7.

| Field | Type | Notes |
|---|---|---|
| `band` | string | near-peer/pace band label (not a program-wide field) |
| `anonymizedPeers` | `{ pseudonym: string; gain: number }[]` | anonymized; gain-based (velocity/mastery-gain/effort) |
| `selfGain` | number | learner's own gain |
| `gainToBandTop` | number ≥ 0 | learner's own gain vs. the band top (never "last of N") |

**Prohibited by construction**: no `rank`, `position`, `percentile`, `outOf`, fixed-ability score, public tier name, or full-field ordering — a caste rank / bottom-rank position is **unrepresentable** (§15, G6, FR-019).

## ArenaView *(derived, composed — drives every renderer)*

The single composed view model produced by `buildArenaView(inputs)`. The Phaser scene, the reduced-motion/plain rendering, and the accessible DOM Ledger all render from **this** object (FR-029, D4) — parity by construction.

| Field | Type | Notes |
|---|---|---|
| `world` | QuestWorld | the graph |
| `layout` | WorldLayout | deterministic positions |
| `nodeStates` | `{ nodeId: string; state: NodeState }[]` | per-node, stable order |
| `progression` | ProgressionState | tier + growth |
| `representation` | RewardRepresentation | age-band resolved |
| `avatar` | AvatarState | equipped cosmetics |
| `eligibility` | CosmeticEligibility | eligible/locked sets |
| `base` | CohortBase | co-built features |
| `standing` | NearPeerStanding \| null | null unless opted in |
| `flags` | `{ reducedMotion: boolean; plainMode: boolean; ageBand: AgeBand }` | render flags |

`buildArenaView` inputs: `{ world, signals, tierTable, catalog, avatar, base, nearPeers, options }` where `options = { ageBand, reducedMotion, plainMode, standingsOptedIn, previousReward? }`.

`plainViewEquals(full, plain)` → boolean: the two `ArenaView`s carry **identical** underlying state (world, layout, nodeStates, progression, eligibility, base, standing) and differ **only** in `flags` — proving reduced-motion/plain does not recompute state (FR-020/029, SC-006/014).

## State transitions (quest world)

```text
locked  --(all prerequisites become mastered)-->  available
available  --(own 90% independent-mastery gate cleared)-->  unlocked   [emits independent-unlock CelebrationEvent]
(any state)  --(incorrect attempt / help request)-->  UNCHANGED        [no loss event; nothing removed]
```

- Deriving from the same signals twice yields the same states + layout (deterministic, FR-004).
- Unlock emits a celebration; error/help emits none and removes nothing (FR-012/FR-013).
