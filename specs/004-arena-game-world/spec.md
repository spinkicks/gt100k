# Feature Specification: Arena Progression World (RPG Game-Experience Layer)

**Feature Branch**: `004-arena-game-world`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "The Arena progression world (PRD §15.3 / §15.3.1): the social and competitive/afternoon surface delivered as a production-quality, RPG-style game world rather than a dashboard. A pseudonymous avatar traverses the competency graph rendered as an animated quest-world map; nodes unlock ONLY through the 90% independent-mastery gate (§12); gain-based tiers advance on the independence reward (§13); competence-earned, deterministic cosmetics (no loot, no purchase, zero power); a persistent co-built cohort base; and celebratory 'juice' on independent unlocks and productive struggle, with errors never rendered as loss (§14.12). Reduced-motion is a first-class equal mode, representation is staged by age band (§14.13), and standings stay near-peer/anonymized/opt-in with no caste ranks (§15). Builds on the daily-learning-loop (feature 001); synthetic learners only; no consent/legal machinery."

## User Scenarios & Testing *(mandatory)*

<!--
  Stories are prioritized as independently testable slices. US1 alone is a viable MVP:
  a mastery-gated, traversable quest world for a synthetic learner.
-->

### User Story 1 - Traverse a quest-world map whose nodes unlock only through mastery (Priority: P1)

A synthetic learner opens the Arena and sees the competency graph (§12) as a **traversable, animated world map**: nodes are locations/quests, edges are paths. A node is **locked** until every prerequisite node is mastered **and** its own 90% independent-mastery gate is cleared; only then does it become traversable, with an animated unlock reveal. Progression is bought with real mastery — never with time-in-app or grinding.

**Why this priority**: The mastery-gated quest world is the core of §15.3 and the one thing that makes this an "RPG game-experience layer over the learning mechanism" rather than a cosmetic dashboard. Every other component (tiers, cosmetics, base, juice) hangs off "nodes unlock via the mastery gate." It is the smallest slice that is independently demonstrable and encodes the load-bearing guardrail (FR-002).

**Independent Test**: Feed synthetic per-node mastery signals for a learner into the domain, derive node states, and confirm no node is `unlocked` unless its gate is cleared and all prerequisites are mastered; render the map in locked/available/unlocked states (with a reduced-motion equivalent) and confirm each state displays correctly.

**Acceptance Scenarios**:

1. **Given** a node whose prerequisites are all mastered but whose own 90% independent-mastery gate is **not** cleared, **When** node states are derived, **Then** the node is `available` (reachable/highlighted) but **not** `unlocked`, and no amount of time-in-app changes that.
2. **Given** a node whose own gate is cleared but at least one prerequisite is **not** mastered, **When** node states are derived, **Then** the node is `locked` (prerequisite path incomplete).
3. **Given** a node whose prerequisites are all mastered **and** whose 90% independent-mastery gate is cleared, **When** node states are derived, **Then** the node becomes `unlocked` and an independent-unlock celebration event is emitted.
4. **Given** the same mastery signals processed twice, **When** node states are derived, **Then** the result is identical (deterministic, replayable; no randomness).
5. **Given** `prefers-reduced-motion` is set, **When** the map renders, **Then** every node state, path, and unlock is fully conveyed without motion and no traversal function is lost.

---

### User Story 2 - Earn gain-based tiers and deterministic cosmetics with a pseudonymous avatar (Priority: P2)

The learner accrues an **independence reward** (§13, the mastery-delta of unassisted work). Tiers/levels advance on that gain, framed first as **growth against the learner's own past** (§14.13). Reaching competence thresholds makes purely **cosmetic** unlocks *eligible* — avatar items, world/base themes, celebration effects. Cosmetics are **competence-earned and deterministic** (no gacha/random loot), **never purchasable**, and carry **zero gameplay power**. The learner can equip eligible cosmetics onto a **pseudonymous, expressive-only avatar**.

**Why this priority**: Tiers and cosmetics are the visible "progression feel" of the RPG layer, and they are where the hardest anti-dark-pattern guardrails live (no loot randomness, no purchase, zero power). They depend on the mastery/reward signals surfaced in US1's foundation but are independently testable.

**Independent Test**: Feed a synthetic independence-reward history, compute progression + tier, derive cosmetic eligibility, and confirm: eligibility is a pure deterministic function of competence (identical across repeated runs), no purchase path can grant a cosmetic, and no cosmetic/tier changes any mastery/matchmaking/standing/access outcome.

**Acceptance Scenarios**:

