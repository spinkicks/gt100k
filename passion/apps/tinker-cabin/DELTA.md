# DELTA — Tinker Workshop cabin

Ranked reference-comparison log (LAAS-style). Worst-first gaps between current canonical framings
and `reference/`, carried across phases until closed. Gate verdicts carry measurements; self-scores
/10. Newest phase block on top. See `PROJECT.md` for floors + Definition of Done, and
`reference/README.md` for targets.

Canonical framings (fixed `?cam` per framing, defined in `tools/battery.ts`):
`hero` (fireplace + cat) · `desk` (coding station) · `window` (key/fill light) · `wide` (whole room) ·
`detail` (material/cat close-up).

Terminal bar (Definition of Done): every framing self-score **≥8/10**, **mean ≥8.5**, all named
gates green, ≥60fps (≥30 hard floor). Plateau rule: ~5 turns of new approaches on a stuck framing,
then checkpoint (draft PR + honest per-framing scores + remaining gaps).

---

## Phase 2–4 — Structure + materials + window (2026-07-22) — ALL GATES PASS

**Shots judged:** all 5 framings. **All gates green**, determinism PASS, 34–64 fps (SwiftShader).
Added: exposed timber ceiling beams + purlins; full-height **stone chimney breast** + hearth slab
(procedural stone texture); **mountain-view picture window** (procedural dusk vista, unlit map, muntins);
warm **table lamp**. Fixed: window was buried in the wall / vista occluded by a solid frame + not
emissive — now a basic-map pane in front of the frame reads as a real view; bloom threshold 0.72→0.85
+ softer cool directional killed the wall specular blowout.

### Resolved (worst-first from Phase 1)
1. ~~Flat plasticky surround~~ **FIXED**: full-height procedural **stone chimney breast** + hearth.
2. ~~Bare ceiling~~ **FIXED**: exposed timber cross-beams + 2 purlins.
3. ~~No view window / blown panel~~ **FIXED**: mountain vista picture window, reads as a real view;
   window tonemap-highlights now PASS.
4. ~~material-variance near-miss~~ **FIXED**: passes on every framing (0.11–0.24).

### Carried / new gaps (worst first)
1. **Fire is stylized** — cone tongues + a bright sphere core read cartoonish vs ref `01`'s tongues.
   Needs a sprite/shader flame + softer core. **[Phase 5]**
2. **Cat is a placeholder** (spheres/torus). Real CC0 glTF + idle breathing. **[Phase 5]**
3. **Walls read a little clean/repetitive** — add grime/variation, maybe a second wood tone + trim.
   **[Phase 2 polish]**
4. **Lamp shade blows to white** (emissive 1.6) — soften + add a warm glow gradient. **[Phase 5]**
5. **No workbench/tools/rug/clutter** yet (ref `02`/`07`). **[Phase 6]**
6. **Desk coding-station** is a plain box + blue screen — needs to read as the "first taste" station.
   **[Phase 6 + Phase 8 loop]**

### Gate verdicts (turn 2)
- ALL PASS. no-crushed-blacks 0–0.03 · material-variance 0.11–0.24 · tonemap ≤ 0.005 ·
  no-flat-face 0.04–0.19 · fire-emissive hero 0.025 / detail 0.11 · warm-cool-split wide 0.05 ·
  fire-lit + cat-present PASS · fps ≥ 34 · determinism 0.0.

### Self-scores (/10, vs references + user ref 07)
- hero **6** · wide **6.5** · window **7** · desk **5.5** · detail **6**. Mean **~6.2** (was 3.8).
  Cabin now reads as a real cozy beamed cabin w/ stone hearth + mountain window. Gap to 8.5: the
  fire, the cat, wall richness, and set-dressing.

---

## Phase 1 — First light (2026-07-22) — greybox + materials + lighting up, harness green

**Shots judged:** `shots/{hero,desk,window,wide,detail}.png` (1280×720, freeze).
**References:** `01` fire, `04` cat, `05` pine interior, `02` workbench, `06` desk, + user ref `07`
(beam+stone+mountain-window cabin — in-context target, drop file in for pixel-compare).

### Top gaps (worst first)
1. **Flat fireplace surround — needs a STONE CHIMNEY BREAST** rising to the ceiling (ref `07`); the
   grey box reads plasticky (the bake-off's #1 flaw too). **[Phase 2/3]**
2. **Bare ceiling — needs exposed heavy TIMBER BEAMS** (ref `07`); current flat dark plane is the
   biggest "not a real cabin" tell. **[Phase 2]**
3. **No view window** — ref `05`/`07` have a bright window with a mountain/dusk vista; it's the
   biggest cool-light + realism lever. Current window is a small emissive panel that *blows out*
   (window framing tonemap-highlights FAIL 0.049). **[Phase 3/4]**
4. **material-variance near-miss** on hero (0.09) + desk (0.084) vs > 0.10 — walls/floor read a bit
   flat/dark; needs stronger grain, dirt, and lamp pools of light. **[Phase 2]**
5. **Fire is blobby** — the hot-core sphere dominates; ref `01` has distinct flame tongues + ember
   bed. Needs a better flame (sprite/shader) + tuned bloom. **[Phase 5]**
6. **No warm lamp(s) / set-dressing / rug** (ref `07`): workbench tools, rug, cozy clutter absent.
   **[Phase 6]**
7. **Cat is a placeholder** (spheres/torus); reads as an animal but not photoreal. Real CC0 glTF +
   idle anim. **[Phase 5]**
8. **SwiftShader fps 34–61** (software GL headless) — above the ≥30 floor; real GPU hits 60. Not a
   real gap, just a measurement caveat. **[accepted]**

### Gate verdicts (turn 1)
- no-crushed-blacks PASS (0–0.05) · no-flat-face PASS (0.05–0.19) · tonemap PASS except **window
  FAIL 0.049** · **material-variance FAIL hero 0.09 / desk 0.084**, PASS elsewhere ·
  fire-emissive PASS (hero 0.0067, detail/wide ok) · fire-lit + cat-present PASS (semantic) ·
  fps-floor PASS (≥34) · **determinism PASS (0.0)**.

### Self-scores (/10, vs references)
- hero **4** · wide **4** · window **3** (blown panel) · desk **3.5** · detail **4.5**. Mean **~3.8**.
  Honest turn-1 greybox: right ingredients + warm/cool mood + working harness, but flat surround,
  bare ceiling, and no real window keep it far from `07`. Target: mean ≥ 8.5, each ≥ 8.

---

## Phase 0 — Bootstrap (2026-07-22)
Scaffolded Vite+R3F app, harness ported, references sourced, first battery green (determinism + most
floors). Superseded by Phase 1 above.
