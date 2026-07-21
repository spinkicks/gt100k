# Cohort & Arena Viewer

`@gt100k/cohort-arena` is the guide and operations viewer for the cohort compiler. It renders the synthetic cohort assignment, rollback preview, gain-based standings, safeguarding hold, and observable RivalryMix evidence. The app does not make assignment decisions.

## Run and verify

Run commands from the repository root after `pnpm install`:

```bash
pnpm --filter @gt100k/cohort-arena dev
pnpm --filter @gt100k/cohort-arena test
pnpm --filter @gt100k/cohort-arena build
pnpm --filter @gt100k/cohort-arena test:smoke
```

The development server exposes `/`. Build before running `test:smoke`; the Playwright smoke starts the production app with `next start`. The smoke requires a local Chromium installation with WebGL2 support.

The app needs no secrets or environment variables. `next build` uses safe defaults with an empty environment. `NEXT_PUBLIC_REDUCED_MOTION_DEFAULT=on|off|system` can override the system preference for local checks; an unset or invalid value follows `prefers-reduced-motion`.

## One view drives every surface

The client builds one deterministic `CohortArenaView` through `buildCohortArenaView`. Every renderer receives that same value:

| Surface | Renderer | Responsibility |
| --- | --- | --- |
| Compiler Observatory | react-three-fiber, drei, and three.js | Displays the caliper field, cohort hexes, constraint badges, non-harm halos, rollback, and safeguarding holds. |
| RivalryMix arena | react-three-fiber, drei, and three.js | Displays observable seats, interruption evidence, dominance share, and suppression state. |
| Operations HUD | React DOM and `motion/react` | Displays rosters, churn, rollback, opt-in gains, and safeguarding status. |
| 2D tier | DOM and SVG | Uses `project2D` positions from the same view for reduced motion, plain mode, and runtime fallback. |
| Cohort Ledger | semantic DOM and ARIA | Provides the keyboard, switch, and screen reader source of truth. |

The 3D scenes use `useFrame` only for motion derived from the view package token registry. The app never recalculates cohort membership, feasibility, benefit, standing, or RivalryMix analysis.

## Presentation and fallback tiers

- Full 3D targets 60fps with capped lights, instanced geometry, and restrained bloom.
- A sustained frame-budget miss first selects degraded 3D. That tier halves learner-star instances and disables bloom, antialiasing, and shadows while preserving safety state.
- A second sustained miss, WebGL2 unavailability, or context loss selects the state-identical 2D tier.
- Reduced motion and plain mode select the same motion-free 2D tier without waiting for a runtime fault.

All controls, HUD state, rollback state, standings preference, and Ledger content remain mounted across tiers.

## Accessibility

Both canvases carry `aria-hidden="true"`. The Cohort Ledger exposes the same state as text with icon and shape cues, visible focus, and contrast of at least 4.5:1.

Tab reaches the Ledger as one composite widget. Arrow keys move through visible tree items, Home and End jump to the bounds, Right and Left enter or collapse a cohort, Enter and Space toggle a cohort, and Escape returns to its parent. Polite live output announces compile and rollback changes. The app has no audio surface.

## Guardrails

- **Synthetic-only.** Keep child data, real PII, consent records, and safeguarding case data out of this app.
- The app opens no live media plane, makes no network request, and performs no external fetch for fonts, art, or data.
- RivalryMix stays observable-only. It cannot render honesty, emotion, personality, or motivation labels.
- Standings default off and show pseudonymous near-peer gains. They expose no caste, public tier, bottom rank, or full-field leaderboard.
- The viewer contains no dark patterns, purchase path, random reward, loss-framed streak, or engagement timer.
- Safeguarding bypass pauses conflicting presentation moves. It does not change assignments, ratings, standings, or objectives.

Seed art lives in `public/seed`. The synthetic view factory lives in `components/synthetic-view.ts`; production data and service adapters stay outside this feature.