1. **Given** two identical independence-reward histories, **When** cosmetic eligibility is derived, **Then** the eligible set is identical every time (no randomness, no variable-ratio unlocks).
2. **Given** any tier or any set of equipped cosmetics, **When** mastery, node-unlock, matchmaking, and standing are computed, **Then** those outcomes are unchanged versus the same learner with no cosmetics (zero power).
3. **Given** a cosmetic the learner has **not** earned, **When** an equip is attempted, **Then** it is rejected; there is no money/purchase code path that could grant it.
4. **Given** a 6-to-8 learner, **When** the tier/reward is represented, **Then** it renders as growth-against-own-past with no raw mastery-delta number as the headline currency (see US5).
5. **Given** the avatar, **When** inspected, **Then** it is pseudonymous (no real name/likeness/biometric) and encodes no ability signal or advantage.

---

### User Story 3 - Feel the "juice" on the learning moment, never a loss on error (Priority: P3)

The loudest celebrations (motion, particles, sound) fire on **independent unlocks** and **productive-struggle events** (extra unassisted attempts, self-correction, returning after a failed attempt) — §14.12. An **error is never rendered as a loss**: no earned reward, standing, or mastery is removed; there is no loss-framed streak, decaying meter, or forfeiture; feedback praises the **process**, never a fixed trait/ability/speed.

**Why this priority**: This is where "friction is the product" is made to *feel* rewarding. It depends on the unlock/struggle signals from US1 but is an independently testable event layer with strong guardrails.

**Independent Test**: Feed synthetic learning-moment signals (independent unlock, productive struggle, incorrect attempt, help request) and confirm celebration events fire only on unlock/struggle, that incorrect attempts and help requests emit **no** loss event and remove nothing earned, and that copy carries no trait/speed language. Confirm every celebration has a reduced-motion equivalent.

**Acceptance Scenarios**:

1. **Given** an independent unlock or a productive-struggle signal, **When** celebration is classified, **Then** a celebration event is emitted (with a reduced-motion equivalent rendering).
2. **Given** an incorrect attempt or a help request, **When** it is processed, **Then** **no** loss event is emitted and every previously earned reward, standing, and mastery credit is unchanged.
3. **Given** any celebration or failure-moment copy, **When** reviewed, **Then** it references the process/strategy/recovery and never ability, speed, or a fixed identity.

---

### User Story 4 - Co-build a persistent cohort base (Priority: P4)

The stable cohort of six shares a **persistent space they co-build** through cooperative missions (§15). Completing a cooperative mission deterministically accretes contributions into the shared base (rooms/features/themes), which anchors team identity and belonging and serves as the home surface the learner returns to.

**Why this priority**: The persistent base is the belonging anchor (the monitored rollback gate, §15.2) and the "home" of the surface, but the individual quest/tier/cosmetic loop is demonstrable without it, so it ranks after the personal-progression stories.

**Independent Test**: Feed a synthetic sequence of cooperative-mission results for a cohort and confirm the base state accretes deterministically (same inputs → same base), that contributions are attributable, and that base state confers no gameplay power.

**Acceptance Scenarios**:

1. **Given** a cohort base and a completed cooperative mission, **When** the contribution is applied, **Then** the base gains the mission's deterministic contribution and prior contributions are preserved.
2. **Given** the same sequence of mission results applied twice, **When** the base is rebuilt, **Then** the resulting base state is identical (deterministic, replayable).
3. **Given** any cohort base state, **When** mastery/access/standing are computed, **Then** they are unchanged (the base confers no power).

---

### User Story 5 - Age-band representation, plain mode, and near-peer standings guardrails (Priority: P5)

The same computed economy (§13) is **represented** differently by age band (§14.13): 6-8 gets a concrete, story-framed, no-raw-number, comparison-off world; 9-11 transitional (growth vs. own past primary); 12-14 the full map/tiers/standings. A learner can use a low-spectacle **plain mode** or turn off standings/competition with **no loss** of learning, access, or standing. Any cross-child standing is **opt-in (default off), near-peer-band, anonymized, gain-based, and never shows a bottom rank**; no fixed-ability caste ranks exist.

**Why this priority**: These are hard child-protection guardrails that must be encoded and independently verified, but the world is demonstrable at a single band first; this story generalizes representation and locks the standings/opt-out invariants.

**Independent Test**: For a synthetic learner, resolve the reward representation in each age band and confirm the correct vocabulary (6-8: no raw mastery-delta headline, comparison off); confirm plain mode / reduced-motion yields the same underlying state and progression; and confirm a derived standing is near-peer, anonymized, opt-in, and never surfaces a bottom-rank position.

