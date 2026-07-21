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
pnpm --filter @gt100k/arena-world-app dev   # apps/arena — Phaser 4 quest-world on Canvas/WebGL
# then build to validate the perf/acceptance target:
pnpm --filter @gt100k/arena-world-app build
```

**Engine notes**: the game runs on **Phaser 4** (`^4.2.1`, latest stable 4.x; rebuilt WebGL renderer with GPU context-loss/restore handling) loaded **client-only** (`next/dynamic` `ssr:false`, created in `useEffect`, destroyed on unmount), using **Phaser-4 APIs only** (particles via `this.add.particles(x,y,key,config)`, tweens via `this.tweens.add`, camera `startFollow`, etc. — no removed Phaser-3-only APIs). Seed art is committed under `apps/arena/public/seed/` (small SVGs) with a deterministic procedural fallback — **no external fetch**. The app must produce **zero console/WebGL errors** (SC-011). No `.env` is required; `apps/arena/.env.local.example` documents non-secret `NEXT_PUBLIC_*` defaults.

**Expected walkthrough** (driven by the synthetic mastery-signal feed):
1. The competency graph renders as the **Independence Isles** overworld (spec §5): a deep-sea archipelago in golden-hour light with **parallax** layers (sky/clouds/horizon/sea/world/foreground/motes), four biome islands (Numbers Coast, Tinker Bluffs, Story Vale, Wordwind Reach), quest **landmarks** (Counting Lighthouse, Abacus Jetty, …), lit edge paths + cross-island bridges, a **pseudonymous lantern-avatar** (idle bob), and a **follow-camera** with an establishing **dolly-in**. Locked/available/unlocked nodes are visually distinct **and color-independent** (icon + shape + label).
2. Selecting a reachable node **tweens the avatar** along the path (walk/run states, look-ahead camera); clearing a node's synthetic gate (with prerequisites mastered) flips it to **unlocked** with the celebration sequence (spec §5.7: node bloom + particle burst + path light-up; a camera punch + aurora on high/transfer-critical). No amount of clicking/time unlocks a node whose gate is uncleared.
3. Cumulative independence reward advances a **gain-based tier** (tabular ticker), shown first as growth vs. the learner's own past.
4. Reaching competence thresholds makes **cosmetics** eligible; equipping them changes only the look (avatar `Crossfade+Blur`, world/base recolor) — never mastery/standing/access. Locked cosmetics show an **earn goal**, never a price; there is **no** purchase button and **no** loot/roll anywhere.
5. Cooperative-mission results accrete the **persistent Base Camp** into deterministic zones/slots (campfire/banner/garden/…), each with an attributable pseudonymous **lantern-mark**. It is the "home" landing when standings are off.
6. An incorrect attempt shows a calm `--notyet` **wisp** + process-praise "not yet" — **never** a loss, a shake, a lost item, or a decaying meter; the sound cue is a neutral soft tap.
7. Toggling **plain mode** / setting `prefers-reduced-motion` conveys the identical state, progression, and celebrations without motion (ambient off, depth kept; particles → static badges; camera cuts); toggling standings off, or muting audio, changes nothing in learning/access/standing.
8. Switching the synthetic learner's **age band** re-renders canvas presentation (`resolveVisualBand`): 6-8 concrete/story-framed, **no raw number on canvas**, larger markers, comparison off, celebration capped at medium; 12-14 full map/tiers/standings with the numeric reward.
9. First run shows a skippable **onboarding** (this-is-you → light-a-path → your-way); it never blocks a mastery action and is mirrored in the Ledger.

## Accessibility & performance acceptance (§15.3.1)

- With `prefers-reduced-motion` set, verify no state/progression/celebration is unreachable — tweens become instant/crossfade, particles → static badges, camera cuts, ambient motion off (depth kept) (FR-015/033/034, SC-004/015/018). With `prefers-reduced-transparency`, panels become solid.
- **Accessible Ledger**: keyboard-only + screen-reader pass over the parallel DOM (quest `role="tree"` with **landmark** accessible names, tiers, cosmetics listbox with `look`+earn-goal, base list with contributors, `aria-live` celebrations + **sound captions**); the canvas is `aria-hidden`; audio is **muted by default**; onboarding is mirrored + non-blocking; visible `--focus` rings; color-independent cues; ≥4.5:1 contrast (WCAG 2.2 AA, FR-016/037/038, SC-012).
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
- SC-015 motion-token system + reduced-motion equivalents → `motion-tokens.test.ts` (§8.10).
- SC-016 avatar animation states + reduced-motion → `avatar.test.ts` (§8.13).
- SC-017 art direction (palette/typography/biome) → `art.test.ts` (§8.11/§8.12).
- SC-018 camera + parallax config → `camera.test.ts` (§8.14).
- SC-019 deterministic base layout → `base-layout.test.ts` (§8.16).
- SC-020 age-band canvas presentation → `visual-band.test.ts` (§8.19) + walkthrough step 8.
- SC-021 deterministic muted/neutral sound cues → `sound.test.ts` (§8.18).
- SC-022 cosmetic `look`/`equipEffect` present + still no price/rarity → `cosmetics.test.ts` (§8.15) + `guardrails.test.ts`.
- SC-023 asset-key registry + procedural fallback, no fetch → `assets.test.ts` (§8.17) + app smoke.
