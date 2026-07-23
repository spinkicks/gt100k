# PROJECT — Tinker Workshop Cabin

The brief. Sets **what** and **what-not** and the **measurable floors**; deliberately does not
prescribe *how* (architecture/execution is the loop's job). Modeled on the voxel-world `PROJECT.md`,
adapted for a **photoreal interior** instead of a stylized voxel exterior.

## Mission
A single-room, **photoreal, explorable log-cabin interior** that renders in the browser and doubles
as a kid's coding/tinkering workshop. You walk through it in first person; the point is that it
feels like a real, warm, lived-in place. It has a **lit fireplace** and a **cat** (both mandatory).
It is the "cabin" surface of the Discovery loop:

1. **Explore** — WASD + mouselook navigation of the cabin (input layer extensible: gamepad/touch
   later behind the same intent API).
2. **A code "first taste"** — approaching the desk/coding-station launches a tiny embedded code
   mini-app (a first, low-stakes taste of programming).
3. **Behavioral signal capture** — the session emits structured signals (dwell time per zone, what
   the child approached, time-in-mini-app, retries, completion) for the passion evidence graph.

Polish is driven by an iteration loop that judges framed screenshots against `reference/` and grinds
down the gaps. It is not a game — no combat/scoring; the fireplace, the cat, and the code taste are
the whole experience.

## Aesthetic north-star
Cozy, warm, photoreal log-cabin dusk (see `reference/README.md`). **Warm firelight is the key**:
saturated orange→amber glow from the hearth (ref `01`), hot flame cores, ember pool. **Cool daylight
from a window is the fill/contrast** (ref `05`) raking across pine-plank walls. Wood everywhere —
warm pine/log grain with real roughness and seam AO (ref `03`). A real-feeling **cat** curled by the
fire (ref `04`, fur + resting pose). A **workbench** of tinkering clutter (ref `02`) and a **desk
with a lit screen** as the coding nook (ref `06`). Deep shadows that stay readable, never crushed to
pure black. ACES-tonemapped, filmic, natural — not plasticky, not flat-lit.

## Hard requirements
- **Photoreal PBR interior:** all surfaces use physically-based materials (albedo + roughness +
  normal + AO/metalness as appropriate). Wood, stone hearth, fabric, metal tools each read as their
  real material.
- **Lighting:** a **warm fire key** (emissive + light at the fireplace, gently flickering) plus a
  **cool window fill**. Baked or real-time GI/AO is acceptable as long as the gates pass; contact
  shadows and soft indirect bounce must read.
- **Fireplace (mandatory):** a stone/brick hearth with a visibly burning fire that casts warm light
  into the room. No fire → hard fail.
- **Cat (mandatory):** a detectable cat in the scene (curled by the fire by default), reading as an
  animal, with at least idle life (breathing/ear/tail). No cat → hard fail.
- **Tonemap:** **ACES** filmic tonemapping + sane exposure; sRGB output. No clipped/blown highlights
  beyond the tonemap-range gate; no crushed blacks.
- **Navigable:** first-person **WASD + mouselook** with floor collision and no wall clip-through.
  Input is routed through an intent layer so gamepad/touch can be added without touching the camera.
- **Code "first taste" hook:** an interactable coding-station that launches the embedded mini-app,
  and emits the behavioral signals described in the Mission.
- **Deterministic harness hooks:** URL params
  `?seed &?cam=x,y,z,yaw,pitch[,fov] &?freeze=1` (freeze pauses fire/cat/anim + fixes RNG so a frame
  is reproducible). App exposes `window.__cabin = { ready, error, progress, stats }`
  (`stats` includes `fps`, draw calls, triangle count).
- **Interactive perf:** target **60 fps** at the hero framing at 1280×720; **30 fps is the hard
  floor**. Runs locally on **macOS / Chrome** via `pnpm dev` → `localhost` dev server.

## Banned outcomes (hard fails — gated)
- **Crushed pure-black shadows** — shadowed regions must retain graded detail, never `#000` fill.
- **Flat/unlit surfaces** — no uniform-lit faces; shading must prove light direction + AO.
- **No visible fire light** — the fireplace must emit warm light into the room.
- **Missing cat** — the cat must be present and detectable.
- **Plasticky / untextured materials** — no smooth single-color surfaces where wood/stone/fabric
  is expected; PBR detail must read.
- **Z-fighting / holes** — no flickering coplanar faces, no see-through gaps in the shell.
- **Nondeterministic frames** — two runs at the same `?seed &?cam &?freeze=1` must render identically.
- **Silent fps cliff** — never drop below the fps floor at the hero framing without it being logged
  to `stats`.

## Measurable floors (gates — machine-checked by the harness)
Each is a named pass/fail with a measurement, checked by `tools/compare.ts` / `battery.ts`:
- **no-crushed-blacks:** in the hero framing, < N% of pixels at luminance ≈ 0; the darkest same-material
  region's mean luminance is above a floor (shadows retain detail).
- **material-variance / ao:** stddev of luminance within a same-material region (wood wall, floor)
  > threshold — proves texture + AO, not a flat fill.
- **fire-emissive:** at the hero framing a contiguous bright, warm-hue region exists at the fireplace
  location (high value, hue in the orange/amber band).
- **cat-present:** at the hero/wide framing, a detectable cat-shaped region exists at the cat's
  location (region match against `04`, or a tagged-pixel/segmentation check).
- **window-keylight:** a measurable luminance gradient across the room from the window side —
  brighter, cooler near the window, warmer toward the fire (proves key/fill contrast, not uniform).
- **tonemap-range:** < N% of pixels clipped at pure white; histogram occupies the mid-range (ACES
  curve applied, not blown out).
- **fps-floor:** engine `stats.fps` at the hero framing ≥ **60** target; **≥ 30** is a hard fail.
- **determinism:** re-shoot at fixed `?seed &?cam &?freeze=1` diffs to ~0 against the previous
  identical-param shot.

## Canonical framings (each maps to a reference target)
- **hero** — fireplace + cat in frame: the warm-key mood shot (refs `01`, `04`).
- **desk** — the coding-station / "first taste" nook, screen lit (ref `06`).
- **window** — the window wall, cool daylight raking across wood (ref `05`).
- **wide** — the whole room in one frame: proportions, both light sources, set-dressing balance.
- **detail** — a material/prop close-up: plank grain, workbench tools (refs `03`, `02`).

## Phases (loop grinds these in order; each closes DELTA items + passes its gates)
1. **First-light greybox** — room shell + collision; WASD/mouselook; `window.__cabin` hook; `shoot`
   works; deterministic `?cam`/`?freeze`.
2. **Form & materials** — real proportions + props blocked in; PBR wood/stone/fabric/metal materials
   (material-variance/ao gate starts passing).
3. **Lighting** — warm fire key + cool window fill; shadows + AO; no-crushed-blacks + window-keylight
   gates pass.
4. **Atmosphere & post** — ACES tonemap, exposure, subtle bloom/vignette, light haze/dust motes near
   the window; tonemap-range gate passes.
5. **The cat + fire life** — burning fire with flicker + ember glow (fire-emissive gate); the cat
   modeled + placed with idle animation (cat-present gate).
6. **Props & set-dressing** — workbench + tools, desk + screen, shelves, rug, cozy clutter; the
   coding "first taste" mini-app hook + signal capture wired.
7. **Grade & polish** — color-grade toward the references; final per-framing self-score pass; lock
   fps at/above floor.

## Definition of done
Every canonical framing self-scores **≥ 8/10** vs its reference in `DELTA.md`, with the **mean ≥ 8.5**;
all named gates green in `battery`; runs at **≥ 60 fps** at the hero framing (**≥ 30 fps** hard floor);
all banned outcomes gated. Fireplace and cat both present; the code "first taste" launches and emits
behavioral signals.

## How this is built (the loop)
Uses the gt100k repo's loop conventions (`.loop/` state, green-increment commits, per-turn log) with
the shoot/compare/reference/DELTA layer as the per-turn "serve + shoot recipe."