**Acceptance Scenarios**:

1. **Given** the same independence-reward event, **When** it is represented for a 6-8, a 9-11, and a 12-14 learner, **Then** each renders in the correct band vocabulary, and the 6-8 rendering never exposes the raw mastery-delta number as the headline currency.
2. **Given** cross-child standings, **When** derived for any band, **Then** they default off, are opt-in, are near-peer/anonymized, are gain-based, and never surface the learner's bottom-rank position; no fixed-ability caste rank is representable.
3. **Given** a learner who enables plain mode or turns standings off, **When** learning, access, and standing are computed, **Then** they are identical to the full-spectacle configuration (opt-out is free).

### Edge Cases

- **Gate-before-prereq**: A node whose own gate is cleared but whose prerequisites are incomplete stays **locked** — mastery of a node does not leak "unlock" backward past an unmastered prerequisite (US1 scenario 2).
- **No-grind invariant**: Any volume of time-in-app / repeated visits with the gate uncleared never unlocks a node (FR-002).
- **Cosmetic determinism**: No code path (including "reroll", "open", "purchase", or timed drop) introduces randomness or money into cosmetic eligibility (FR-007/FR-008).
- **Reduced-motion parity**: With `prefers-reduced-motion`, no state, progression, or celebration is unreachable — reduced motion is an **equal** mode, not a degraded fallback (FR-015).
- **Band boundary**: Representation resolves strictly by the learner's age band; the 6-8 band never falls through to a numeric/comparison rendering (FR-018).
- **Standings floor**: A standing never renders "last of N"; when a learner would be bottom, the surface shows the learner's own gain against the band, not a rank position (FR-019).
- **Bullying/exclusion**: A report in any social surface must be routed to safeguarding and bypass optimization; the game layer never suppresses or gamifies it (FR-025).
- **Mastery action never blocked**: The game surface must never block, delay, or gate a mastery action, even under load or on low-end hardware (FR-022/FR-023).

## Requirements *(mandatory)*

### Functional Requirements

**Quest-world map & mastery gate**

- **FR-001**: The system MUST render the competency graph (§12) and project ladders as a traversable world map — nodes as locations/quests, edges as paths — with animated movement, camera, and node reveals (and a reduced-motion equivalent, FR-015).
- **FR-002**: A competency node MUST unlock **only** through its 90% independent-mastery gate (§12); progression MUST NOT be obtainable through time-in-app, revisits, or grinding.
- **FR-003**: A node MUST be `available` only when **all** prerequisite nodes are mastered; a node MUST become `unlocked` only when it is `available` **and** its own mastery gate is cleared; otherwise it is `locked`.
- **FR-004**: Node-state derivation MUST be a **pure, deterministic** function of the mastery signals and the graph — no randomness, replayable, identical output for identical input.

**Gain-based tiers & independence reward**

- **FR-005**: Tiers/levels MUST advance on mastery-gain and the independence reward (§13), framed first as the learner's growth against their own past (§14.13).
- **FR-006**: Tier derivation MUST be deterministic thresholds over cumulative independence reward, and a tier MUST affect **only** cosmetics — never access, matchmaking, or standing.

**Earned cosmetics & avatar**

- **FR-007**: Cosmetic-unlock **eligibility** MUST be competence-earned and **deterministic** — no gacha, no variable-ratio/random loot, no timed drops.
- **FR-008**: Cosmetics MUST NOT be purchasable with money (G1); the system MUST expose **no** purchase/financial code path for minors.
- **FR-009**: Cosmetics MUST carry **zero gameplay power** — they MUST never affect mastery, node-unlock, matchmaking, standing, or access; a learner who ignores cosmetics MUST never be disadvantaged.
- **FR-010**: The learner avatar MUST be **pseudonymous** (no real likeness, legal name, or biometric, §29), expressive-only, encode no ability signal, and confer no advantage; equipping a cosmetic MUST require prior eligibility.

**Persistent cohort base**

- **FR-011**: The system MUST maintain a **persistent cohort base** state that a stable cohort co-builds via cooperative-mission completions, with deterministic accretion, attributable contributions, and **zero gameplay power**.

**Juice & failure framing**

