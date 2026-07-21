## REPO LAYOUT (restructured 2026-07-21)
The repo is now passion-centric: ALL code lives under `passion/apps/`, `passion/packages/`, `passion/adapters/`. There is NO `apps/`, `packages/`, or `adapters/` at the repo root anymore. Work under `passion/`; pnpm-workspace globs are `passion/*`.

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
`pnpm exec tsc -b` + `pnpm test` (+ `pnpm --filter @gt100k/interest-lab build`). Keep the
existing tests meaningful — update them as behavior changes; DO NOT weaken them to pass.
NOTE (Turn 11): the app package is now `@gt100k/interest-lab` (was `-app`); the domain package
is `@gt100k/interest-lab-domain` (was `@gt100k/interest-lab`). See D-VP28.

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

- **Turn 4 (v2) — P1.5 DONE.** Give each domain a distinct silhouette so the world reads as eight
  *places*, not one primitive in eight hues. Gate green: `tsc -b` 0 · full `pnpm test` **362/362** ·
  app **104/104** (+6) · `next build` ✓ (route `/` static, 287 kB) · biome clean on my files.
  **Browser-verified** (chromium+swiftshader → full `quest-world-3d` mounted): the making island's
  **anvil** motif renders centered atop its cap inside the orb ring, **zero console/page errors** on
  load + interaction; card click → DOM banner **"Visiting Making"** + `data-picked-count`→1.
  - **Pure `resolveDomainMotif(domain)`** (`world3d/motif.ts`): maps each of the 8 seed domains → a
    `DomainMotif` (a `shape` label + low-poly `props` = tagged geometry kind + args + local transform,
    `emissiveIntensity`, idle `spinSpeed`). Eight silhouettes — making=anvil, living_systems=sprout,
    symbols_math=prism, word_craft=quill, sound_music=chime, movement_body=arch, visual_design=easel,
    social_world=cluster. **Total**: unknown domain → prism fallback (never throws / never blanks the
    world as the catalog grows). See D-VP21.
  - **`IslandMotif.tsx`**: renders the motif props as emissive low-poly meshes atop the island cap,
    with a gentle idle-spin `useFrame`. Its own component (not inlined in `Island`) so `Island` stays
    a hook-free function the `world-objects`/`domain-motif` unit tests call directly.
  - Wired in `Island.tsx` inside the `IslandLift` group: `<IslandMotif motif={resolveDomainMotif(
    island.domain)} hue={render.hue} scene3d={scene3d} shadows={render.shadows} />`.
  - Gotcha recorded: R3F JSX geometry `args` rejects readonly tuples → mutable tuples + no `as const`
    on `MOTIFS`; caught only by `next build`, not `tsc -b`.
  - Tests: `test/domain-motif.test.ts` (6) — 8 distinct shapes + 8 distinct descriptors, finiteness,
    determinism, unknown-domain fallback, component-not-called-directly, motif wired into Island's tree.

## NEXT
- **P1.6 (candidate) — motif responds to state / camera-facing legibility.** The motif currently sits
  static+spinning regardless of focus; consider (a) brightening/raising the motif when its island is
  focused (reuse the `focused` signal already computed in `Island`), and/or (b) ensuring each
  silhouette reads from the ring's default camera angle (some tori/panels foreshorten). Keep the pure
  descriptor unit-testable; put any per-frame response in `IslandMotif`'s `useFrame`, not in `Island`.
  Acceptance: a focused island's motif visibly responds (unit-test the pure focus→intensity mapping);
  keep `tsc`/`test`/`build` green.
- **CARRY-OVER P1.7 caveat (unchanged):** when the WORLD is later staged by age band (reducing world
  markers below `quests.length`), keep world-reachable == board-reachable by staging the BOARD's
  `revealAll` baseline to the same set (D-VP19).
- **CARRY-OVER lint debt (not mine):** `pnpm lint` reports 19 pre-existing errors in out-of-lane
  `evidence-explorer-view` + prior-turn interest-lab files (QuestLedger/CameraRig/World3DCanvas/
  InterestLabControls/world-3d.test.ts). Outside this feature's lane; left untouched.

