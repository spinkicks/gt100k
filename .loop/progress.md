# Loop progress — WORLD lane (Emberwood cozy-cabin world)

The shared CORE is COMPLETE (frozen `ZonePlugin`, `<CuriosityMap>`, `<CanvasHost>`, `<ZoneRoom>`,
stub zones, signal engine, accessible DOM map, `window.__qa`). **Do NOT rebuild the core or change
the frozen contracts** — theme + build ON TOP (value/reference layer only).

## Serve + shoot recipe (reuse every turn)
- App: `passion/apps/interest-lab` (Next.js, pkg name `@gt100k/interest-lab-app`). Serve:
  `PORT=3400 pnpm dev` from that dir. **Kill stale next FIRST** (`pkill -9 -f next`).
  ⚠️ **A running `next dev` locks `.next`** — the gate's `pnpm build` for the app is a no-op/blocked
  while dev runs (and the repo `build` script filters `@gt100k/interest-lab`, the *package*, which has
  no build script; the APP is `@gt100k/interest-lab-app` → `pnpm --filter @gt100k/interest-lab-app build`).
  So: kill dev before building; build the app by its real name to prove production.
- Screenshot: `/tmp/pw-venv` python playwright, `PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright`.
  `/tmp/shoot_map.py <port> <out>` shoots the `.clearing` element + prints QA/liveness/errors.
  `/tmp/shoot_rm.py` = reduced-motion still. `/tmp/sample_clearing.py` = pixel cohesion/shadow checks.

