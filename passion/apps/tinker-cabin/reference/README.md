# Reference framings — aesthetic targets (Tinker Workshop cabin)

Local, private aesthetic targets for the polish loop (like LAAS judging a render against a
Witcher frame). No single photo is the whole cabin; **each image asserts one specific target**
the loop grinds toward. `tools/compare.ts` side-by-sides a matching canonical framing against
these; `DELTA.md` tracks the gap.

**This folder is gitignored** (`reference/*`, except this README) — the repo is PUBLIC, so the
binaries are internal comparison targets only, never committed or published. Every file below is
**CC0** (public-domain dedication) or otherwise free-to-use, sourced from StockSnap.io (CC0) and
Poly Haven (CC0). Source URL + license are recorded per file.

## Files → target asserted

| File | Asserts (palette / lighting / material / composition) |
|---|---|
| `01_cabin_fireplace_dusk.jpg` | **Fire-emissive + warm palette anchor (HERO).** Live flames + glowing embers over dark logs in a hearth. Defines the warm key light: saturated orange→amber firelight, hot near-white flame cores, deep-but-not-crushed dark surround. Target for the fireplace glow, ember pool, and the overall dusk warmth of the room. |
| `05_window_daylight_logcabin.jpg` | **Wood interior + cool window fill (HERO).** Pine log-plank walls and sloped ceiling, a bright window throwing cool daylight into the warm wood room. Defines the wood wall tone/grain at room scale and the cool key/fill contrast against the fire's warm key. Target for wall material, room proportions, and window raking light. |
| `04_cat_curled_sleeping.jpg` | **The mandatory cat — pose + fur (HERO).** Tabby-and-white cat curled/asleep on a woven throw, paw over face. Target for cat silhouette, resting pose, and fur shading (soft short-fur specular, ear/whisker translucency) so the cat reads as a real animal, not a prop. |
| `02_workshop_workbench_tools.jpg` | **The "tinker" character — workbench + tools.** Rustic work surface with scattered hand tools. Target for the tinkering set-dressing: tool clutter, worn wood work surface, believable prop density around the coding/build station. |
| `03_wood_grain_planks_detail.jpg` | **Warm-wood PBR material detail (close-up).** Poly Haven CC0 brown-plank texture render, 2K. Target for plank/log albedo, grain frequency, roughness variation and micro-AO in the seams — the ground truth for material-variance/AO gates on wood surfaces. |
| `06_desk_nook_coding.jpg` | **Coding-station composition.** Desk with a lit screen/monitor, framed by daylight windows and a warm wood accent wall. Target for the desk-framing layout: screen as a secondary light source, keyboard/desk props, the "first taste of code" nook. |

## Priority

- **PRIMARY targets:** `01` (fire/warm key), `05` (wood interior + cool window fill), `04` (the cat).
  These three define the hero mood, the mandatory elements, and the warm-key/cool-fill lighting
  contrast that the whole look hangs on.
- **Refinement targets:** `02` (workbench set-dressing), `03` (wood PBR detail), `06` (coding-station
  framing) — these map to later DELTA phases (props/set-dressing, materials, the desk framing).

## Sources + licenses

| File | Source | License |
|---|---|---|
| `01_cabin_fireplace_dusk.jpg` | https://stocksnap.io/photo/fire-fireplace-LRI3JRN9GW (Jamie Hamel-Smith) | CC0 1.0 |
| `02_workshop_workbench_tools.jpg` | https://stocksnap.io/photo/workbench-machinery-RKR8CFTODQ (Lisa Fotios) | CC0 1.0 |
| `03_wood_grain_planks_detail.jpg` | https://polyhaven.com/a/brown_planks_05 (Poly Haven, diffuse 2K) | CC0 1.0 |
| `04_cat_curled_sleeping.jpg` | https://stocksnap.io/photo/sleeping-cat-CYUELCXZ74 | CC0 1.0 |
| `05_window_daylight_logcabin.jpg` | https://stocksnap.io/photo/wood-logcabin-771265060F (Jay Mantri) | CC0 1.0 |
| `06_desk_nook_coding.jpg` | https://stocksnap.io/photo/office-work-4ALWT6KXM0 (Gabriel Beaudry) | CC0 1.0 |

_StockSnap.io images are released under CC0 (see stocksnap.io/license). Poly Haven assets are CC0
(see polyhaven.com/license)._
