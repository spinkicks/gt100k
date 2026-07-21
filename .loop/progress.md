# Loop progress — interest-lab (003) · PRODUCTION REBUILD of the child experience (claude)

## Verdict driving this work
The domain (`packages/interest-lab`) + the guide console are solid — KEEP them. The **child
"Curiosity Quest World"** is a hollow demo: a decorative 3D backdrop bolted onto a themed
multi-select list, with a runtime crash and dead 3D. Make the CHILD surface production-grade.
App: `apps/interest-lab` (esp. `app/child/*`, `world3d/*`) + `packages/interest-lab-view`.
Child-facing → calm, simple, legible (apply the SIMPLICITY rules in
~/code/gt100k-factory/docs/game-feel.md). Use the design skills (impeccable, apple-design,
emil-design-eng, ui-ux-pro-max) AND webapp-testing/playwright to **screenshot + self-verify**
(chromium works now — run the app and confirm interactions actually do something).

## Gate
`pnpm exec tsc -b` + `pnpm test` (+ `pnpm --filter @gt100k/interest-lab-app build`). Keep the
existing tests meaningful — update them as behavior changes; DO NOT weaken them to pass.

## P0 — make it actually work (highest priority)
1. **Fix the crash.** On load the app throws `TypeError: Cannot read properties of undefined
   (reading '0')` in drei `<Environment>` (EnvironmentPortal). Fix the Environment usage (valid
   `preset`/`files`, or a self-contained lightformer/env) and **add a React error boundary**
   around the 3D `<Canvas>` so any render error shows a graceful fallback, not a white screen.
2. **Wire 3D picking.** `QuestMarker` already does `onClick={() => onPick?.(marker.probeId)}`
   but `onPick` is never passed (`QuestWorld.tsx:42` → `Island.tsx` → `QuestMarker.tsx`). Thread
   `onPick`/focus through so clicking an orb drives the SAME reducer as the ledger card. Dead
   clicks on the hero object are the #1 demo tell.
3. **Fix world↔board parity.** `picker.ts` slices `visibleQuests` (3–6) but `scene.ts` builds
   markers from ALL quests → 6 of 8 islands are unreachable décor. Make EVERY domain/quest
   reachable (render + focusable + pickable) with a "next island / see all" affordance. One truth.
4. **Give "visit" a payoff.** Add the my-quests **beacon** as a real scene/HUD target and make
   pick a **hop-travel** to it with the spark-trail (`QuestMarker` `PICK_HOP_HEIGHT`/
   `createPickHopSpring`; beacon in `QuestWorld.tsx`). Focusing an island should surface its
   quests + give arrival meaning (island rises/opens + a DOM island-name banner).

## P1 — legible + age-appropriate
5. **Remove the dev harness from the child build.** The child⇄guide toggle, Age band, Render
   tier (Full 3D/Lite/2D), Plain mode, Motion segmented controls (`InterestLabControls.tsx`)
   are a QA harness — move behind a staff/`?debug` flag, NOT child chrome. Keep only what a child
   needs (help; maybe a single calm/motion toggle).
6. **Wayfinding** (spec §5.5): focused-island name banner, an "overview / see all" button
   (drift-out to the archipelago), a persistent my-quests count.
7. **Stage by age band in the WORLD** (not just the card list): `buildSceneView` ignores
   `maxVisibleQuests`/band and the exploration map is hardcoded `{0,0}`; consume the staging
   tokens (`scene.ts`, `staging.ts`) — fewer islands + auto-tour for 6–8, orbit for 9–11.
8. **Child copy.** Replace off-register vocab ("focus a quest", "constellation", "provenance",
   "Mission deck") with age-staged, concrete language.

## P2 — kill the gray-box art
9. **Differentiate islands** — per-domain silhouettes/props (3–4 procedural archetypes keyed by
   catalog index, no fetch), not 8 identical orange coasters (`Island.tsx`).
10. **Work-mode glyph on the marker** (emissive decal/sprite from `WORK_MODE_GLYPHS`/`glyphs.ts`)
    so the 3D encodes *what kind of work*, not just warmth (`QuestMarker.tsx`).
