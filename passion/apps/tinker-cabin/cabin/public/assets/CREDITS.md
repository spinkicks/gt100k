# Asset credits

Binaries in this folder are **gitignored** — fetch them with `pnpm fetch-assets`
(`scripts/fetch-assets.mjs`). The app falls back to procedural materials/lighting when they're
absent, so a fresh clone / CI still builds and runs offline.

All fetched assets below are **CC0 1.0 (public domain)** — no attribution required, commercial use OK.

| File | Source | Asset | License |
|---|---|---|---|
| `env/dusk.hdr` | [Poly Haven](https://polyhaven.com/a/kloppenheim_06) | `kloppenheim_06` (1k HDRI) | CC0 1.0 |
| `textures/wood_diff.jpg`, `wood_nor.jpg`, `wood_rough.jpg` | [Poly Haven](https://polyhaven.com/a/brown_planks_05) | `brown_planks_05` (1k PBR) | CC0 1.0 |

Poly Haven license: https://polyhaven.com/license (everything is CC0).

## Adding bespoke / non-CC0 assets (Blender MCP)

For a glTF cat, furniture, or AI-generated props, use the Blender MCP workflow in
[`docs/BLENDER_MCP.md`](../../../docs/BLENDER_MCP.md). If you add a Sketchfab / AI-generated asset,
record its source + license here and honor any CC-BY attribution.
