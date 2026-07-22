# Loop progress — WORLD lane (Emberwood cozy-cabin world)

The shared CORE is COMPLETE (frozen `ZonePlugin`, `<CuriosityMap>`, `<CanvasHost>`, `<ZoneRoom>`,
stub zones, signal engine, accessible DOM map, `window.__qa`). **Do NOT rebuild the core or change
the frozen contracts** — theme + build ON TOP (value/reference layer only).

## Serve + shoot recipe (reuse every turn)
- App: `passion/apps/interest-lab` (Next.js). Serve: `PORT=<p> pnpm dev` from that dir. **Kill stale
  `next-server` first** (`pkill -9 -f next`; a lingering `next start` will hog the port and serve a
  STALE build — this bit me: CSS edits didn't show until I killed the old prod server). Prefer `dev`
  for CSS iteration (HMR); `rm -rf .next` is sandbox-denied, so just use a fresh port.
- Screenshot: `/tmp/pw-venv` (python playwright, browsers at `~/.cache/ms-playwright`). Scripts:
  `/tmp/shoot2.py <out> [--full]`, `/tmp/sample.py` (pixel checks), `/tmp/debug.py` (computed CSS).
  Set `PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright`. Waits for `window.__qa.ready` + double-rAF.

## Architecture reality (important)
The child surface is a **DOM shell** (`globals.css`, ~2.4k lines, shared with the guide console) +
a **3D `<Canvas>` below the fold** (`app/child/world3d/*`, uses `SCENE3D`) + a **raw DOM Curiosity
Map** (from `@gt100k/interest-zone-kit`, currently UNSTYLED). `globals.css` is themed midnight via
`--night` etc. — I warmed it **scoped to `[data-active-surface="child"]`** (guide stays dark).

## Done this turn — P-A0 (warm art pack + warm child shell)
- **`SCENE3D` value swap** → warm golden-hour (bible §3.2); `HUE_RAMP` kept verbatim; added additive
  **`CABIN`** (material tints §3.1) + **`MAP_COLOR_SCRIPT`** (DOM map §6) exports. Golden tests pin
  all three + the no-dead-shadow / map↔cabin-hue invariants. Updated registries/public-api/readme.
- **Warm child DOM shell** (scoped CSS in `globals.css`): remapped `--night`/ink/surface tokens to
  warm cream+wood, `:has()` warm body+html base, warmed the dark `.hud-status`/`.status-pill`/ledger
  pills. Fixed heading contrast (`color` is set on <body> outside scope → re-declared on the wrapper).
- **Killed the 3D black void:** the "misty sea" floor + contact shadow + AO were painted with the
  BANNED midnight `PALETTE.nightSunk/#120b1e`. Swapped to `CABIN.woodWalnut` floor (warm) +
  `CABIN.duskDeep` blue-violet contact-shadow/AO; softened vignette 0.55→0.4. Lower-canvas sample
  went `#030104` (dead black) → `#56251f` (warm). Rim light → `CABIN.duskSkylight`.
- Gate GREEN: typecheck ✅ · 511 tests ✅ · next build ✅. Zero console/page errors in the browser.
- Reference wired: `.loop/reference/clearing.png` = real A Short Hike still (CC BY-SA, see SOURCES.md).

## Self-score (§12, this shot vs the clearing reference) — anchored 10/7/4/2
- Cabin warmth & coziness: **5** (warm + inviting, but a dashboard, not a room) · +2: build the clearing/cabin.
- Firelight & light transport / no dead shadow: **6** (bloomed emissives, dusk shadows, no black void) · +2: real hearth glow.
- Palette / color-script discipline: **7** (everything on the warm scale; warm/cool split holds).
- Cabin legibility: **3** (raw map cards) · +2: style cabins w/ silhouette+sign.
- Dressing density / lived-in: **3** · +2: props + ambient life on the map.
- Ambient motion & life: **3** (only bloom/mote) · +2: smoke + sway + fireflies.
- Map cohesion & wayfinding: **3** (unstyled list) · +2: clearing plate + Lodge "you are here".
- Accessibility parity: **7** (DOM map is real focusable buttons; contrast now warm-legible).
- Chromebook perf: **7** (frozen shadows, demand loop, bounded) — real-device fps check is manual.
- **Overall this surface ≈ 4–5.** Solidly out of the banned-midnight zone (was ~2), not yet at the ≥7 bar.

## Closest banned outcome + cheapest move away
Was **"midnight/night-default"** (§11) — now DEFEATED (warm top-to-bottom, no black void/shadow).
Now closest to **"illegibility / cold-cabin"**: the raw unstyled Curiosity Map reads as a debug list.
Cheapest move away next turn: **P-A1 — style the DOM Curiosity Map into a golden-hour clearing** with
cabin buttons (hue+silhouette+sign+dressing), a Lodge/hearth "you are here", soft blue-violet shadows,
and ≥3 ambient motions (smoke/sway/fireflies), using `MAP_COLOR_SCRIPT`. That is the highest-leverage
surface and the map is the primary (accessible) surface. Then P-A2: one cabin interior to full recipe.

## NEXT
- **P-A1 — the clearing to bar.** Re-theme the DOM Curiosity Map (in `interest-zone-kit` or app-scoped
  CSS — check the lane) into "Golden Hour in the Clearing" (§6): sky→treeline→ground→shadows→cabins,
  label+verb buttons, Lodge+hearth, return-glow, time-lapse, smoke/fireflies/cat. Gate: two-frame frame 1.
- Also warm the "Focus a quest below" hint pill + low-contrast eyebrow (DELTA #6/#7 — quick wins).
- Do NOT `.loop-done` until the two-frame acceptance (§14) passes at ≥7. Not there yet.
