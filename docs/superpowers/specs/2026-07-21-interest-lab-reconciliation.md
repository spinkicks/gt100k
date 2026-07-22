# Interest Lab — Reconciliation & Canonical Contract (v1)

Locks the cross-spec seams after the deep (v2) zone/world designs so the parallel build lanes stay
consistent. **Source of truth:** `@gt100k/interest-lab` (`src/probe.ts`) + `2026-07-21-interest-lab-core-spec.md`.
If a zone spec disagrees with this file, this file wins.

## 1. Canonical DOMAIN keys (wire) + child-facing labels
`Domain` is an open `string` (`probe.ts`). v1 zones register:

| wire key | child-facing label | zone |
|---|---|---|
| `sound_music` | Music Studio | Music |
| `computation` | Code Lab | Code |
| `visual_design` | Art Studio | Art |

Reserved for future zones (established catalog keys — do not reuse for these three): `symbols_math` (Math),
`making` (Build/Engineering), `living_systems` (Life Science), `word_craft` (Writing). **Action:** update the
core registry stub (its `symbols_math` placeholder → the three keys above). Child-facing text uses the labels;
the wire/grid uses the keys.

## 2. Canonical WORK_MODES (from `probe.ts` — all valid, none invented)
`build · investigate · compose · explain · perform · debug · collaborate · care · persuade`.
v1 uses six. **Shared columns (all three zones): `build · debug · compose`.** Signature column per zone:
Music = `perform`, Code = `investigate`, Art = `explain`. This is exactly what lets the grid separate a
**row** spike (a topic child) from a **column** spike (a work-mode child). ✓ No reconciliation needed here.

## 3. Event contract
Every activity action — in **both** the world room and the content app — emits the frozen **`ActivityEvent`**
(core spec), carrying `{domain, workMode, probeId, dayOffset, intervention?, assistive?}`. **Not** the raw
`EngagementEvent` (that was a v1 error; Code v2 already corrected it — Music/Art must match).

## 4. Imports / the shared seam
Zones import `ZonePlugin` + `<CanvasHost>` + `<CuriosityMap>` from **`@gt100k/interest-zone-kit`** (never from
each other or the app). The only shared-root edit is the app's `ZONES` registry — **one line per zone**.
Content apps connect via `<ContentHost>` + **`@gt100k/interest-signal-client`** (postMessage → `ActivityEvent`),
in a **PII-free embedded mode** (the world is the identity layer).

## 5. Content-app strategy (v1)
**Build fresh per domain** over a headless core (guarantees a11y + the signal contract + world/DOM parity +
the Chromebook budget). Existing apps (**Blazing Audio**, **Chrome Music Lab**) are **north-star / reusable
parts, NOT embedded** — they're auth-walled / PII-bound / closed. The iframe + signal-SDK contract (§4) stays
in place for **future** integration of *open, embeddable* intern apps: coarse return-signal is free even for
un-instrumented apps; the rich work-mode signal needs the ~10-line SDK added inside the app.

## 6. World art direction
Retire v1's **midnight-cosmos** tokens (`SCENE3D.bg #181026` is now a *banned outcome*). Repalette to a **warm
golden-hour cozy** pack (warm raking key + a cool skylight fill so shadows tint blue-violet, never dead gray).
Keep the `Scene3DView` shape + `HUE_RAMP` (no contract break) — swap values only.

## 7. Build lanes (parallel-safe)
- **Lane 0 — core (first):** `@gt100k/interest-zone-kit` + signal engine + Curiosity Map + `<CanvasHost>` +
  `<ContentHost>` + `window.__qa` + a green end-to-end smoke. **Freezes** the interface + the keys above.
- **Lane W — world visuals** (can run alongside lane 0): the golden-hour repalette + the map/world look.
- **Lanes 1–3 — zones (parallel, after the freeze):** Music / Code / Art. Each = the cozy 3D **doorway room**
  + its Brilliant-style **content app**, built against the frozen contract, **gated by the upgraded QA**.
