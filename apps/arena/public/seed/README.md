# Arena seed assets

The filenames in this directory match the `ASSET_KEYS` registry. Tier-D nodes, regions, Base Camp props, and the five HUD/Ledger icons are committed as small local SVGs. They contain no raster payloads or external requests.

World geometry uses the registry's fixed source order: an optional committed asset first, then the seeded procedural mesh and material fallback. Optional Draco-compressed models in `public/models/` and a local texture atlas in `public/atlas/` are intentionally absent until real assets are committed; missing optional art must always fall through to the procedural renderer with no external fetch.

Optional self-hosted font subsets may later live in `public/fonts/`. Until then, the app uses its system-rounded font stack. Models, atlases, and fonts are non-breaking local upgrades and must never add a CDN dependency.