## Architecture reality
Child surface = warm DOM shell (`globals.css`, child-scoped `[data-active-surface="child"]`) + a 3D
`<Canvas>` below the fold (`app/child/world3d/*`) + the **Curiosity Map** (now the styled clearing).
The map lives in `packages/interest-zone-kit/src/curiosity-map.tsx` (shared component). It self-styles
via inline SVG + a scoped `<style dangerouslySetInnerHTML>` block consuming `MAP_COLOR_SCRIPT`+`CABIN`
tokens — no bundler CSS, works in jsdom + SSR (dangerouslySetInnerHTML avoids the `<style>`-text
hydration mismatch: server escapes `"`→`&quot;`, client doesn't).

## Done this turn — P-A1 (the clearing to bar)
- **Rebuilt `CuriosityMap` into "Golden Hour in the Clearing" (§6).** Layered scene: cream→peach sky +
  low sun (upper-left) → hazed swaying pine treeline → lit ground plate + winding warm dirt path +
  pond/footbridge → long **blue-violet** dusk shadows → back-center **Lodge + lit hearth ("Home · you
  are here")** with 4-puff rising smoke → three cabins as **real focusable buttons** in a foreground arc:
  Music (terracotta, chimney), Code (**sage** greenhouse w/ glass gable + cyan tool-glint), Art
  (**periwinkle** skylight). Each = hue + SVG silhouette + hanging-sign glyph + label + verb (4 channels).
- **Contracts preserved:** region `aria-label="Curiosity Map"` (not aria-hidden),
  `data-primary-surface="curiosity-map"`, roving tabindex, Arrow L/R/U/D nav, `aria-pressed`, ariaLabels,
  time-lapse button `aria-label`=next phase. `interactives()`/`stateHash()` are data-driven → untouched.
  All 511 tests green incl. the 3 curiosity-map DOM tests. Added optional `reducedMotion` prop, wired
  from the shell.
- **Ambient life (Pillar F, ≥3):** tree sway · hearth smoke · fireflies (thicken toward dusk) · ambling
  cat · window flicker (≤3%) · hearth pulse = 6 motions. **Time-lapse** lowers the sun + brings out
  fireflies at 7/30-day. All disabled under `prefers-reduced-motion` AND `[data-reduced-motion]`.
- **DELTA quick-wins:** warmed the last midnight chip (`.quest-world-instruction` "Focus a quest below")
  + the pale eyebrows (`.context-line`/`.surface-name`) in the child scope (DELTA #6/#7).
- Gate GREEN: typecheck ✅ · 511 tests ✅ · repo build ✅ · **app production build ✅** · zero
  console/page errors (default + reduced-motion) · liveness ✅ (cabin click → activeZoneId "music") ·
  reduced-motion calm still ✅. Cohesion/shadow-color/firelight model-free checks pass.

## Self-score (§12, pA1-clearing.png vs clearing.png) — anchored 10/7/4/2
- Map cohesion & wayfinding: **7** (one hamlet, you-are-here Lodge, 3 legible cabins on a path) · +2: bolder path + foreground framing.
- Cabin legibility: **7** (craft nameable via hue+silhouette+sign+label) · +2: distinct rooflines (horn/glass-gable/skylight).
- Warmth & coziness: **7**.
- Firelight & no dead shadow: **6** (amber windows + hearth glow, blue-violet shadows; no literal campfire flame) · +2: a small fire ring / stronger standing smoke.
- Palette / color-script discipline: **8** (all on §3; warm/cool split holds — Art is the one cool building).
- Ambient motion & life: **7** (6 motions; one second from motion).
- Dressing density / lived-in: **6** (Lodge+3 cabins+pond+bridge+path+grass+cat+fireflies+signs).
- Accessibility parity: **8** (real buttons, roving tabindex, arrow nav, ariaLabels, calm reduced-motion).
- Chromebook perf: **8** (pure DOM/SVG/CSS, ~0 GPU, no draw calls).
- **Overall the clearing (two-frame frame 1) ≈ 7 — MEETS the ≥7 bar.** Was ~3 (raw list) at P-A0.

## Closest banned outcome + cheapest move away
Was **"illegibility / cold-cabin"** (raw debug list) — now DEFEATED. Now closest to **"incoherence:
cloned props"** — the three cabins share one silhouette (varied only by hue/feature). Cheapest move
away next: give each cabin a distinct roofline (Music gramophone-horn cupola, Code prominent glass
gable, Art big north-light skylight) so silhouette alone names the craft. That's the top DELTA item.

## Done this turn — P-A2 (the Atelier interior to bar) + fixed a RED gate + killed a runtime crash
Started from a **failed gate** (`.loop/last-gate.txt`): the app production build was RED —
`AtelierRoom` referenced a non-existent `<ProceduralEnv>`. Fixed FIRST, then improved the surface.
- **Gate fix (data-driven, not a papering-over):** `AtelierRoom` now renders
  `<ProceduralEnvironment {...scene.env}>`; `AtelierScene.env` became the 5-color `EnvColors` shape
  the PMREM component actually consumes (was a stale `Lightformer[]`). Cohesion test maps
  `Object.values(scene.env)`. The scene DESCRIPTION and the RENDER no longer diverge.
- **Killed the intermittent `<EnvironmentPortal>` crash** (`reading '0'` → blank canvas under
  `frameloop="demand"`, a §11 risk). It lived in the shared `World3DCanvas` (drei `<Environment>` + 4
  `<Lightformer>`), NOT just the room — replaced with the crash-free PMREM `ProceduralEnvironment`.
  **Verified: 3 clean full-page loads, 0 page errors** (was flaky-crashing).
- **The doorway now reads (top prior delta closed):** the easel canvas is a clear **luminous
  periwinkle portal** (ATELIER_HUE emissive @1.5, blooms) — the room's one cool accent lands on the
  invitation. Warm sunset brushwork kept but shrunk to a *started* corner vignette + one periwinkle
  wet stroke (honest "half-finished" read preserved).
- Gate GREEN: typecheck ✅ · 516 tests ✅ · **app production build ✅** · atelier renders warm/cozy/
  legible, 0 console/page errors (motion + reduced-motion) · liveness ✅ (art cabin → activeZoneId
  "art"; a_build/a_compose/a_explain live) · reduced-motion → calm accessible DOM action panel ✅.

## Self-score (§12, pA2-atelier-portal.png vs §7.2 written frame) — anchored 10/7/4/2
- Room cohesion & warmth: **8** (one cohesive golden-hour cabin; all on §3 palette; no dead gray).
- Golden shaft + drifting motes (the soul): **8** (soft feathered volumetric beam, motes visible).
- Doorway legibility: **8** (the periwinkle portal is now the single obvious "step up to the easel").
- Dressing density / lived-in: **8** (90 objects, 13 surface classes: desk · gallery wall · easel ·
  rug · stool · 2 plants · string-lights · cat · shelves · cups — far past ≥30/≥5).
- Firelight / warm sources: **7** (window spill + bulbs + stove glow; 13 warm sources; stove could be
  more distinct).
- Blue-violet shadow: **pass** (frozen ContactShadows, `isBlueViolet` asserted).
- Ambient life: **7** (fire flicker · cat breathing · plant sway · motes; one second from motion).
- Accessibility + liveness: **8** (aria-hidden canvas HAS a real DOM peer — the action panel;
  reduced-motion = calm accessible still; all interactives live, 0 errors).
- Chromebook perf: **8** (≤1 frozen shadow-caster, demand loop, lean 3-pass post, no CDN/HDRI fetch).
- **Overall the Atelier (two-frame frame 2) ≈ 7.5 — MEETS the ≥7 bar.**

## Closest banned outcome + cheapest move away
Was the **"blank/erroring build"** (the `<Environment>` crash) — now DEFEATED (0 errors, 3 clean
loads). Now closest to **"pretty but slightly bare center / ambiguous window"** — the shaft fills the
mid-ground but its source window reads faintly and the periwinkle portal is a flat plane. Cheapest
move away next: a clearer bright mullioned window plane at the shaft origin + a dim halo plane behind
the portal (top DELTA items for the atelier).

## Two-frame acceptance (§14) — BOTH frames ≥7
- Frame (a) clearing at golden hour — `pA1-clearing.png` ≈ **7** (unchanged this turn).
- Frame (b) cabin interior (the Atelier) — `pA2-atelier-portal.png` ≈ **7.5** (this turn).
- Model-free tests pass on both (cohesion · shadow-color · firelight · primary-action-live). Green
  tree (typecheck · 516 tests · app build). Doorways provably live; a11y peer real; `window.__qa`
  present. → **DoD met for the map + first cabin core; creating `.loop-done`.**

## NEXT — CONTINUE TO THE FULL WORLD (operator directive: build all three cabins, not just the minimum)
The clearing + the **Atelier (Art)** cabin are DONE and gate-verified (QA + VLM both PASSED) — **do NOT
redo them.** The **Music and Code cabins are still core STUBS** — build them to the bar next, then polish.
**Do NOT create `.loop-done` until ALL THREE cabin interiors are to the bar** (self-score ≥7, QA + VLM).
Reuse the now-proven **crash-free `ProceduralEnvironment` + atelier-scene pattern** for both.
- **1) Music — "The Sounding Cabin" (`sound_music`)** — build the interior to the bar per
  `docs/superpowers/specs/2026-07-21-cabin-interior-music.md` (warm-wood upright piano hero, hi-fi corner,
  the glowing console screen doorway; distinct **gramophone-horn cupola** roofline).
- **2) Code — "The Tinker Workshop" (`symbols_math`)** — build per
  `docs/superpowers/specs/2026-07-21-cabin-interior-code.md`: the doorway is **The Coding Desk** (a warm-
  glowing monitor + mechanical keyboard, **never cold-blue**), the little robot is **Sprout**, plus the
  **Claude** desk-buddy; language toys/books; distinct **glass-gable** roofline.
- **3) Then polish** — Atelier deltas (mullioned window at the shaft origin · soft halo behind the
  periwinkle portal · distinct wood-stove corner · vary gallery-frame sizes/tilt) and clearing deltas
  (distinct cabin rooflines so silhouette names the craft · bolder path contrast · tighter sun disc +
  denser foliage). Screenshot + delta-loop each surface every turn; keep the gate green.

