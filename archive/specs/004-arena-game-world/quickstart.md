# Quickstart: Arena Progression World (validation guide)

How to prove the slice works end-to-end once implemented. Implementation lives in tasks.md / the code itself — this is a run/validation guide only. Synthetic learners only; no consent/admissions/legal workflow is needed to run any of this.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root (pnpm workspace).
- Feature 001 present and green (`@gt100k/learning-loop`) — this feature builds on it.
- A WebGL2-capable browser for the full 3D experience (Tiers A/B/C); the Tier-D 2D fallback runs without WebGL.

## Run the tests (primary validation)

```bash
pnpm test                                   # Vitest across the workspace (auto-discovers packages/arena-world/test)
pnpm --filter @gt100k/arena-world test      # domain unit + contract tests only
```

**Expected**: all contract-test obligations in [contracts/arena-world.md](./contracts/arena-world.md) pass:
- node states derive only from the mastery gate + prerequisites (no grind path);
- the 3D world transform is deterministic and matches the golden 3D positions;
- cosmetic eligibility is deterministic with no purchase/loot path;
- cosmetics/tiers are zero-power (outcome-invariance);
- celebrations fire only on unlock/struggle, never on error;
- age-band representation resolves correctly (6-8 hides the raw number);
- standings are opt-in/near-peer/anonymized/no-bottom-rank (caste unrepresentable);
- the quality ladder resolves the correct tier per device profile and degrades A→B→C→D;
- the lighting rig / mastery-as-light beacons are exact and capped per tier.

## Typecheck & lint

```bash
pnpm typecheck    # tsc -b  (NOTE: passes for the new package only AFTER the final root-tsconfig
                  #          reference task T-ROOT is applied — see tasks.md)
pnpm lint         # biome check packages adapters apps  (already covers packages/arena-world & apps/arena)
```

## View it (the 3D game experience, US1–US6)

```bash
pnpm --filter @gt100k/arena-world-app dev   # apps/arena — react-three-fiber quest-world on WebGL2
# then build to validate the perf/acceptance target:
pnpm --filter @gt100k/arena-world-app build
```

**Engine notes**: the game runs on **react-three-fiber + three.js + drei** (`three ^0.169.0`, `@react-three/fiber ^8.17.10`, `@react-three/drei ^9.114.0`, `@react-three/postprocessing ^2.16.3`) loaded **client-only** (`next/dynamic` `ssr:false`, r3f root disposed on unmount), using **r3f v8 / drei v9 APIs** (React-18 compatible — do not bump to r3f v9 / drei v10). DOM/HUD motion uses **`motion ^12`** (`motion/react`); continuous in-canvas motion uses drei `easing.damp*`. World geometry is **procedurally authored in code** (deterministic, seeded) with committed SVG icons + a 2D fallback — **no external fetch**. The app must produce **zero console/WebGL errors** (SC-011). No `.env` is required; `apps/arena/.env.local.example` documents non-secret `NEXT_PUBLIC_*` defaults (incl. `NEXT_PUBLIC_QUALITY_TIER=auto`).

**Expected walkthrough** (driven by the synthetic mastery-signal feed):
1. The competency graph renders as the **Independence Isles** 3D overworld (spec §5): four **floating low-poly islands** (Numbers Coast, Tinker Bluffs, Story Vale, Wordwind Reach) over a deep-teal void in golden-hour light, with real **soft shadows**, drifting clouds, a **water plane** with sun-glint shimmer, quest **landmarks** (Counting Lighthouse, Abacus Jetty, …), lit edge paths + cross-island bridges, a **pseudonymous low-poly lantern-avatar** (idle bob), a **damped follow/orbit camera** with an establishing **dolly-in**, and gentle **bloom/vignette**. Locked/available/unlocked nodes are visually distinct **and color-independent** (icon + shape + label + light-presence).
2. Selecting a reachable node **moves the avatar** along the path (walk/run, look-ahead camera); clearing a node's synthetic gate (with prerequisites mastered) flips it to **unlocked** — its **beacon lights** (a real dynamic point light warms the island + casts shadows) with the celebration sequence (spec §5.7: node bloom-pulse + 3D particle burst + beacon ignition + path light-up; a camera punch + aurora on high/transfer-critical). No amount of clicking/time unlocks a node whose gate is uncleared. This is the "mastery is the only currency of light" payoff.
3. Cumulative independence reward advances a **gain-based tier** (tabular ticker), shown first as growth vs. the learner's own past.
4. Reaching competence thresholds makes **cosmetics** eligible; equipping them changes only the look (avatar child-mesh `Crossfade`, world/base recolor + lighting-rig variant) — never mastery/standing/access. Locked cosmetics show an **earn goal**, never a price; there is **no** purchase button and **no** loot/roll anywhere.
5. Cooperative-mission results accrete the **persistent Base Camp island** into deterministic zones/slots (campfire/banner/garden/…), each with an attributable pseudonymous **lantern-mark**. It is the "home" landing (camera glide) when standings are off.
6. An incorrect attempt shows a calm `--notyet` **wisp** + process-praise "not yet" — **never** a loss, a shake, a lost item, or a decaying meter; the sound cue is a neutral soft tap.
7. Toggling **plain mode** / setting `prefers-reduced-motion` (the calm **Tier C**) conveys the identical state, progression, and celebrations without motion — **3D depth kept** (islands/elevation/materials/baked golden-hour light), camera static at its rest pose, ambient/water/particles off, beacons steady, celebrations → static badges + `aria-live`. Toggling standings off, muting audio, or a lower quality tier changes nothing in learning/access/standing.
8. Switching the synthetic learner's **age band** re-renders canvas presentation (`resolveVisualBand`): 6-8 concrete/story-framed, **no raw number on canvas**, larger markers, comparison off, celebration capped at medium; 12-14 full map/tiers/standings with the numeric reward.
9. First run shows a skippable **onboarding** (this-is-you → light-a-path → your-way); it never blocks a mastery action and is mirrored in the Ledger.
10. **Quality ladder**: on a managed laptop the world runs full **Tier A** (soft shadows, shader water, bloom+vignette, up to 8 beacon lights); on iPad/Safari it runs reduced **Tier B** (PCF shadows, cheap water, bloom, ≤3 beacon lights, others emissive+bloom); under reduced motion / low power it runs calm **Tier C** (static-3D, depth kept); with no WebGL (or unrecoverable context loss) it runs **Tier D** (a static 2D/DOM rendering of the identical state — the canvas never mounts). Under sustained frame-time overrun the app auto-drops a tier; the mastery action is never blocked.

