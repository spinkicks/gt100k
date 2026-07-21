# Contract: `@gt100k/arena-world` domain interface

This slice exposes no external HTTP/network API; its "contract" is the public interface of the pure domain package. **All functions are pure** over injected state — no I/O, no wall-clock, **no randomness** (`Math.random` is banned in the package). Types reuse `Section`/`SECTIONS` from `@gt100k/learning-loop`. Golden values in [spec.md](../spec.md) §7–§8.

## Types

See [data-model.md](../data-model.md) for `AgeBand`, `CompetencyNode`, `QuestWorld`, `NodePosition`, `WorldLayout`, `NodeMasterySignal`, `NodeState`, `ProgressionState`, `Tier`, `Cosmetic`, `CosmeticRule`, `CosmeticEligibility`, `AvatarState`, `CooperativeMissionResult`, `CohortBase`, `CelebrationEvent`, `MotionSpec`, `RewardRepresentation`, `NearPeerStanding`, `ArenaView`.

## Public functions

```text
buildQuestWorld(graphDef) -> QuestWorld
  Precondition:  node ids unique; all prerequisite ids exist; prerequisite graph is a DAG.
  Postcondition: edges derived from prerequisites; regions in stable order. Throws on cycle/dangling id.

layoutQuestWorld(world) -> WorldLayout
  Behavior:  deterministic region-grid layout (spec §8.1): x = originX + (i%3)*192 + 96,
             y = originY + floor(i/3)*192 + 96, region origins per spec §5.1; bounds 2048x2048.
  Guarantee: pure/deterministic — identical world -> identical positions. No randomness.

deriveNodeStates(world, signals) -> Map<nodeId, NodeState>
  Behavior:  unlocked  iff all prerequisites mastered AND this node.masteryCleared;
             available iff all prerequisites mastered AND NOT this node.masteryCleared;
             locked    otherwise.
  Guarantee: pure/deterministic — identical (world, signals) -> identical map. No time/visit input exists.

computeProgression(world, signals, tierTable, previousReward?) -> ProgressionState
  Behavior:  cumulativeIndependenceReward = Σ independenceReward over UNLOCKED nodes;
             masteredCount = count of unlocked; regionsComplete = regions with all nodes unlocked;
             tier = tierForReward(cumulative, tierTable);
             growthVsPast = { previous: previousReward ?? 0, current: cumulative, delta }.

tierForReward(reward, tierTable) -> Tier
  Behavior:  highest tier whose minReward <= reward. Deterministic thresholds; cosmetic-only.

deriveCosmeticEligibility(catalog, progression, nodeStates, world) -> CosmeticEligibility
  Behavior:  a cosmetic is eligible iff its deterministic rule is satisfied
             (min-tier | min-unlocks | region-complete). No randomness, no price, no drops.
             eligibleIds/lockedIds preserve catalog declaration order.

equipCosmetic(avatar, cosmeticId, eligibility) -> AvatarState
  Precondition:  cosmeticId ∈ eligibility.eligibleIds.
  Behavior:      returns avatar with cosmeticId added to `equipped`; rejects (throws) if not eligible.
  Guarantee:     mutates only cosmetic fields; there is NO money/purchase parameter or path.

applyCohortContribution(base, missionResult) -> CohortBase
  Behavior:      appends the mission's deterministic contribution; recomputes unlockedFeatures (distinct).
  Guarantee:     same input sequence -> identical base (replayable). Confers no gameplay power.

classifyCelebration(signal) -> CelebrationEvent | null
  Behavior:  independent-unlock (transferCritical -> intensity high; else medium) or
             productive-struggle (intensity low) -> CelebrationEvent (copyStyle="process-praise");
             incorrect attempt / help request -> null (NO event; nothing removed).
  Guarantee: no "loss"/"penalty" event type exists in the return union.

celebrationMotionSpec(event, options) -> MotionSpec
  Behavior:  high/medium/low -> particleCount 24/12/6, durationMs 800/600/400, cameraPunch high-only;
             options.reducedMotion === true -> { mode:"static", particleCount:0, durationMs:150, cameraPunch:false }.
  Guarantee: pure; the reduced-motion spec conveys the event with no motion (FR-015).

resolveRewardRepresentation(ageBand, progression) -> RewardRepresentation
  Behavior:  6-8 -> headline "concrete-marker", showRawNumber=false, comparisonDefault="off";
             9-11 -> "growth-vs-past", showRawNumber=false, "opt-in";
             12-14 -> "mastery-delta", showRawNumber=true, "opt-in" (exact strings spec §8.6).
  Guarantee: underlying progression is unchanged across bands; only representation varies.

deriveStanding(self, nearPeers, options) -> NearPeerStanding | null
  Behavior:  returns null unless options.optedIn === true (default off);
             otherwise gain-based, anonymized, near-peer; reports selfGain and
             gainToBandTop = max(all gains) - selfGain.
  Guarantee: return type cannot express a rank/position/percentile/outOf/caste — bottom-rank unrepresentable.

buildArenaView(inputs) -> ArenaView
  Behavior:  composes world, layout, nodeStates, progression, representation, avatar, eligibility,
             base, standing, and flags into ONE view model that drives every renderer.
  Guarantee: reduced-motion/plain differs ONLY in `flags`; underlying state is recomputed once, not per-mode.
```

