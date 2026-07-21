# Quickstart: Arena Progression World (validation guide)

How to prove the slice works end-to-end once implemented. Implementation lives in tasks.md / the code itself — this is a run/validation guide only. Synthetic learners only; no consent/admissions/legal workflow is needed to run any of this.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root (pnpm workspace).
- Feature 001 present and green (`@gt100k/learning-loop`) — this feature builds on it.

## Run the tests (primary validation)

```bash
pnpm test                                   # Vitest across the workspace (auto-discovers packages/arena-world/test)
pnpm --filter @gt100k/arena-world test      # domain unit + contract tests only
```

**Expected**: all contract-test obligations in [contracts/arena-world.md](./contracts/arena-world.md) pass:
- node states derive only from the mastery gate + prerequisites (no grind path);
- cosmetic eligibility is deterministic with no purchase/loot path;
- cosmetics/tiers are zero-power (outcome-invariance);
- celebrations fire only on unlock/struggle, never on error;
- age-band representation resolves correctly (6-8 hides the raw number);
- standings are opt-in/near-peer/anonymized/no-bottom-rank (caste unrepresentable).

## Typecheck & lint

```bash
pnpm typecheck    # tsc -b  (NOTE: passes for the new package only AFTER the final root-tsconfig
                  #          reference task T0xx is applied — see tasks.md; flagged for human reconcile)
pnpm lint         # biome check packages adapters apps  (already covers packages/arena-world & apps/arena)
```

## View it (the animated experience, US1–US5)

```bash
pnpm --filter @gt100k/arena-world-app dev   # apps/arena — Next.js quest-world experience
# then build to validate the perf/acceptance target:
pnpm --filter @gt100k/arena-world-app build
```

**Expected walkthrough** (driven by the synthetic mastery-signal feed):
1. The competency graph renders as a **traversable, animated world map**; locked/available/unlocked nodes are visually distinct.
2. Clearing a node's synthetic 90%-independent-mastery gate (with prerequisites mastered) flips it to **unlocked** with a celebratory reveal (particles/motion). No amount of clicking/time unlocks a node whose gate is uncleared.
3. Cumulative independence reward advances a **gain-based tier**, shown first as growth vs. the learner's own past.
4. Reaching competence thresholds makes **cosmetics** eligible; equipping them changes only the avatar's look — never mastery/standing/access. There is **no** purchase button and **no** loot/roll anywhere.
5. Cooperative-mission results accrete the **persistent cohort base**.
6. An incorrect attempt shows a warm, process-praise "not yet" — **never** a loss, a lost item, or a decaying meter.
7. Toggling **plain mode** / setting `prefers-reduced-motion` conveys the identical state, progression, and celebrations without motion; toggling standings off changes nothing in learning/access/standing.
8. Switching the synthetic learner's **age band** re-renders representation (6-8 concrete/story-framed, comparison off, no raw number; 12-14 full map/tiers/standings).

## Accessibility & performance acceptance (§15.3.1)

- With `prefers-reduced-motion` set, verify no state/progression/celebration is unreachable (FR-015, SC-004).
- Keyboard-only + screen-reader pass over the map, tiers, cosmetics, and base; color-independent state cues (WCAG 2.2 AA, FR-016).
- On the minimum supported device profile, confirm the animated client holds its frame budget / degrades gracefully and never blocks a mastery action (FR-022/23, SC-010).

## Success criteria mapping

- SC-001 mastery-only node unlock → `deriveNodeStates` tests + walkthrough step 2.
- SC-002 deterministic cosmetics, no purchase → eligibility tests + no-`Math.random`/no-price tests + walkthrough step 4.
- SC-003 zero-power cosmetics/tiers/base → outcome-invariance tests + walkthrough steps 4–5.
- SC-004 reduced-motion parity → UI acceptance + walkthrough step 7.
- SC-005 age-band representation → `resolveRewardRepresentation` tests + walkthrough step 8.
- SC-006 free opt-out → invariance tests + walkthrough step 7.
- SC-007 errors never a loss → `classifyCelebration` tests + walkthrough step 6.
- SC-008 synthetic-only → the whole run needs no consent/admissions/legal input.
- SC-009 no-caste/no-bottom-rank standings → `deriveStanding` tests.
- SC-010 perf/non-blocking → `next build` + device acceptance walkthrough.