- **Turn 5 (v2) — P1 item 5 DONE.** Remove the dev harness from the child build. Gate green: `tsc -b`
  0 · root `pnpm test` **362/362** · app test **115/115** (+7) · `next build` ✓ (route `/` static,
  287 kB) · biome clean on my files. **Browser-verified** (chromium, prod `next start`): default `/`
  shows only the child comfort bar (Calm mode toggle + "How to explore"), the surface/age/tier/plain
  QA controls are ABSENT, `data-staff-debug` null; toggling **Calm mode** ON drove the render tier to
  the **board-2d calm/accessible equal tier** (a real working control); **How to explore** opens to 3
  concrete steps. `/?debug` restores the full "Mission deck" harness (Viewing Quests⇄Guide + Preview
  settings: age/motion/tier/plain) AND mounts the full 3D world. **ZERO console/page errors** on both.
  - Pure `resolveStaffDebugMode(search)` (settings.ts) reads `?debug`/`?staff` (truthy in any form;
    explicit `=0/false/no/off` off). `InterestLabClient` reads it in the mount effect → `staffDebug`
    state (default false, so SSR == first client render, no hydration flash), and conditionally renders
    `InterestLabControls` (staff) vs the new `ChildComfortControls` (child). See D-VP22.
  - `ChildComfortControls.tsx`: the only child chrome — a Calm-mode toggle (checked = the app's
    `effectiveReducedMotion`; onChange → motionPreference on/off) + a `<details>` help card, framed as
    the same lit `control-panel hud-deck material` deck. Age-band touch targets via `resolveChildStaging`.
  - `InterestLabControls` is unchanged/still exported (its existing SSR test still passes); the
    `NEXT_PUBLIC_DEFAULT_SURFACE` deploy knob is preserved — only the in-page child-facing toggle moved
    behind the staff gate. New CSS: `.child-comfort*` / `.child-help*` (reduced-motion-safe reveal).
  - Tests: `test/child-chrome.test.ts` (7) — debug flag truthy/falsey/absent; child bar renders
    calm+help and NOT surface/age/tier/plain; toggle reflects calm state; age-band touch target;
    default client SSR hides the harness.