## Guardrail predicates (helpers, also tested directly)

```text
isZeroPower()          — outcome-invariance: mastery/node-state/matchmaking/standing take no cosmetic/tier input.
plainViewEquals(a, b)  — two ArenaViews carry identical underlying state and differ only in flags.
```

## Contract test obligations (map to FR/SC)

Tests are **written first and must fail** before implementation (constitution: tests define done). Grouped by the guardrail they lock; golden values in spec §8.

**Quest world / mastery gate / layout (US1)**
- `buildQuestWorld`: rejects a cycle and a dangling prerequisite; derives correct edges/regions (9 nodes, 4 regions).
- `layoutQuestWorld`: matches the golden positions (spec §8.1); deterministic across runs (SC-013).
- `deriveNodeStates`: scenario S1 golden (spec §8.2) incl. gate-before-prereq (`blend-bay` locked, `place-value-point` available); determinism; no time/visit input (FR-002/3/4, SC-001).

**Tiers / cosmetics / avatar (US2)**
- `tierForReward`/`computeProgression`: boundary checks `tierForReward(99/100/249/250/500/899/900/1500)` (spec §8.4); S1 cumulative 300 → tier 2, regionsComplete `[tinker-bluffs]`; growth-vs-past populated (FR-005/6).
- `deriveCosmeticEligibility`: S1 eligible/locked sets exactly (spec §8.4); identical reward history ⇒ identical set across runs; **no `Math.random`** in package (grep test) (FR-007, SC-002).
- No purchase path: `Cosmetic` has no price/currency/dropRate/rarity field; `equipCosmetic` has no money parameter (FR-008, SC-002).
- Zero power: mastery / node-state / matchmaking / standing outcomes identical across all cosmetic/tier states (FR-009, SC-003).
- `equipCosmetic`: rejects an un-earned cosmetic (`avatar-cape-aurora` in S1 throws); avatar stays pseudonymous, encodes no ability signal (FR-010).

**Juice / failure framing / motion (US3)**
- `classifyCelebration`: unlock (transferCritical→high, else medium) / struggle→low ⇒ event; incorrect attempt / help request ⇒ `null` and nothing removed (FR-012/13, SC-007).
- No loss type exists in the `CelebrationEvent` union; copyStyle is `process-praise` (FR-013/14).
- `celebrationMotionSpec`: golden table (spec §8.5); reducedMotion ⇒ static/particleCount 0/durationMs 150 (FR-015, SC-004).

**Cohort base (US4)**
- `applyCohortContribution`: appends deterministically; the 3-mission golden sequence ⇒ `unlockedFeatures ["campfire","banner","garden"]`; same sequence ⇒ identical base; prior contributions preserved; confers no power (FR-011, SC-003).

**Staging / standings / plain mode / view (US5 + cross-cutting)**
- `resolveRewardRepresentation`: exact band strings (spec §8.6); 6-8 `showRawNumber=false`, comparison off (FR-017/18, SC-005).
- `deriveStanding`: returns null when not opted in (default off); when opted in, S1 golden `selfGain 300`, `gainToBandTop 40`, exposes no bottom-rank; rank/position/percentile/outOf unrepresentable (FR-019, SC-009).
- `buildArenaView` + `plainViewEquals`: reduced-motion/plain views carry identical underlying state, differ only in flags (FR-020/029, SC-006/014).

**Cross-cutting**
- Synthetic-only: the whole surface runs with no consent/admissions/legal input (FR-024, SC-008).
- (UI) Client-only Phaser mount, zero console/WebGL errors, clean unmount (FR-028, SC-011); accessible Ledger parity + WCAG 2.2 AA + 60fps min-device + non-blocking mastery action — verified via `next build` + smoke + acceptance walkthrough (FR-015/16/22/23, SC-004/10/12), not domain unit tests.