## Accessibility & performance acceptance (§15.3.1)

- With `prefers-reduced-motion` set (calm **Tier C**), verify no state/progression/celebration is unreachable — continuous eases become instant, scripted tweens become instant/crossfade, particles → static badges, camera cuts to rest pose, ambient/water/sun-drift/island-bob off, realtime shadows off (baked look), beacons steady — **but 3D depth, elevation, materials, and golden-hour light are kept** (FR-015/033/034, SC-004/015/018/026). With `prefers-reduced-transparency`, panels become solid; with `prefers-contrast: more`, panels get defined borders.
- **Accessible Ledger**: keyboard-only + screen-reader pass over the parallel DOM (quest `role="tree"` with **landmark** accessible names, tiers, cosmetics listbox with `look`+earn-goal, base list with contributors, `aria-live` celebrations + **sound captions**); the canvas is `aria-hidden`; audio is **muted by default**; onboarding is mirrored + non-blocking; visible `--focus` rings; color-independent cues (icon + text + light-presence); ≥4.5:1 contrast (WCAG 2.2 AA, FR-016/037/038, SC-012).
- **Client-only r3f**: confirm zero console/WebGL errors and a clean unmount (no leaked context) (FR-028, SC-011). Force `NEXT_PUBLIC_QUALITY_TIER=D` and confirm the 2D fallback + Ledger render without a canvas.
- On the minimum managed device profile (Tier A laptop / Tier B iPad-Safari), confirm the client **holds 60fps** and degrades gracefully (auto-drop a tier under sustained load; cap dynamic lights/DPR; drop shadows/water/post-fx per tier; fall to calm Tier C then 2D Tier D) and **never blocks a mastery action** (FR-022/23/43, SC-010/025).

## Success criteria mapping

- SC-001 mastery-only node unlock → `nodes.test.ts` + walkthrough step 2.
- SC-002 deterministic cosmetics, no purchase → `cosmetics.test.ts` + `guardrails.test.ts` (no `Math.random`/no-price) + walkthrough step 4.
- SC-003 zero-power cosmetics/tiers/base → `zero-power.test.ts` + `base.test.ts` + walkthrough steps 4–5.
- SC-004 reduced-motion parity (calm Tier C, depth kept) → `motion.test.ts` + `view.test.ts` + walkthrough step 7.
- SC-005 age-band representation → `staging.test.ts` + walkthrough step 8.
- SC-006 free opt-out → `plain-mode.test.ts` + walkthrough step 7.
- SC-007 errors never a loss → `celebrate.test.ts` + walkthrough step 6.
- SC-008 synthetic-only → `synthetic.test.ts`; the whole run needs no consent/admissions/legal input.
- SC-009 no-caste/no-bottom-rank standings → `standings.test.ts`.
- SC-010 perf/non-blocking → `next build` + device acceptance walkthrough + `quality.test.ts`.
- SC-011 client-only r3f, zero console/WebGL errors, clean unmount → app smoke.
- SC-012 accessible Ledger parity (WCAG 2.2 AA) → `view.test.ts` + a11y walkthrough.
- SC-013 deterministic 2D layout → `layout.test.ts` (golden positions §8.1).
- SC-014 one `ArenaView` drives every renderer → `view.test.ts` (`plainViewEquals`).
- SC-015 motion-token system (+lambdas) + reduced-motion equivalents; DOM uses motion@^12 → `motion-tokens.test.ts` (§8.10/§8.21).
- SC-016 avatar animation states + reduced-motion → `avatar.test.ts` (§8.13).
- SC-017 art direction (palette/typography/biome/elevation) → `art.test.ts` (§8.11/§8.12).
- SC-018 camera + parallax + lighting/water/post-fx config → `scene3d.test.ts` (§8.20).
- SC-019 deterministic base layout → `base-layout.test.ts` (§8.16).
- SC-020 age-band canvas presentation → `visual-band.test.ts` (§8.19) + walkthrough step 8.
- SC-021 deterministic muted/neutral sound cues → `sound.test.ts` (§8.18).
- SC-022 cosmetic `look`/`equipEffect` present + still no price/rarity → `cosmetics.test.ts` (§8.15) + `guardrails.test.ts`.
- SC-023 asset-key registry + procedural fallback, no fetch → `assets.test.ts` (§8.17) + app smoke.
- SC-024 deterministic 3D world transform → `world-transform.test.ts` (§8.20/§8.23) + walkthrough step 1.
- SC-025 quality-tier resolution + auto-degrade + per-tier budgets + beacon cap → `quality.test.ts` (§8.22/§8.24) + device acceptance walkthrough (step 10).
- SC-026 mastery-as-light lighting rig + beacon contributions (capped, not color-only) → `lighting.test.ts` (§8.20/§8.22) + walkthrough step 2.