## Done this turn — P-A3 (the Sounding Cabin / Music interior PROVEN + polished to the bar)
Started from a misleading state: the Music room (`SoundingCabinRoom` + `music-scene`, 55+ props, wired
in `app/zones.ts`, 7 tests green) was committed last turn but its committed shot `pA3-music.png` was a
**blank cream frame** — a pre-settle demand-loop capture, NOT a broken room. Also found + fixed a real
ops issue: **multiple stale `next dev` servers were fighting over `.next`** (404s on static chunks,
flaky `window.__qa` attach). Killed all, freed :3400, one clean server → clean loads.
- **PROVED the room renders** (real shot, 0 console/page errors, liveness ✓: entering Music flips
  activeZoneId→"music"; m_build/m_debug/m_perform all live). Replaced the blank committed shot with a
  real one (`pA3-music.png` + `-reducedmotion.png`).
- **Doorway now reads as a music-studio portal** (top delta closed): added a bright candle EQ +
  waveform glyph ON the console screen (reads as live audio software) + a soft MUSIC_HUE glow halo rim
  → the single obvious "open the studio."
- **Killed the near-white upper-left void** (§13.4 off-palette white): added a warm dark timber ceiling
  above the beams → dark-cozy-edges → lit-center composition (§2.4). Tamed the left-wall blowout
  (chink plaster→woodDrift, key 1.25→1.08, fg-post pulled into frame), calmed the window
  (emissive 0.64→0.44), softened the shaft, deepened the vignette (0.44→0.52).