11. **Authored quest content** — replace the template strings in `picker.ts`
    (`titleFor`/`whyCopyFor`) with concrete, curiosity-hook titles per probe.
12. **Delete stale 2D placeholder art** (`.island-spark/.island-tide/.island-sprout` in `globals.css`).

## P3 — close the real discovery loop
13. **Child picks/returns emit events** into a client-side/synthetic session so the child's own
    behavior — not the hardcoded `SYNTHETIC_RETURN_HISTORY` in `seed.ts` — produces the
    voluntary-return bloom and feeds the hypothesis the guide console renders.
14. **Minimal persistence** (localStorage session) so "come back later" is real and the reserved
    return-delight can be earned across sessions.
15. **Child agency UI** — the dispute/withdraw controls (US4 / PASS-008) + guard-layer surfacing
    currently have zero UI; add the child rights controls.

## Turn log
- **Turn 1 (v2) — P0.1 + P0.2 DONE.** Gate green: `tsc -b` 0 · full `pnpm test` 361/361 ·
  `next build` ✓ (route `/` static, 285 kB) · SSR load HTTP 200 (board-2d prerender healthy).
  - P0.1 crash: root-caused to drei portal `<Environment>` frames-once cube-camera update
    (read the lib source). Removed `<Environment>`+`<Lightformer>`; replaced with 4 palette
    `<pointLight>` fill lights (see D-VP16). Added `World3DBoundary` error boundary → calm
    `.quest-world-fallback`, retires WebGL tier to board-2d on any 3D throw (D-VP17).
  - P0.2 picking: lifted the pick reducer + focus to `QuestWorld`; threaded `onPick` through
    `buildQuestWorldSceneGraph → Island → QuestMarker`; `QuestLedger` is now controlled. A 3D orb
    click focuses its island + toggles the quest into the SAME tray as the card (D-VP18).
  - New tests: `world-boundary.test.ts`; onPick-threading assertion + fill-light substitution.
  - CAVEAT: WebGL interaction not pixel/click-verified (headless GPU-less → swiftshader → board-2d).
    Structurally sound + unit-tested; a GPU-browser pass is the ideal final taste-tune, blocks nothing.

- **Turn 2 (v2) — P0.3 DONE.** World↔board parity ("one truth"). Gate green: `tsc -b` 0 · view pkg
  103/103 · app 88/88 · `next build` ✓ (route `/` static, 285 kB). **Browser-verified** (chromium via
  swiftshader resolved `quest-world-3d-lite`, so the 3D world actually mounted): board shows 6 staged
  cards → click **"See all 20 quests"** → 20 cards (== the 20 world markers) → **"Show fewer"** → 6;
  **zero console/page errors** on load + interaction.
  - Root cause: the world renders a marker for EVERY quest (20), but the ledger only rendered
    `picker.visibleQuests` (6, band 9-11 `maxVisibleQuests`) with no way to reach the rest → 14 orbs
    picked probeIds with no matching board card (tray-only, unreachable from the board). The view-pkg
    invariant (markers == quests) already held; the break was purely app composition.
  - Fix (`QuestLedger.tsx`): the board now reaches every quest. `boardQuests = revealAll ? quests :
    visibleQuests`, where `revealAll = showAll || focusOffStage || pickOffStage`. Any quest focused or
    picked FROM THE WORLD (QuestWorld threads `focusedProbeId`/`pickedProbeIds`) auto-reveals its card;
    a crafted **"See all N quests"** disclosure (aria-expanded, lit-pill material, `--card-ease`,
    `scale(0.97)` press) exposes the rest on demand. Age-band staging is preserved (6 by default). See
    D-VP19.
  - Tests: `apps/interest-lab/test/world-board-parity.test.ts` (5) — markers ⊆ quests, every quest
    reachable, off-stage focus reveals its card, off-stage pick reveals its card, see-all present +
    staged-by-default. Explicit view-pkg invariant added to `scene.test.ts` (markers == quests,
    load-bearing since `quests > visibleQuests`).

