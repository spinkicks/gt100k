# Phase 1 Data Model: Arena Progression World

All identifiers are pseudonymous; no real PII, no sensitive data (Constitution V; §29; synthetic-only). All shapes are computed by pure functions in `packages/arena-world` — **no randomness, no wall-clock, no I/O**. Types reuse `Section` / `SECTIONS` from `@gt100k/learning-loop` (feature 001).

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
| `region` | string | quest region (world grouping) |
| `transferCritical` | boolean | high-impact node (§12.3); informational for this slice |

## QuestWorld

The competency graph as a traversable map.

| Field | Type | Notes |
|---|---|---|
| `nodes` | CompetencyNode[] | all nodes |
| `edges` | `{ from: string; to: string }[]` | derived from `prerequisites` (from = prereq, to = node) |
| `regions` | string[] | distinct regions, in stable order |

**Validation**: node ids unique; every `prerequisites`/edge id exists; the prerequisite graph is a **DAG** (no cycles).

## NodeMasterySignal *(synthetic input)*

The §12 90%-independent-mastery gate output + the §13 independence reward for one node. Supplied by a stub/simulator — **not** computed here.

| Field | Type | Notes |
|---|---|---|
| `nodeId` | string | must exist in the world |
| `masteryCleared` | boolean | the node's own 90% **independent, unassisted** gate is met (§12) |
| `independenceReward` | number ≥ 0 | mastery-delta of **unassisted** work (§13); 0 for a post-rescue attempt |

## NodeState *(derived)*

`"locked" | "available" | "unlocked"` per node — deterministic from `NodeMasterySignal` + prerequisites (FR-002/3/4).

- `unlocked` ⇔ all `prerequisites` mastered **AND** this node's `masteryCleared === true`.
- `available` ⇔ all `prerequisites` mastered **AND** this node's `masteryCleared === false` (reachable/highlighted, not yet unlocked).
- `locked` ⇔ any prerequisite not mastered.

(A node is "mastered" ⇔ its signal `masteryCleared === true`.) No time/visit input exists → grinding can never change a state.

## ProgressionState *(derived)*

Gain-based progression from the independence reward (§13), framed as growth vs. own past (§14.13).

| Field | Type | Notes |
|---|---|---|
| `cumulativeIndependenceReward` | number ≥ 0 | Σ `independenceReward` over mastered nodes |
| `masteredCount` | int ≥ 0 | number of `unlocked` nodes |
| `tier` | Tier | derived via `tierForReward` |
| `growthVsPast` | `{ previous: number; current: number; delta: number }` | personal-progress framing (never a rank) |

## Tier

A gain-based level. **Cosmetic-only** — confers no access/matchmaking/standing power (FR-006).

| Field | Type | Notes |
|---|---|---|
| `index` | int ≥ 0 | tier ordinal |
| `label` | string | band-neutral display label (no caste/public-tier semantics, §15) |
| `minReward` | number ≥ 0 | inclusive threshold on `cumulativeIndependenceReward` |

**Derivation**: `tierForReward(reward, tierTable)` = highest tier whose `minReward ≤ reward`. Deterministic thresholds; no randomness.

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

There is **deliberately no** `price`, `cost`, `currency`, `dropRate`, or `rarity` field — a purchase/loot mechanic is structurally unrepresentable (G1, §15.3, FR-007/8).

## CosmeticEligibility *(derived)*

The learner's earned set. Deterministic from progression + node states (FR-007).

| Field | Type | Notes |
|---|---|---|
| `eligibleIds` | string[] | cosmetics whose rule is satisfied, stable order |
| `lockedIds` | string[] | not yet earned |

## AvatarState

A pseudonymous, expressive-only avatar (§15.3, §29).

| Field | Type | Notes |
|---|---|---|
| `learnerRef` | string | pseudonymous; no real name/likeness/biometric |
| `equipped` | string[] | equipped cosmetic ids — must all be in `eligibleIds` |

**Invariant**: equipping requires eligibility; the avatar encodes **no** ability signal and confers **no** advantage (FR-010).

## CohortBase

The persistent, co-built shared space (§15.3 "guild hall"). Deterministic accretion; zero power (FR-011).

| Field | Type | Notes |
|---|---|---|
| `cohortRef` | string | pseudonymous cohort id |
| `contributions` | `{ missionId: string; feature: string; by: string }[]` | attributable, append-only, stable order |
| `unlockedFeatures` | string[] | derived set of base features/rooms/themes present |

**Derivation**: `applyCohortContribution(base, missionResult)` appends the mission's deterministic contribution(s) and recomputes `unlockedFeatures`. Same input sequence → identical base (replayable).

## CelebrationEvent *(value object; not persisted)*

Classified learning-moment event (§14.12). **Never a loss.**

| Field | Type | Notes |
|---|---|---|
| `type` | `"independent-unlock" \| "productive-struggle"` | only these two; no loss type exists |
| `nodeId` | string? | for unlocks |
| `intensity` | `"low" \| "medium" \| "high"` | UI maps to motion tier; reduced-motion equivalent required |
| `copyStyle` | `"process-praise"` | process, not trait/speed (§14.12 item 2) |

`classifyCelebration(signal)` returns `null` for incorrect attempts / help requests (no event, nothing removed — FR-013).

## RewardRepresentation *(derived, age-band resolved)*

How the identical economy is shown per band (§14.13, FR-017/18).

| Field | Type | 6-8 | 9-11 | 12-14 |
|---|---|---|---|---|
| `band` | AgeBand | `"6-8"` | `"9-11"` | `"12-14"` |
| `currencyLabel` | string | concrete "I did it myself" marker | "you vs. past-you" | mastery-delta independence reward |
| `showRawNumber` | boolean | **false** | simplified | **true** |
| `comparisonDefault` | `"off" \| "opt-in"` | **off** | opt-in | opt-in |
| `failureCopy` | string | warm concrete "try again" | "not yet" + strategy | diagnostic + self-authored next step |

## NearPeerStanding *(derived, opt-in; default off)*

§15 / G6 guardrailed standing. `deriveStanding(self, nearPeers, options)` returns `null` unless `options.optedIn === true`.

| Field | Type | Notes |
|---|---|---|
| `band` | string | near-peer/pace band label (not a program-wide field) |
| `anonymizedPeers` | `{ pseudonym: string; gain: number }[]` | anonymized; gain-based (velocity/mastery-gain/effort) |
| `selfGain` | number | learner's own gain |
| `gainToBandTop` | number ≥ 0 | learner's own gain vs. the band top (never "last of N") |

**Prohibited by construction**: no `rank`, `position`, `percentile`, `outOf`, fixed-ability score, public tier name, or full-field ordering — a caste rank / bottom-rank position is **unrepresentable** (§15, G6, FR-019).

## State transitions (quest world)

```text
locked  --(all prerequisites become mastered)-->  available
available  --(own 90% independent-mastery gate cleared)-->  unlocked   [emits independent-unlock CelebrationEvent]
(any state)  --(incorrect attempt / help request)-->  UNCHANGED        [no loss event; nothing removed]
```

- Deriving from the same signals twice yields the same states (deterministic, FR-004).
- Unlock emits a celebration; error/help emits none and removes nothing (FR-012/FR-013).