- Gate GREEN: root typecheck (tsc -b) ✅ · **96 tests** ✅ (music 7 · atelier 5 · qa-bridge 3 · +) ·
  **app production build ✅** · 0 errors motion+reduced-motion · RM = calm accessible "Step inside" peer.

## Self-score (§12, pA3-music.png vs §7.2 + reference bar) — anchored 10/7/4/2
- Room cohesion & warmth: **8** (enclosed warm-timber cabin; all on §3; no dead gray).
- Doorway legibility: **8** (EQ studio screen + halo = unmistakable "open the studio", a warm door).
- Golden shaft + motes: **7** (soft warm beam + drifting motes; still a defined wedge).
- Dressing density / lived-in: **8** (~57 objects, 13 surface classes: piano · desk · hi-fi corner ·
  instrument wall · shelf · window · hearth/stove · plants · lights · textiles · life — far past ≥42/≥8).
- Firelight / warm sources: **7** (wood-stove firebox+flame @3.0–3.2 · window spill · lamps · valves · sconces).
- Blue-violet shadow: **pass** (frozen ContactShadows duskShadow, isBlueViolet asserted).
- Ambient life: **7** (fire flicker · Biscuit the cat breathing · hanging-plant sway · motes; one second from motion).
- Accessibility + liveness: **8** (aria-hidden canvas HAS a DOM peer; 3 actions live; 0 errors; calm RM still).
- Chromebook perf: **8** (≤1 frozen shadow-caster, demand loop, lean 3-pass post, procedural env — no CDN/HDRI).
- **Overall the Sounding Cabin ≈ 7.5 — MEETS the ≥7 bar.**

## Closest banned outcome + cheapest move away (Music)
Was **"blank/erroring build"** (the committed blank shot) — now DEFEATED (real verified render, 0
errors, 3 clean loads). Now closest to **"pretty but a slightly bare/washed left corner"** — the
mid-left wall strip left of the piano still reads a touch pale. Cheapest move away: warm that corner /
add a dark dressing element (bookshelf, coat-rack) to frame the far-left edge (top Music DELTA item).

## Cabin status → NEXT is the CODE cabin (the last stub)
- Clearing (map): DONE (P-A1, ≈7). Art/Atelier: DONE (P-A2, ≈7.5). **Music/Sounding Cabin: DONE this
  turn (P-A3, ≈7.5).** → Two-frame acceptance holds on both graded frames; all model-free tests pass.