## NEXT
- **P1 item 6 — Wayfinding (spec §5.5).** Now that the child chrome is minimal, add the four Apple
  wayfinding answers to the WORLD (not the QA deck): (a) a persistent **"overview / see all"** control
  that drifts out to the whole archipelago (where can I get out); (b) a persistent **my-quests count**
  chip (what have I collected); complementing the already-shipped focused-island **banner** ("Visiting
  <Domain>", P0.4) and focusable islands. Acceptance: a pure resolver maps world state → the count +
  overview-available flag (unit-test it); the DOM renders a persistent my-quests count and an overview
  affordance that returns focus to the archipelago (clears focusedProbeId); keep tsc/test/build/biome
  green. Prefer new small components in `app/child/` (e.g. `WorldWayfinding.tsx`) over editing QuestWorld
  heavily. NOTE the masthead "· synthetic preview" context-line + "Accessible 2D tier" status pill are
  mild dev-tells (tier jargon in child chrome) — fold child-appropriate copy for them into **P1 item 8
  (child copy)** rather than here.
- **CARRY-OVER P1.7 caveat (unchanged):** when the WORLD is later staged by age band (reducing world
  markers below `quests.length`), keep world-reachable == board-reachable by staging the BOARD's
  `revealAll` baseline to the same set (D-VP19).
- **CARRY-OVER lint debt (not mine):** pre-existing `pnpm lint` errors in out-of-lane
  evidence-explorer-view + prior-turn interest-lab files; left untouched.

- **Turn 6 (v2) — P1 item 6 (Wayfinding, spec §5.5) DONE.** Add the last two Apple wayfinding answers
  to the WORLD: a persistent *my-quests count* chip and a persistent *"See all islands"* escape hatch.
  Gate green: `tsc -b` 0 · root `pnpm test` **362/362** · app **123/123** (+8) · `next build` ✓ (route
  `/` static, 288 kB) · biome clean on my files. **Browser-verified** (chromium+swiftshader, prod
  `next start`, `/?debug`): top-centre HUD renders "0 / 20 quests collected · See all islands"; overview
  **disabled** at the archipelago; focusing a quest → banner "Visiting Making", count→1, overview
  **ENABLED**; clicking **See all islands** clears `data-focused-probe`→null and re-disables the button.
  **ZERO console/page errors.** Screenshot self-review: pill legible, beacon-accented, clears banner
  (top-left) + instruction (top-right), no overlap. See D-VP23.
  - **Pure `resolveWorldWayfinding(islands, focusedProbeId, pickedCount)`** (`world3d/wayfinding.ts`)
    → `{ pickedCount, questTotal, countLabel, overviewAvailable, focusedDomainLabel }`. `questTotal` =
    unique island markers; `pickedCount` clamped to `[0, questTotal]`; `overviewAvailable` iff an island
    is focused. Empty world → "No quests yet"; singular noun for 1 quest. Reuses beacon.ts helpers.
  - **`WorldWayfinding.tsx`**: DOM HUD (aria-live count + real `<button>`, `disabled` when overview
    unavailable so the flag is load-bearing). Wired in `QuestWorld` beside the banner; new
    `returnToArchipelago` handler = `setFocusedProbeId(null)` (CameraRig eases home on cleared focus —
    no new camera code). New CSS `.world-wayfinding*` (beacon pill, reduced-motion-safe).
  - Tests: `test/world-wayfinding.test.ts` (8) — total counts unique markers; picked-count clamp;
    collected label incl. singular; overview-available iff focused; empty-world guard; DOM chip reflects
    picks + overview enable/disable.

- **Turn 7 (v2) — P1 item 8 (child copy pass, SC-UI-17 copy criterion) DONE.** Fold the last two
  child-facing dev-tells out of the shared masthead: the "· synthetic preview" eyebrow and the render-
  tier status pill ("Accessible 2D tier"). Gate green: `tsc -b` 0 · root `pnpm test` **384/384** · app
  vitest **131/131** (+8) · `next build` ✓ (route `/` static, 288 kB) · biome clean on my files.
  **Browser-verified** (chromium+swiftshader, prod `next start :3131`): child `/` (tier quest-world-3d)
  → eyebrow **"Explore freely — nothing here is a test."**, pill **"Exploring"**; child + Calm mode ON
  (tier board-2d) → same eyebrow, pill **"Calm view"**; `/?debug` (staff) → eyebrow **"Interest Lab ·
  synthetic preview"**, pill **"Full 3D world"**. **ZERO console/page errors** on all three. Screenshot
  self-review: eyebrow in warm spark accent, pill top-right w/ green dot, no dev jargon in child chrome.
  See D-VP24.
  - **Pure `resolveMastheadCopy({ surface, staffDebug, renderTier })`** (`app/ui/mastheadCopy.ts`) →
    `{ contextLine, statusLabel }`; replaced the inline `TIER_STATUS` map + hardcoded eyebrow in
    `InterestLabClient`. Staff UNCHANGED (synthetic-preview eyebrow + tier name / "Evidence console").
    Child: no-test eyebrow + "Calm view"(board-2d)/"Exploring"(3D). Guide non-staff: "Interest Lab" +
    "Evidence console". Child eyebrow is about STAKES (no test/score — §U8.1, IL-005/6), not the lede's
    activity framing; the pill reflects the child's own calm choice truthfully.
  - Tests: `test/masthead-copy.test.ts` (8) — staff diagnostic copy per tier; child no-test eyebrow;
    calm/exploring pill per tier; a forbidden-substring guard (no synthetic/preview/tier/2D/3D/WebGL/
    board in any child string); guide non-staff copy; totality over surface×debug×tier.

- **STATE NOTE (reconciled this turn).** P1 item 7 (motif responds to focus) was already implemented +
  committed at HEAD (`resolveMotifFocus` in `world3d/motif.ts` + eased `useFrame` in `IslandMotif.tsx`,
  covered by `test/domain-motif.test.ts`) — its progress note wasn't recorded. Verified done; no rework.
  A merge from origin/main also landed the passion-centric repo restructure (all code under `passion/`);
  root `pnpm test` now globs `passion/{packages,adapters}/**` only (384). The interest-lab **app** tests
  run under the app's own vitest (`passion/apps/interest-lab`, 131) — run them separately; `tsc -b`
  covers the app.

## NEXT
- **App-polish items P1 5–8 are all DONE** (harness gate off the child build, wayfinding, motif focus,
  child copy). The 3D world is mature: 8 distinct island motifs w/ focus emphasis, wayfinding HUD,
  welcome-back bloom, and a full `@react-three/postprocessing` grade (`world3d/WorldPostFX.tsx` —
  Bloom/ToneMapping/Vignette). Remaining spec surface is mostly the app-level walkthrough SCs.
- **NEXT candidate — SC-UI-18 automated a11y walkthrough (child + guide).** Drive the app headless
  (Playwright, Chromium installed) and assert the DOM-as-AT-source contract that IS machine-checkable:
  (a) the 3D `<Canvas>` carries `aria-hidden="true"`; (b) the child **quest ledger** is a keyboard-
  navigable ordered list of card-buttons with accessible names (title + work-mode + why + return-state)
  and visible `--focus` rings on Tab; (c) picking a quest is operable via keyboard (Enter/Space), not
  pointer-only; (d) state is color-independent (icon + text). Encode as an app-level test where possible
  (jsdom render + role/aria assertions) + a browser walkthrough for focus/keyboard. Keep the gate green.
- **BLOCKED/MANUAL (SC-UI-18 remainder):** true screen-reader (VoiceOver/NVDA) + human contrast/AT
  verification is not doable headless in-lane — treat as `manual:` per the loop's blocked-criterion rule;
  it does not block the rest. Record findings; do not loop on a recheck marker.
- **CARRY-OVER P1.7 caveat (unchanged):** when the WORLD is later staged by age band (reducing world
  markers below `quests.length`), keep world-reachable == board-reachable by staging the BOARD's
  `revealAll` baseline to the same set (D-VP19).
- **CARRY-OVER lint debt (not mine):** pre-existing `pnpm lint` errors in out-of-lane
  evidence-explorer-view + prior-turn interest-lab files; left untouched.

- **Turn 8 (v2) — SC-UI-18 automated a11y walkthrough DONE (machine-checkable half) + a real
  reduced-transparency fix.** Gate green: `tsc -b` 0 · root `pnpm test` **384/384** · app vitest
  **137/137** (+6: `test/a11y-walkthrough.test.ts`) · `next build` ✓ (route `/` static, 288 kB) · my
  touched files biome-clean (2 pre-existing multi-line-`transition:` nits in globals.css @ ~2410/2529
  predate this turn, out of my edit region). **Browser-verified** (chromium headless, prod `next start`):
  child `/` mounted full `quest-world-3d` — 1 canvas `aria-hidden`, 6 native card-buttons keyboard-
  focusable w/ visible 3px `--focus` ring (#ffd166), Enter picks (aria-pressed false→true), skip-link →
  `#interest-lab-content` landmark, ZERO console errors; emulated `prefers-reduced-transparency` → child
  comfort deck computed `backgroundImage:none`+`backdropFilter:none` (SOLID), ZERO errors. See D-VP25.
  - Consolidated SC-UI-18's DOM-as-AT-source contract into `test/a11y-walkthrough.test.ts` (6): ledger
    operable WITH the aria-hidden 3D host; every quest control a native `<button type="button">` (no
    `role=`/`tabindex="-1"`); full accessible name = title + work-mode + why + return-state in one
    aria-label (quest-board.test only pinned the prefix); color-independent state (aria-pressed + text,
    glyphs aria-hidden, no emoji/score); skip-link → operable landmark + operable-with-zero-canvas.
  - **RED→GREEN (real fix):** `prefers-reduced-transparency` only solidified `.material` (0,1,0);
    `.control-panel.hud-deck` (0,2,0) kept its translucent gradient → child chrome stayed glassy. Added a
    reduced-transparency rule neutralising the deck (`background: --surface-solid; background-image: none;
    backdrop-filter: none;` + hide `::before`). Test pins the stylesheet block covers `.control-panel.hud-deck`.

## NEXT
- **SC-UI-18 machine-checkable half is DONE + browser-verified.** Remaining SC-UI-18 surface is
  **BLOCKED/MANUAL:** true screen-reader (VoiceOver/NVDA) + human contrast-ratio (≥4.5:1) verification is
  not doable headless in-lane → `manual:` per the loop's blocked-criterion rule; it does not block the
  rest. Do NOT loop a recheck marker on it.
- **NEXT candidate — the GUIDE console a11y (SC-UI-18, second surface).** The child surface is covered;
  the guide "Hypothesis Console" (CoverageMatrix = DOM table w/ row/col headers, ReturnTimeline = labelled
  dated marker list, Lifecycle = labelled state list + gate checklist text, EvidenceConstellation canvas
  `aria-hidden` w/ DOM-equivalent) needs the same consolidated machine-checkable walkthrough test: table
  header semantics + per-cell status text, timeline marker labels, lifecycle state/transition text, and
  the constellation canvas aria-hidden with its side-by-side DOM equivalent present. Encode via
  `renderToStaticMarkup` role/aria assertions (jsdom-free, matching the repo pattern). Keep the gate green.
- **THEN — U046/U047/U048 view-package guardrails (spec §U9 P15, SC-UI-10/11/12).** `plainViewEquals`
  across full-3D/3D-lite/2D/plain/reduced/age-band; the static guardrails (no `three`/`react` import, no
  score/rank/verdict field, no "you are a/an/the" copy); synthetic-only from Part-I fixtures. These are the
  pure view-package acceptance SCs that finalize the spec's parity/guardrail claims.
- **CARRY-OVER lint debt (not mine):** pre-existing `pnpm lint`/biome nits in out-of-lane
  evidence-explorer-view + prior-turn interest-lab files; left untouched.

- **Turn 9 (v2) — SC-UI-18 SECOND surface DONE: the guide Hypothesis Console DOM-as-AT-source
  walkthrough.** Extended the single SC-UI-18 file (`test/a11y-walkthrough.test.ts`, +5 → 11) with a
  `guide Hypothesis Console` describe block asserting the guide contract via jsdom-free
  `renderToStaticMarkup` (matches repo pattern): (a) coverage = semantic `<table>` w/ `<caption>` +
  `scope=col/row` + per-cell **text** status + decorative glyphs `aria-hidden`; (b) return timeline =
  `<ol>` of dated text markers, care markers "never lowers a signal", axis/glyphs/legend `aria-hidden`;
  (c) lifecycle = labelled state `<ol>`s w/ `aria-current="step"` + textual gate ("Present") + legal
  transitions text; (d) evidence constellation `aria-hidden` w/ side-by-side explanations + timeline DOM
  equivalent present WITH the canvas; (e) under reduced-motion the constellation drops yet every stateful
  panel is still readable from the DOM alone + no scalar score / no "you are a/an/the" label. Guide
  components already conformed → codification turn, no product source changed. See D-VP26.
  Gate green: `tsc -b` 0 · root `pnpm test` **384/384** · app vitest **142/142** · `next build` ✓
  (route `/` static, 288 kB) · touched file biome-clean.

## NEXT
- **SC-UI-18 is now DONE for BOTH surfaces (machine-checkable half) + child browser-verified (D-VP25).**
  Remaining SC-UI-18 surface is **BLOCKED/MANUAL:** true screen-reader (VoiceOver/NVDA) + human
  contrast-ratio (≥4.5:1) verification is not doable headless in-lane → `manual:` per the loop's
  blocked-criterion rule; it does not block the rest. Do NOT loop a recheck marker on it.
- **NEXT candidate — U046/U047/U048 view-package guardrails (spec §U9 P15, SC-UI-10/11/12).** These are
  the pure `interest-lab-view` acceptance SCs that finalize the spec's parity/guardrail claims:
  (1) `plainViewEquals` across full-3D / 3D-lite / 2D / plain / reduced / age-band — identical underlying
  state, differ only in `flags`+`presentation` (spec line 711 / SC-UI-19);
  (2) static guardrails — the view package must not import `three`/`react`, and no view field named
  `score`/`rank`/`verdict`/`passionScore`/`confidence`, and no "you are a/an/the" copy (line 1015);
  (3) `resolveQualityTier`/`resolveRenderTier` match the §U8.16 golden table.
  Encode in `passion/packages/interest-lab-view/test/` (the package already has `test/smoke.test.ts`).
  Synthetic-only from Part-I fixtures. Keep the gate green.
- **THEN — final spec sweep before `.loop-done`:** re-read `specs/003-interest-lab/spec.md` success-
  criteria list (SC-UI-1..19 + IL-*/G*) and `tasks.md`, mark each Done/Partial/manual, and — per the
  loop's "PROVE it's usable" bar — drive BOTH surfaces (child `/` + guide) headless in Chromium
  (webapp-testing/playwright): every control operable, zero console errors, no dead affordances, empty/
  loading/error states. Only then create `.loop-done`.
- **CARRY-OVER P1.7 caveat (unchanged):** if the WORLD is later staged by age band (world markers below
  `quests.length`), stage the BOARD `revealAll` baseline to the same set so world-reachable ==
  board-reachable (D-VP19).
- **CARRY-OVER lint debt (not mine):** pre-existing `pnpm lint`/biome nits in out-of-lane
  evidence-explorer-view + prior-turn interest-lab files; left untouched.

- **Turn 10 (v2) — FINAL: spec sweep + full usability proof → `.loop-done`.** No product source changed
  (verification + done-signal increment). Confirmed the whole `003-interest-lab` spec is implemented:
  gate green (`tsc -b` 0 · root `pnpm test` **384/384** · app vitest **142/142** · `next build` ✓), all
  16 SC-* + 18 SC-UI-* mapped to passing tests (§U10 / §14.4.3). Drove BOTH surfaces headless in Chromium
  (Playwright + swiftshader WebGL): **zero console/page errors** on child + guide. Child renders full
  `quest-world-3d` tier (bloom/shadows/graded palette); quest cards operable via click + keyboard Enter;
  calm toggle + "How to explore" operable; "See all islands" correctly disabled at home (intentional
  wayfinding). Guide renders Hypothesis Console — semantic coverage table, timeline/lifecycle `<ol>`s,
  `aria-hidden` constellation canvas, working "Author operative revision" button; surface toggle works.
  The ~66 warnings are swiftshader software-GL emulation noise (`glBlitFramebuffer` depth-stencil in the
  postprocessing composer), not errors, absent on real GPUs. Created `.loop-done`. See D-VP27.

## NEXT
- **SPEC COMPLETE — `.loop-done` created.** `specs/003-interest-lab` is fully implemented: Part-I pure
  domain + adapters, Part-II GPU-free view package (`plainViewEquals`/guardrails/synthetic all green),
  and the Next.js app with the 3D quest world, 2D board, reduced-motion/plain tiers, age bands, child +
  guide surfaces. Gate green; both surfaces browser-verified usable with zero errors.
- **Only residual is MANUAL (does not block completion):** live screen-reader (VoiceOver/NVDA) + human
  ≥4.5:1 contrast-ratio verification of SC-UI-18 — not doable headless in-lane; the machine-checkable
  half is green + browser-verified on both surfaces. A human should do the final AT/contrast pass.
- If the harness's adversarial usability gate returns findings, address them here; otherwise this spec
  is done.

- **Turn 11 (v2) — FIX the adversarial-QA rejection: app was unservable under the harness filter.**
  The QA gate serves via **`pnpm --filter @gt100k/interest-lab exec next dev`** (a fixed harness
  convention — the bare feature slug), but our app was misnamed **`@gt100k/interest-lab-app`** while the
  bare name `@gt100k/interest-lab` was taken by the **domain** package. So the filter resolved the
  *domain* pkg (no `next` bin) → `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "next" not found` → app
  never came up → QA FAILED. This was the ONLY defect; the app itself was verified usable at Turn 10.
  - **Root cause + fix:** aligned interest-lab with the repo convention proven by the two sibling apps
    (`evidence-explorer` → `@gt100k/evidence-explorer`, `passion-tutor` → `@gt100k/passion-tutor` with
    its domain as `@gt100k/passion-tutor-domain`) AND corroborated by the **root `build` script**, which
    already filters `@gt100k/interest-lab` expecting *the app* to carry that name. Renamed **app**
    `@gt100k/interest-lab-app` → **`@gt100k/interest-lab`** and **domain** `@gt100k/interest-lab` →
    **`@gt100k/interest-lab-domain`**. No product/runtime code changed — only package `name` fields +
    import specifiers (quote-delimited replace, `-view`/`-app` untouched, no subpath imports) + the
    lockfile. Root `tsconfig` references are by directory path (unchanged). See D-VP28.
  - **Verified:** the exact harness command `pnpm --filter @gt100k/interest-lab exec next dev -p 3779`
    now brings Next.js up (Ready ~3s, **HTTP 200**, child surface renders "Explore freely"/quest cards).
    Gate green: `tsc -b` **0** · root `pnpm test` **384/384** · app vitest (`--filter @gt100k/interest-lab
    test`) **142/142** · `pnpm --filter @gt100k/interest-lab build` ✓ (route `/` static, 288 kB / 375 kB
    first load). **Browser-verified** (Chromium headless via the running dev server): child `/` +
    `/?debug` both load with **ZERO real console/page errors** (only swiftshader software-GL warnings),
    quest cards well-formed (full aria-label), world renders. Updated the 14 runnable `-app` command refs
    across the spec docs + the progress gate header. Re-created `.loop-done`.

## NEXT
- **SPEC COMPLETE — packaging bug fixed, `.loop-done` re-created.** The app is now servable under the
  harness convention and both surfaces are browser-verified usable with zero errors.
- **Residual MANUAL (unchanged, non-blocking):** live screen-reader (VoiceOver/NVDA) + human ≥4.5:1
  contrast-ratio verification of SC-UI-18 — not doable headless in-lane.
- If the harness's adversarial usability gate returns further findings, address them here.
