# Contract: `@gt100k/arena-world` domain interface

This slice exposes no external HTTP/network API; its "contract" is the public interface of the pure domain package. **All functions are pure** over injected state — no I/O, no wall-clock, **no randomness** (`Math.random` is banned in the package). Types reuse `Section`/`SECTIONS` from `@gt100k/learning-loop`.

## Types

See [data-model.md](../data-model.md) for `AgeBand`, `CompetencyNode`, `QuestWorld`, `NodeMasterySignal`, `NodeState`, `ProgressionState`, `Tier`, `Cosmetic`, `CosmeticRule`, `CosmeticEligibility`, `AvatarState`, `CohortBase`, `CelebrationEvent`, `RewardRepresentation`, `NearPeerStanding`.

## Public functions

```text
buildQuestWorld(graphDef) -> QuestWorld
  Precondition:  node ids unique; all prerequisite ids exist; prerequisite graph is a DAG.
  Postcondition: edges derived from prerequisites; regions in stable order. Throws on cycle/dangling id.

deriveNodeStates(world, signals) -> Map<nodeId, NodeState>
  Behavior:  unlocked  iff all prerequisites mastered AND this node.masteryCleared;
             available iff all prerequisites mastered AND NOT this node.masteryCleared;
             locked    otherwise.
  Guarantee: pure/deterministic — identical (world, signals) -> identical map. No time/visit input exists.

computeProgression(world, signals, tierTable, previousReward?) -> ProgressionState
  Behavior:  cumulativeIndependenceReward = Σ independenceReward over mastered nodes;
             tier = tierForReward(cumulative, tierTable);
             growthVsPast = { previous: previousReward ?? 0, current: cumulative, delta }.

tierForReward(reward, tierTable) -> Tier
  Behavior:  highest tier whose minReward <= reward. Deterministic thresholds; cosmetic-only.

deriveCosmeticEligibility(catalog, progression, nodeStates, world) -> CosmeticEligibility
  Behavior:  a cosmetic is eligible iff its deterministic rule is satisfied
             (min-tier | min-unlocks | region-complete). No randomness, no price, no drops.

equipCosmetic(avatar, cosmeticId, eligibility) -> AvatarState
  Precondition:  cosmeticId ∈ eligibility.eligibleIds.
  Behavior:      returns avatar with cosmeticId added to `equipped`; rejects (throws / no-op) if not eligible.
  Guarantee:     mutates only cosmetic fields; there is NO money/purchase parameter or path.

applyCohortContribution(base, missionResult) -> CohortBase
  Behavior:      appends the mission's deterministic contribution(s); recomputes unlockedFeatures.
  Guarantee:     same input sequence -> identical base (replayable). Confers no gameplay power.

classifyCelebration(signal) -> CelebrationEvent | null
  Behavior:  independent-unlock or productive-struggle -> CelebrationEvent (copyStyle="process-praise");
             incorrect attempt / help request -> null (NO event; nothing removed).
  Guarantee: no "loss"/"penalty" event type exists in the return union.

resolveRewardRepresentation(ageBand, progression) -> RewardRepresentation
  Behavior:  6-8 -> showRawNumber=false, comparisonDefault="off", concrete/story vocabulary;
             9-11 -> transitional; 12-14 -> full (showRawNumber=true).
  Guarantee: underlying progression is unchanged across bands; only representation varies.

deriveStanding(self, nearPeers, options) -> NearPeerStanding | null
  Behavior:  returns null unless options.optedIn === true (default off);
             otherwise gain-based, anonymized, near-peer; reports selfGain and gainToBandTop.
  Guarantee: return type cannot express a rank/position/percentile/outOf/caste — bottom-rank unrepresentable.
```

## Guardrail predicates (helpers, also tested directly)

```text
isZeroPower()          — outcome-invariance: mastery/node-state/matchmaking/standing take no cosmetic/tier input.
plainViewEquals(full)  — plain-mode/reduced-motion view conveys identical state/progression/celebration.
```

## Contract test obligations (map to FR/SC)

Tests are **written first and must fail** before implementation (constitution: tests define done). Grouped by the guardrail they lock.

**Quest world / mastery gate (US1)**
- `buildQuestWorld`: rejects a cycle and a dangling prerequisite; derives correct edges/regions.
- `deriveNodeStates`: prereqs met + gate uncleared ⇒ `available`; gate cleared + a prereq unmastered ⇒ `locked`; both ⇒ `unlocked` (FR-002/3, SC-001).
- Determinism: identical inputs ⇒ identical state map across repeated runs (FR-004, SC-001).
- No-grind: no function accepts time/visit input that could flip a node (FR-002, SC-001).

**Tiers / cosmetics / avatar (US2)**
- `tierForReward`/`computeProgression`: correct tier at/around each threshold; growth-vs-past populated (FR-005/6).
- `deriveCosmeticEligibility`: identical reward history ⇒ identical eligible set across runs; no `Math.random` in package (grep test) (FR-007, SC-002).
- No purchase path: `Cosmetic` has no price/currency/dropRate/rarity field; `equipCosmetic` has no money parameter (FR-008, SC-002).
- Zero power: mastery / node-state / matchmaking / standing outcomes identical across all cosmetic/tier states (FR-009, SC-003).
- `equipCosmetic`: rejects an un-earned cosmetic; avatar stays pseudonymous, encodes no ability signal (FR-010).

**Juice / failure framing (US3)**
- `classifyCelebration`: unlock/struggle ⇒ event; incorrect attempt / help request ⇒ `null` and nothing removed (FR-012/13, SC-007).
- No loss type exists in the `CelebrationEvent` union; copyStyle is `process-praise` (FR-013/14).

**Cohort base (US4)**
- `applyCohortContribution`: appends deterministically; same sequence ⇒ identical base; prior contributions preserved; confers no power (FR-011, SC-003).

**Staging / standings / plain mode (US5)**
- `resolveRewardRepresentation`: same event renders in correct band vocabulary; 6-8 never shows the raw mastery-delta headline; comparison off for 6-8 (FR-017/18, SC-005).
- `deriveStanding`: returns null when not opted in (default off); when opted in is near-peer/anonymized/gain-based and exposes no bottom-rank position; caste/rank fields unrepresentable (FR-019, SC-009).
- Plain-mode/opt-out invariance: `plainViewEquals` and learning/access/standing unchanged with standings off / plain mode on (FR-020, SC-006).

**Cross-cutting**
- Synthetic-only: the whole surface runs with no consent/admissions/legal input (FR-024, SC-008).
- (UI) Reduced-motion parity + WCAG 2.2 AA + 60 fps min-device + non-blocking mastery action — verified via `next build` + acceptance walkthrough (FR-015/16/22/23, SC-004/10), not domain unit tests.