- **STILL A STUB: Code — "The Tinker Workshop" (`symbols_math`).** Build the interior to the bar per
  `docs/superpowers/specs/2026-07-21-cabin-interior-code.md`, reusing the proven crash-free
  `ProceduralEnvironment` + scene-description pattern (copy music-scene.ts → code-scene.ts). The
  doorway is **The Coding Desk** — a WARM-glowing monitor + mechanical keyboard, **NEVER cold-blue**
  (that's the §11 trap for a code room); the little robot is **Sprout** + a **Claude** desk-buddy;
  language toys/books; distinct **glass-gable** roofline read. THEN create `.loop-done` (all three cabins).
- Do NOT redo the clearing/Atelier/Music — they are gate-verified. Extend to Code, then polish deltas.

## Done this turn — P-A4 (the Tinker Workshop / CODE interior PROVEN + polished to the bar) — LAST CABIN
Built the final stub cabin (`code`, domain `symbols_math`) to the bar, reusing the proven crash-free
`ProceduralEnvironment` + scene-description pattern (copied music-scene→`code-scene.ts`,
SoundingCabinRoom→`TinkerWorkshopRoom.tsx`). Wired `codeStub`→`TinkerWorkshopRoom` in `app/zones.ts`
(zone id "code"). Added `test/code-room.test.ts` (7 tests). "The Tinker Workshop" = a cozy warm log
workshop where a kid codes: a central honey-wood **Coding Desk** with a real kid-recognizable computer.
- **PROVED it renders** (`pA4-code.png`, 0 console/page errors, liveness ✓: entering Code flips
  activeZoneId→"code"; c_build/c_debug/c_investigate all live). RM → calm accessible "Step inside"
  Build/Debug/Investigate DOM peer (`pA4-code-reducedmotion.png`).
- **DEFEATED the §11/§6.4 cold-blue-screen trap (the top delta):** a solid sage plane bloomed to a cold
  cyan-white slab. FIXED with a warm-DARK green editor bg (forestDeep) glowing controlled sage @0.9
  (tone-mapped → green not white) + bright blooming legible code lines (amber/spark/sage/mint) + a green
  leaf output + blinking amber cursor → reads unmistakably as "a computer showing colorful code," warm.
- **Polished deltas 2+3:** darkened the pale left wall (chink woodDrift→woodOak + a dark forestDeep
  coding poster) · shifted the golden shaft left + softened it so it no longer bisects the monitor ·
  enlarged Claude the AI desk-buddy (eyes + smile + mint LED).
- Gate GREEN: root typecheck (tsc -b) ✅ · **103 tests** ✅ (code 7 · music 7 · atelier 5 · qa-bridge 3
  · +) · **app production build ✅** · 0 errors motion+RM.

## Self-score (§12, pA4-code.png vs §7 "The Sunlit Coding Nook" + reference bar) — anchored 10/7/4/2
- Room cohesion & warmth: **8** (one cohesive golden-hour log workshop; all on §3; no dead gray).
- Reads as CODE in ≤1s / doorway legibility: **8** (warm-dark sage editor showing colorful code + a
  green leaf output + amber cursor = unmistakable "step up to the desk"; NOT cold-blue, NOT a steampunk
  shop, NOT an RGB battlestation — the three §11 code traps all avoided).
- Golden shaft + motes: **7** (soft warm beam onto the rug; drifting motes).
- Dressing density / lived-in: **8** (~90 objects, 15 surface classes: desk · monitor · keyboard ·
  laptop · Claude · Sprout+blocks · nook+books · wall-of-ideas · shelf · hearth · window · plants ·
  textiles · life — far past ≥40/≥6).
- Firelight / warm sources: **7** (wood-stove firebox+flame @3.0–3.2 · window spill · lamps ·
  string-lights · RUN key · shelf lamp).
- Blue-violet shadow: **pass** (frozen ContactShadows duskShadow, isBlueViolet asserted).
- No cold-blue screen: **pass** (machine-guarded — every "screen" prop non-blue in color + emissive).
- Ambient life: **7** (fire flicker · Biscuit breathing · plant sway · cursor blink · Claude idle bob · motes).
- Accessibility + liveness: **8** (aria-hidden canvas HAS a DOM peer; 3 actions live; 0 errors; calm RM still).
- Chromebook perf: **8** (≤1 frozen shadow-caster, demand loop, lean 3-pass post, procedural env — no CDN/HDRI).
- **Overall the Tinker Workshop ≈ 7.5 — MEETS the ≥7 bar.**

## Closest banned outcome + cheapest move away (Code)
Was the **"cold-blue screen"** (§11/§6.4 code-room trap) — now DEFEATED (warm-dark sage editor,
machine-guarded). Now closest to **"pretty but the RUN key / run-it affordance under-reads"** — the
c_debug "run it" hero (the amber RUN key) is subtle at wide shot. Cheapest move away next: brighten +
enlarge the RUN keycap so the tactile "run it" pops (top Code DELTA item).

## Cabin status → ALL THREE CABINS + CLEARING ARE TO THE BAR (Definition of Done met)
- Clearing (map): DONE (P-A1, ≈7). Art/Atelier: DONE (P-A2, ≈7.5). Music/Sounding Cabin: DONE
  (P-A3, ≈7.5). **Code/Tinker Workshop: DONE this turn (P-A4, ≈7.5).**
- Two-frame acceptance (§14) holds on the graded frames; all model-free tests pass (cohesion ·
  shadow-color · firelight · no-cold-blue-screen · primary-action-live). Green tree (typecheck · 103
  tests · app build). Every doorway provably live; a11y peer real; `window.__qa` present.
- → **DoD met: the clearing + ALL THREE cabin interiors are to the bar. Creating `.loop-done`.**
- NEXT (if the loop continues): polish deltas — brighten the RUN key · larger monitor code lines ·
  Atelier mullioned window/halo · clearing distinct rooflines. Do NOT redo any surface (all gate-verified).
