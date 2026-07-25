# Asset credits

Binaries in this folder are **gitignored** — fetch them with:

```
node scripts/fetch-assets.mjs
```

The 3D cabin falls back to procedural materials/lighting when they're absent, so a fresh clone / CI
still builds and runs offline.

Most fetched assets below are **CC0 1.0 (public domain)**. The cat model is **CC-BY 3.0** and
**requires attribution** — see the note under the table. The app falls back to procedural when any
asset is absent.

| File | Source | Asset | License |
|---|---|---|---|
| `env/dusk.hdr` | [Poly Haven](https://polyhaven.com/a/kloppenheim_06) | `kloppenheim_06` (1k HDRI) | CC0 1.0 |
| `env/vista.jpg` | [Poly Haven](https://polyhaven.com/a/champagne_castle_1) | `champagne_castle_1` (tonemapped panorama, window vista) | CC0 1.0 |
| `textures/wood_diff.jpg`, `wood_nor.jpg`, `wood_rough.jpg` | [Poly Haven](https://polyhaven.com/a/brown_planks_05) | `brown_planks_05` (1k PBR) | CC0 1.0 |
| `models/pine.glb` | Quaternius via [Poly Pizza](https://poly.pizza/m/igSu0cPoBz) | Pine (used for the exterior forest) | CC0 |
| `models/cat.glb` | alwayshasbean via [Poly Pizza](https://poly.pizza/m/4dXgbKLHD9) | "Dingus the cat" (hearth cat; procedural tabby is the fallback) | **CC-BY 3.0** |

**Attribution (required for the cat):** "Dingus the cat" by **alwayshasbean**, licensed under
[CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/), via
[Poly Pizza](https://poly.pizza/m/4dXgbKLHD9).

Poly Haven license: https://polyhaven.com/license (everything there is CC0).

Ported from `passion/apps/tinker-cabin/cabin/public/assets/CREDITS.md`.
