# Blender MCP — bespoke assets for the cabin

For CC0 HDRIs/textures you don't need Blender — just run `pnpm fetch-assets` (Poly Haven, direct
download). Use **Blender MCP** when you want richer/bespoke assets: a glTF **cat**, furniture, or
**AI-generated** props, assembled/curated in Blender and exported as GLB.

> **This is a local, human-in-the-loop step.** Blender MCP drives a *running Blender GUI* on your
> machine via a socket — it cannot run from a headless/background agent. Only the exported
> GLB/HDR/texture files ship (gitignored; see `cabin/public/assets/CREDITS.md`).

## Setup (macOS)

```bash
brew install uv          # provides uvx (don't `pip install uv`)
which uvx                # note the path, e.g. /opt/homebrew/bin/uvx
```

1. Download `addon.py` from https://github.com/ahujasid/blender-mcp
2. Blender → **Edit ▸ Preferences ▸ Add-ons ▸ Install…** → pick `addon.py` → enable **"Interface: Blender MCP"** (Blender 3.0+).
3. In the 3D viewport press **N** → **BlenderMCP** tab → tick **Poly Haven** (enter Sketchfab/Hyper3D keys if using them) → **Connect to Claude** (starts the socket on `localhost:9876`).
4. Register the server with Claude Code:

```bash
claude mcp add blender uvx blender-mcp
```

or in `.mcp.json`:

```json
{
  "mcpServers": {
    "blender": { "command": "uvx", "args": ["blender-mcp"], "env": { "DISABLE_TELEMETRY": "true" } }
  }
}
```

(If you hit `spawn uvx ENOENT`, use the absolute uvx path and pin Python: `"args": ["--python","3.11","blender-mcp"]`.)

## Key tools

- `get_scene_info`, `get_object_info`, `get_viewport_screenshot` — inspect + eyeball.
- `execute_blender_code` — runs arbitrary `bpy` Python (exports, transforms). **Trust boundary: it can touch the filesystem — review generated code.**
- Poly Haven: `search_polyhaven_assets`, `download_polyhaven_asset`, `set_texture` (CC0).
- Sketchfab: `search_sketchfab_models`, `download_sketchfab_model` (needs account + API key; **license varies per model — verify**).
- Hyper3D Rodin / Hunyuan3D: text/image → 3D generation (free tier caps; check terms).

## Pipeline into this app

1. In Blender (via Claude): fetch/assemble the asset (e.g. "search Sketchfab for a downloadable CC0 low-poly cat, import at ~0.4 m").
2. Export **GLB without Draco**: `bpy.ops.export_scene.gltf(filepath=".../cat.glb", export_format='GLB')`.
3. Optimize: `npx @gltf-transform/cli optimize cat.glb cat.opt.glb` (dedup + resize + Draco + webp). Target < ~2–3 MB. Validate with the Khronos glTF Validator.
4. Drop into `cabin/public/assets/models/` (gitignored) and add it to `scripts/fetch-assets.mjs` or a `CREDITS.md` note.
5. Load in R3F with graceful fallback (mirror `cabin/src/scene/EnvLight.tsx`): `useGLTF("/assets/models/cat.opt.glb")` inside a `<Suspense>` + error boundary that renders the procedural `Cat` when the file is absent. Self-host the Draco decoder in `cabin/public/draco/`.

## Caveats

- Needs Blender + a desktop GUI; won't work headless/CI.
- Socket `localhost:9876` must be reachable (firewall/AV can block it); only one MCP client at a time; first command sometimes needs a retry.
- Keep binaries out of git (they're gitignored); the app must always fall back to procedural so offline/CI stays green + deterministic.