- **FR-012**: The system MUST emit celebration events on **independent unlocks** and **productive-struggle events** (extra unassisted attempts, self-correction, return after a failed attempt) — §14.12 items 3-4.
- **FR-013**: An incorrect attempt or a help request MUST NOT be rendered as a loss and MUST NOT remove any previously earned reward, standing, or mastery credit; the reward surface MUST render **no** loss event, decaying/absence-based meter, or forfeiture (§14.12 items 1, 5; §14.12.1).
- **FR-014**: Celebration and failure-moment copy MUST praise the **process** (attempt, strategy, recovery, revision) and MUST NOT reference fixed ability, speed, or a fixed identity (§14.12 item 2).

**Reduced motion & accessibility**

- **FR-015**: Reduced motion MUST be a **first-class, equal** mode: every animated affordance MUST have a reduced-motion rendering that conveys the same state, progression, and celebration; `prefers-reduced-motion` MUST be honored by default; **no** feature may require motion to be usable (WCAG 2.2 AA, §8.3).
- **FR-016**: All game-experience surfaces MUST meet WCAG 2.2 AA — keyboard, switch, screen-reader operable, captioned, and color-independent.

**Developmental staging**

- **FR-017**: The reward/progression representation MUST resolve from the learner's age band (6-8, 9-11, 12-14); the underlying economy (§13) MUST be identical across bands — only representation, default competitive exposure, and failure-moment copy vary.
- **FR-018**: A 6-to-8 learner MUST NOT be shown the raw mastery-delta number as the headline currency; that band MUST default to concrete/story-framed representation with cross-child comparison **off**.

**Standings, opt-out & no caste**

- **FR-019**: Any cross-child standing MUST be opt-in (default off), near-peer-band, anonymized, gain-based, and MUST never surface a learner's bottom-rank position; fixed-ability caste ranks, public tier names, and full-field rankings MUST NOT be representable (§15, G6).
- **FR-020**: Turning off competition/standings, or using plain mode, MUST leave learning, access, and standing unchanged (opt-out is free).

**No dark patterns, performance & non-blocking**

- **FR-021**: The reward surface MUST use no loss-framed streaks, manufactured scarcity, FOMO framing, gacha/loot randomness, or engagement-timed notifications (§14.12 item 5).
- **FR-022**: The game surface MUST never block, delay, or gate a mastery action.
- **FR-023**: The real-time client MUST target 60 fps on the minimum supported device with a reduced tier and graceful degradation under load/low-end hardware; game-feel MUST NOT become engagement-maxxing.

**Privacy, synthetic scope & review**

- **FR-024**: Avatars, base, and cosmetics MUST be pseudonymous and hold no sensitive data/PII; the feature MUST be exercisable end-to-end with **synthetic learners only** and MUST NOT require any consent/admissions/legal/governance workflow to run.
- **FR-025**: A report of bullying, coercion, or exclusion in any social surface MUST bypass optimization and route to safeguarding; the game layer MUST NOT gamify, suppress, or delay it. *(For this slice: represent as a fail-closed hook/flag, not a live safeguarding pipeline.)*
- **FR-026**: Every child-facing surface MUST pass a **named human-review gate before child exposure** (§25 / ENG); the autonomous build loop MUST be **PR-only** — a human reviews and approves before merge, and no build-loop output reaches a child without that gate.

**Build-on / isolation**

- **FR-027**: The feature MUST build on `@gt100k/learning-loop` (feature 001) — reusing its `Section`/`SECTIONS`, the mastery-gate/`evaluateGate` concept, XP, and the beyond-floor engagement signal — and MUST NOT modify `packages/learning-loop`, `apps/student-compass`, or shared root configuration except as a final, human-reconciled task.

### Key Entities *(include if feature involves data)*