## NEXT
- **P0.4 — give "visit" a payoff.** Add the my-quests **beacon** as a real scene/HUD target and make a
  pick a **hop-travel** to it with the spark-trail (`QuestMarker` `PICK_HOP_HEIGHT`/
  `createPickHopSpring` already exist; beacon lives in `QuestWorld.tsx`). Focusing an island should
  surface its quests + give arrival meaning (island rises/opens + a DOM island-name banner). Acceptance:
  picking an orb visibly hops to a beacon target (unit-test the hop spring + beacon target wiring);
  focusing an island shows a DOM island-name banner (assert the banner renders for the focused domain);
  keep `tsc`/`test`/`build` green. NOTE: P1.7 (stage the WORLD by age band) will later reduce world
  markers below `quests.length` — when that lands, keep parity by staging the BOARD's `revealAll`
  baseline to the same set, so world-reachable == board-reachable stays true (see the D-VP19 caveat).

- **Turn 3 (v2) — P0.4 DONE.** Give "visit" a payoff (beacon + hop-travel + island-name banner).
  Gate green: `tsc -b` 0 · full `pnpm test` **362/362** · app **98/98** (+10) · `next build` ✓ (route `/`
  static, 286 kB) · biome clean. **Browser-verified** (chromium → full `quest-world-3d` mounted):
  island + 3 orbs render (the prompted-return orb correctly dims/recedes), **zero console/page errors**
  on load + interaction; clicking a card focused `p01` → DOM banner **"Visiting Making"** rendered,
  `data-picked-count` incremented (drives the hop + beacon brighten).
  - **My-quests beacon** (`world3d/beacon.ts` + `Beacon.tsx`): a fixed warm landmark at
    `BEACON_TARGET=[0,-1.1,7]` toward the viewer, wired into `buildQuestWorldSceneGraph` with
    `pickedCount={pickedProbeIds.size}`. `resolveBeaconRender(count)` brightens emissive/halo per
    collected quest then plateaus at 6 — a tap lands somewhere that visibly grows (D-VP20).
  - **Hop-travels to the beacon**: `resolvePickHopPosition(marker, beacon, hopValue)` (pure) rises the
    orb by the spring value AND leans it a fraction (`0.32` at peak) toward the beacon, then settles
    home. `QuestMarker` now computes this in island-local space each frame; `PICK_HOP_HEIGHT` is a
    single source of truth exported from `beacon.ts` (was duplicated). The card, not the orb, stays in
    the tray — the gesture reads as "sent to my quests" (D-VP20).
  - **Arrival meaning**: focusing an orb (a) raises its island via `IslandLift` (own component so the
    `useFrame` lives in a real R3F render — `Island` stays a hook-free function its direct-call unit
    test still uses); (b) shows a DOM `IslandBanner` (`<output>`, `aria-live=polite`) reading
    "Visiting <Domain>" — legible on every tier + announced to AT. `resolveIslandBannerLabel` maps the
    focused probeId → island domain → title-cased label (`sound_music` → "Sound Music").
  - Tests: `test/pick-payoff.test.ts` (10) — hop rests/peaks/clamps toward the beacon; beacon render
    brightens+plateaus + is in the scene graph with the count; banner title-cases + resolves the
    focused domain + renders DOM markup + is hidden until an island is visited.

## NEXT
- **P1.5 — the world is 8 look-alike islands.** Every island uses the same low-poly cap+cone+rim in a
  domain hue; give each domain a **distinct silhouette/props** so the world reads as places, not
  repeated primitives. Start with per-domain accent props (a small emissive motif keyed off
  `island.domain`) layered on the existing island in `Island.tsx`, driven by a pure
  `resolveDomainMotif(domain)` so it's unit-testable. Acceptance: a pure function maps each of the 8
  domains → a distinct motif descriptor (assert 8 distinct); the Island renders the motif; keep
  `tsc`/`test`/`build`/biome green. (P1.7 later stages the WORLD by age band — when it lands, keep
  world-reachable == board-reachable per the D-VP19 caveat.)
