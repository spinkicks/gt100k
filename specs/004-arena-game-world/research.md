# Phase 0 Research: Arena Progression World

No blocking unknowns remain; the decisions below record the choices the plan rests on. Scope follows PRD §15.3 / §15.3.1; guardrails follow §12, §13, §14.12, §14.13, §15, and the constitution (G1/G6, ENG human-review).

## Decision: Split into a pure domain package + a new Next.js app

- **Decision**: `packages/arena-world` (pure, deterministic rules) + `apps/arena` (animated experience). Do **not** modify `packages/learning-loop` or `apps/student-compass`.
- **Rationale**: Mirrors feature 001's proven, testable split. Every hard guardrail can be encoded as a pure function and unit-tested (mastery-only unlock, deterministic cosmetics, zero-power, staging, no-caste standings, errors-never-loss). Keeps the build parallel-safe: only new directories change.
- **Alternatives considered**: Building game logic straight into a Next.js app — rejected (entangles rules with rendering, defeats determinism/testability, and would require touching or racing shared UI). A Go/Rust real-time service (PRD §26.2/§26.3) — deferred; unnecessary for a synthetic single-cohort slice.

## Decision: Node unlock is a deterministic function of the §12 mastery gate + prerequisites

- **Decision**: `deriveNodeStates(world, signals)` returns `locked | available | unlocked` per node. `unlocked` iff all prerequisites mastered **and** the node's own `masteryCleared` is true; `available` iff prerequisites mastered but own gate not yet cleared; else `locked`. No time/visit input exists.
- **Rationale**: Encodes FR-002/FR-003 ("bought with mastery, never grinding") structurally — there is no code path by which time-in-app can flip a node. Pure predicate over state → trivially testable across all edge cases (gate-before-prereq, etc.).
- **Alternatives considered**: XP/time-threshold unlock — rejected (violates §15.3 and FR-002). Reusing learning-loop's *daily project-unlock* gate for node unlock — rejected: that gate unlocks *project time for a day*; node unlock needs the *per-node 90% independent-mastery* signal (§12), which we inject as `NodeMasterySignal`.

## Decision: Inject the §12/§13 signals as synthetic `NodeMasterySignal` records

- **Decision**: The 90%-independent-mastery gate result and the §13 independence reward are **inputs** (`NodeMasterySignal { nodeId, masteryCleared, independenceReward }`) supplied by a stub/simulator, not computed here.
- **Rationale**: This feature owns the *game representation of* mastery/reward, not the mastery engine or the answer-blind tutor (§13). Keeps the domain deterministic and synthetic-only, and lets a real mastery/reward source replace the stub later with zero domain change. Builds on `@gt100k/learning-loop` for `Section`/`SECTIONS`/XP/beyond-floor.
- **Alternatives considered**: Recomputing mastery here — rejected (out of scope; would duplicate §12). 

## Decision: Cosmetic eligibility is deterministic competence-gating; no randomness, no money

- **Decision**: `deriveCosmeticEligibility(catalog, progression, nodeStates)` is a pure function of competence thresholds (tier reached, N independent unlocks, region completed). The `Cosmetic` type has **no price field** and **no random/drop mechanic**; `Math.random` is banned in the package. `equipCosmetic` rejects un-earned cosmetics and only ever mutates `AvatarState` cosmetic fields.
- **Rationale**: Encodes G1 (no financial mechanisms for minors), §15.3 (no gacha/loot, never purchasable), and FR-007/8/9 structurally. Determinism is directly assertable (same input → same eligible set across runs).
- **Alternatives considered**: Variable-ratio/loot-box unlocks (industry-standard "engagement") — **explicitly prohibited** by §14.12/§15.3. A currency purchasable with money — prohibited by G1.

## Decision: Zero-power cosmetics/tiers proven by outcome-invariance tests

- **Decision**: Mastery, node-unlock, matchmaking, and standing functions take **no** cosmetic/tier input. Contract tests assert those outcomes are identical across all cosmetic/tier states (SC-003).
- **Rationale**: "Zero power" (FR-009, §15.3) is strongest when enforced by the type signatures (the functions cannot see cosmetics) and verified by invariance tests, not by convention.

## Decision: Age-band representation resolves from the learner's band; economy unchanged

- **Decision**: `resolveRewardRepresentation(ageBand, progression)` returns a band view model (currency label, `showRawNumber`, comparison mode, failure-copy style) per the §14.13 table. The underlying `ProgressionState` is identical across bands; only representation varies. 6-8: `showRawNumber=false`, comparison off, story-framed.
- **Rationale**: Encodes §14.13 / FR-017/FR-018. The "same event, different vocabulary per band" is a direct configuration test (SC-005).
- **Alternatives considered**: Separate per-band economies — rejected (§14.13: "computed identically at every age").

## Decision: Standings are near-peer, anonymized, opt-in, gain-based, no bottom-rank; no caste representable

- **Decision**: `deriveStanding(self, nearPeers, options)` returns `null` unless opted in (default off), and otherwise a gain-based, anonymized, near-peer standing that surfaces the learner's own gain against the band top — **never** a "last of N" position. No type in the package can express a fixed-ability caste rank, public tier name, or full-field ranking.
- **Rationale**: Encodes §15 / G6 / FR-019. Making the prohibited forms *unrepresentable* is stronger than validating against them.

## Decision: Celebration is classified in the domain; motion lives only in the UI

- **Decision**: `classifyCelebration(signal)` returns an `independent-unlock` or `productive-struggle` `CelebrationEvent`, or `null` — and **never** a loss event. Incorrect attempts/help requests remove nothing. The domain event carries semantic intensity + copy-style hints; the UI maps them to motion/particles and their reduced-motion equivalents.
- **Rationale**: Keeps §14.12 failure-framing rules (errors-never-loss, process-praise) testable in the pure layer, independent of rendering. Reduced-motion parity (FR-015) then becomes a UI rendering obligation over the same event stream.

## Decision: Reduced motion / plain mode as an equal rendering path over identical state

- **Decision**: The UI computes one view model from the domain and renders it either full-spectacle or reduced-motion/plain, with **identical** conveyed state/progression/celebration. Opt-out changes nothing in learning/access/standing (FR-020, SC-006).
- **Rationale**: §15.3 requires reduced motion be a *first-class equal mode*, not a degraded fallback. Modeling one state → two renderings guarantees parity by construction.

## Decision: Tests first-class for the domain; UI verified by build + acceptance walkthrough

- **Decision**: Vitest contract/unit tests are written first (must fail) for every domain function and every guardrail. The `apps/arena` UI is validated by `next build` and the quickstart acceptance walkthrough (frame budget is an acceptance target, not a unit test).
- **Rationale**: The constitution makes tests part of "done"; the domain carries the enforceable guarantees, and the UI's value (motion, feel, 60 fps) is verified experientially per §15.3.1.

## Decision: Child-facing review gate — PR-only build loop

- **Decision**: The autonomous build loop implements on-branch and opens a PR; a **named human reviewer** approves before merge. No child exposure on build-loop authority (§25 / ENG). Evidence posture **[E3]/[R]**: measured against belonging/voluntary return; auto-reverts if it depresses belonging (the §15 rollback gate).
- **Rationale**: The constitution's *Human review before child exposure* is non-waivable by velocity; this is a child-facing surface.