- **CompetencyNode**: A node in the competency graph (§12) — id, title, section link(s), prerequisite node ids, quest region, transfer-critical flag. Renders as a map location/quest. Pseudonymous; no PII.
- **QuestWorld**: The competency graph as a traversable map — the set of nodes, derived edges (from prerequisites), and regions.
- **NodeMasterySignal** *(synthetic input)*: Per-node evidence from the 90% independent-mastery gate — `nodeId`, `masteryCleared` (from the unassisted gate), and `independenceReward` (the §13 mastery-delta of unassisted work). The synthetic stand-in for the §12 gate output.
- **NodeState** *(derived)*: `locked | available | unlocked` for each node, derived deterministically from `NodeMasterySignal` + prerequisites.
- **ProgressionState** *(derived)*: Cumulative independence reward, current tier, and growth-against-own-past framing.
- **Tier**: A gain-based level derived from cumulative independence reward via deterministic thresholds. Cosmetic-only; confers no power.
- **Cosmetic**: A purely expressive unlock — id, kind (avatar item / world theme / base theme / celebration effect), and a deterministic competence-eligibility rule. No price, no randomness, zero power.
- **CosmeticEligibility** *(derived)*: The set of cosmetics a learner has earned, computed deterministically from progression/node states.
- **AvatarState**: A pseudonymous, expressive-only avatar and its equipped (eligible) cosmetics; encodes no ability signal.
- **CohortBase**: The persistent, co-built shared space — accreted contributions from cooperative missions, attributable, zero power.
- **CelebrationEvent**: A classified learning-moment event (`independent-unlock` or `productive-struggle`) with a reduced-motion equivalent; never a loss event.
- **RewardRepresentation** *(derived, age-band resolved)*: Band (6-8 / 9-11 / 12-14), currency label, `showRawNumber`, comparison mode, and failure-copy style.
- **NearPeerStanding** *(derived, opt-in)*: A gain-based, anonymized, near-peer-band standing that never surfaces a bottom rank; opt-in, default off.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In **100%** of runs, no competency node is `unlocked` unless its 90% independent-mastery gate is cleared **and** all prerequisites are mastered; grinding/time-in-app never unlocks a node.
- **SC-002**: Cosmetic eligibility is fully **deterministic** — identical independence-reward inputs yield the identical eligible set across repeated runs (no randomness), and **no** purchase path can grant a cosmetic.
- **SC-003**: No cosmetic and no tier changes any mastery, node-unlock, matchmaking, standing, or access outcome — those outcomes are byte-for-byte identical across all cosmetic/tier states (zero power).
- **SC-004**: Every animated affordance has a reduced-motion equivalent; with reduced motion set, full progression, state, and celebration remain conveyable and **no** function is lost.
- **SC-005**: The same independence-reward event renders in the correct age-band vocabulary; a 6-to-8 learner **never** sees the raw mastery-delta number as the headline currency and sees cross-child comparison off.
- **SC-006**: Enabling plain mode or turning standings off leaves learning, access, and standing **unchanged** versus the full-spectacle configuration.
- **SC-007**: An incorrect attempt or help request produces **no** loss event and removes **no** earned reward, standing, or mastery.
- **SC-008**: The whole surface runs end-to-end for synthetic learners with **no** consent/admissions/legal workflow present.
- **SC-009**: Any opted-in standing is near-peer/anonymized/gain-based and **never** shows a bottom-rank position; no fixed-ability caste rank is representable.
- **SC-010**: The real-time client meets its declared frame-rate/asset budget on the minimum supported device and degrades gracefully; the game surface never blocks or delays a mastery action (verified via build + acceptance walkthrough).

## Assumptions

- **Builds on feature 001 (daily-learning-loop).** `@gt100k/learning-loop` is available and unchanged; this feature reuses its `Section`/`SECTIONS`, XP, the mastery-gate concept (`evaluateGate`), and the beyond-floor engagement signal, and adds the game-experience layer on top.
- **Mastery signal is synthetic and injected.** The §12 90%-independent-mastery gate output and the §13 independence reward are supplied as `NodeMasterySignal` records (from a stub/simulator), not computed here — this feature owns the *game representation of* mastery/reward, not the mastery engine or the tutor.
- **Synthetic-only, governance stubbed.** No real learners, consent, admissions, or legal/governance machinery; those remain out of scope. Safeguarding routing (FR-025) is a fail-closed hook, not a live pipeline, in this slice.
- **Age-band defaults are [E3] operating defaults**, not research-validated optima (consistent with §14.7/§14.13); raising competitive exposure would require fresh child assent and dose caps in production (out of scope for the synthetic slice).
- **Child-facing surface.** This is a child-facing surface; the constitution requires a **named human-review gate before child exposure** (§25). The autonomous build loop drafts artifacts and code on a branch and opens a PR only; a human reviews and approves before merge. Evidence posture is **[E3]/[R]** — the engagement lift is measured against belonging and voluntary return (§2.6), never assumed to improve learning, and a mechanic that raises time-in-app while depressing belonging/voluntary return auto-reverts (the §15 rollback gate).
- **Performance budget is an acceptance target.** Frame-rate (60 fps min-device) is validated by the UI build + an acceptance walkthrough, not by a domain unit test (the pure domain package carries no rendering).
- **New dirs only.** All code lives in new directories (`packages/arena-world`, `apps/arena`); shared root files and `apps/student-compass` are untouched except a single final, human-reconciled root-tsconfig reference task.
