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

## NEXT
- **P-A2 — one cabin interior to bar (the Atelier, highest bar; §7.2/§8).** This is required for the
  two-frame acceptance (§14) frame 2 and thus for `.loop-done`. Take one zone room (start Atelier /
  Art) to the full lighting recipe (§5) + shared cabin kit (§8.1) + craft layer + doorway object
  (§8.2): golden window shaft + dust motes, glowing wood-stove, beamed log walls, drafting desk +
  Storybox, gallery wall w/ one half-finished glowing frame, the luminous periwinkle easel as the one
  obvious doorway, a cat on the sill. Long blue-violet shadows. **Need a Ghibli interior reference** —
  web-search + save `.loop/reference/atelier-interior.png` first (phase 0 for that surface).
- Then polish the clearing's top-3 deltas (distinct rooflines · bolder path · tighter sun/foliage).
- **Do NOT `.loop-done` yet:** DoD needs BOTH frames ≥7. Frame 1 (clearing) is at ≥7; frame 2 (cabin
  interior) is P-A2, not built. This turn = P-A1 done; the world is a real, alive, cozy *map*.
