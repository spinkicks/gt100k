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
                  #          reference task T-ROOT is applied — see tasks.md; flagged for human reconcile)
pnpm lint         # biome check packages adapters apps  (already covers packages/arena-world & apps/arena)
```

## View it (the Phaser game experience, US1–US5)

```bash
pnpm --filter @gt100k/arena-world-app dev   # apps/arena — Phaser 3 quest-world on Canvas/WebGL
# then build to validate the perf/acceptance target:
pnpm --filter @gt100k/arena-world-app build
```

**Engine notes**: the game runs on **Phaser 3** (`^3.90.0`) loaded **client-only** (`next/dynamic` `ssr:false`, created in `useEffect`, destroyed on unmount). Seed art is committed under `apps/arena/public/seed/` (small SVGs) with a deterministic procedural fallback — **no external fetch**. The app must produce **zero console/WebGL errors** (SC-011). No `.env` is required; `apps/arena/.env.local.example` documents non-secret `NEXT_PUBLIC_*` defaults.

**Expected walkthrough** (driven by the synthetic mastery-signal feed):
1. The competency graph renders as a **traversable overworld** ("Independence Isles"): four region islands, quest nodes, lit edge paths, a **pseudonymous avatar**, and a **follow-camera**. Locked/available/unlocked nodes are visually distinct and color-independent.
2. Selecting a reachable node **tweens the avatar** along the path; clearing a node's synthetic gate (with prerequisites mastered) flips it to **unlocked** with a celebratory reveal (node bloom + particle burst). No amount of clicking/time unlocks a node whose gate is uncleared.
3. Cumulative independence reward advances a **gain-based tier**, shown first as growth vs. the learner's own past.
4. Reaching competence thresholds makes **cosmetics** eligible; equipping them changes only the avatar's look on the canvas — never mastery/standing/access. There is **no** purchase button and **no** loot/roll anywhere.
5. Cooperative-mission results accrete the **persistent cohort base** (the Base Camp scene), with attributable contributors.
6. An incorrect attempt shows a warm, process-praise "not yet" — **never** a loss, a lost item, or a decaying meter.
7. Toggling **plain mode** / setting `prefers-reduced-motion` conveys the identical state, progression, and celebrations without motion; toggling standings off changes nothing in learning/access/standing.
8. Switching the synthetic learner's **age band** re-renders representation (6-8 concrete/story-framed, comparison off, no raw number; 12-14 full map/tiers/standings).

## Accessibility & performance acceptance (§15.3.1)

- With `prefers-reduced-motion` set, verify no state/progression/celebration is unreachable — tweens become instant/crossfade, particles off, camera cuts (FR-015, SC-004).
- **Accessible Ledger**: keyboard-only + screen-reader pass over the parallel DOM (quest `role="tree"`, tiers, cosmetics listbox, base list, `aria-live` celebrations); the canvas is `aria-hidden`; visible focus rings; color-independent cues; ≥4.5:1 contrast (WCAG 2.2 AA, FR-016, SC-012).
- **Client-only Phaser**: confirm zero console/WebGL errors and a clean unmount (no duplicate canvas / leaked context) (FR-028, SC-011).
- On the minimum supported device profile (and the degraded tier: halved particles, glow/shadow off), confirm the client holds its frame budget / degrades gracefully and never blocks a mastery action (FR-022/23, SC-010).

## Success criteria mapping

- SC-001 mastery-only node unlock → `nodes.test.ts` + walkthrough step 2.
- SC-002 deterministic cosmetics, no purchase → `cosmetics.test.ts` + `guardrails.test.ts` (no `Math.random`/no-price) + walkthrough step 4.
- SC-003 zero-power cosmetics/tiers/base → `zero-power.test.ts` + `base.test.ts` + walkthrough steps 4–5.
- SC-004 reduced-motion parity → `motion.test.ts` + `view.test.ts` + walkthrough step 7.
- SC-005 age-band representation → `staging.test.ts` + walkthrough step 8.
- SC-006 free opt-out → `plain-mode.test.ts` + walkthrough step 7.
- SC-007 errors never a loss → `celebrate.test.ts` + walkthrough step 6.
- SC-008 synthetic-only → `synthetic.test.ts`; the whole run needs no consent/admissions/legal input.
- SC-009 no-caste/no-bottom-rank standings → `standings.test.ts`.
- SC-010 perf/non-blocking → `next build` + device acceptance walkthrough.
- SC-011 client-only Phaser, zero console/WebGL errors, clean unmount → app smoke.
- SC-012 accessible Ledger parity (WCAG 2.2 AA) → `view.test.ts` + a11y walkthrough.
- SC-013 deterministic layout → `layout.test.ts` (golden positions §8.1).
- SC-014 one `ArenaView` drives every renderer → `view.test.ts` (`plainViewEquals`).
