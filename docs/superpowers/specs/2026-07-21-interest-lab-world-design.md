# Interest Lab — Explorable World Redesign (design)

**Date:** 2026-07-21 · **Owner:** David · **Supersedes:** the child-facing UI of `specs/003-interest-lab`
(the pure-domain engine, contracts, and `interest-lab-view` model are kept; the 3D "quest world" UI is
replaced). Grounded in seven research memos under `docs/research/` (world generators, runtime engine,
world precedents, hybrid vs full-3D, model capability, asset pipeline) + `gt100k-factory/docs/RESEARCH-visual-ux-qa-harness.md`.

## 1. Why (what v1 got wrong)
v1 shipped a big `aria-hidden` 3D "quest world" that was **decorative** — the balls weren't clickable,
the real picker was a disconnected DOM ledger below the fold, quests were opaque stubs, and the core
signal ("what a child voluntarily returns to over days") had nowhere to live. It passed the gate because
the gate can't judge *legibility*. This redesign fixes the **mechanic**, the **legibility**, and the **gate**.

## 2. The product in one line
A cozy, stylized **explorable world** where a child wanders a small map of **discovery zones** (interest
domains), steps into a zone to **do a real hands-on activity**, and the system quietly learns their
emerging passion from **what they choose to return to** — shown to a guide as a revisable hypothesis,
never a label.

## 3. Architecture — hybrid: 2D-primary map + bounded 3D rooms
Decided by the hybrid + runtime research (`interest-lab-hybrid-vs-full-3d.md`, `...runtime engine`):

- **The Curiosity Map (2D, PRIMARY surface).** A stylized top-down overworld — a little island of
  buildings, each building = a **domain**. This is today's `board-2d`/quest-ledger **promoted from
  fallback to the home surface**, so it does triple duty: **navigation + accessibility floor (real DOM,
  keyboard + screen-reader) + the return signal** (a building-revisit is directly observable).
- **The Rooms (bounded 3D, where the doing happens).** Entering a building opens a **small 3D room** in
  a **single persistent `<Canvas>` whose contents swap** on enter/exit (never mount/unmount per room).
  Fixed camera, `<50` draw calls, `frameloop="demand"` → Chromebook-safe *and* pretty. Inside is a
  **real hands-on micro-activity that IS the game** (intrinsic integration — the direct fix for v1's
  "quiz behind a pretty door").
- **Tiering (unchanged principle):** `room-3d` → `room-3d-lite` → **DOM activity** (the accessibility
  floor); the map is always DOM. `detectDeviceCaps()` + `AdaptiveDpr`/`PerformanceMonitor` gate down.

## 4. Parallel-build decomposition (this is what lets 3 loops run at once)
The unit of parallelism is a **Zone**. Everything shared is built once as the **core**; each zone is an
isolated module implementing one interface, so zone loops never touch each other's files.

**Shared core (lane 0 — must land first):**
- `passion/packages/interest-lab` (domain): the **signal engine** — the `domain × work-mode` grid,
  voluntary-return tracking (7/30-day model + the "a week later…" synthetic time-lapse), and the
  **revisable hypothesis** (row = topic spike, column = work-mode spike). (Extends the existing engine.)
- `passion/packages/interest-lab-view`: the **Curiosity Map** renderer, the **persistent Canvas host**,
  and the **`ZonePlugin` interface** (below) + the `window.__qa` contract.
- `passion/apps/interest-lab`: the shell that composes map + canvas host + registered zones.

**Zone modules (lanes 1–3 — built in parallel, one loop each):**
- `passion/packages/interest-zone-music`, `interest-zone-code`, `interest-zone-art` — each exports a
  `ZonePlugin` and **owns only its own dir**. The one shared-root touch is registering the plugin in the
  app's zone registry (the single expected merge point, like the old `tsconfig references`).

```ts
interface ZonePlugin {
  id: string;                    // "music" | "code" | "art"
  domain: Domain;                // maps to a grid row
  mapBuilding: MapBuildingView;  // 2D: sprite/label/position on the Curiosity Map
  Room3D: React.FC<RoomProps>;   // bounded 3D scene (mounted into the shared Canvas)
  ActivityDOM: React.FC<RoomProps>; // accessible DOM-mirror of the same activity (a11y floor)
  probes: Probe[];               // each activity action emits {domain, workMode} events → the grid
}
```

Because every activity emits `{domain, workMode}` events, **return clusters resolve topic vs work-mode
automatically** (a child who *builds* in music *and* code *and* art lights up the *build* column; one who
stays in music across build/perform/debug lights up the *music* row).

## 5. v1 scope — 3 zones, each at MAXIMUM depth
Three domains chosen so the *same* work-modes recur across them (required for the row/column signal):

| Zone | Domain (wire key) | Signature activity (the game) | Work-modes it exposes |
|---|---|---|---|
| **Music Studio** | `sound_music` | build a short beat on a step-sequencer / pad | build · perform · debug |
| **Code Lab** | `symbols_math` | make a little bot move through a puzzle (block-based) | build · debug · investigate |
| **Art Studio** | `visual_design` | compose a scene / constrained paint | build · compose · explain |

Each is built to the quality bar as if it were the *only* zone. **Discovery needs ≥2–3 comparable
options**, which is why three (not one) — but depth is non-negotiable per zone.

> **Canonical bindings (frozen engine — core-spec §2 + reconciliation §1).** Wire keys are `sound_music`
> (Music) / `symbols_math` (Code) / `visual_design` (Art). Per-zone work-modes (core-spec §2 + §8/§9
> goldens): Music `build·perform·debug`, Code `build·debug·investigate`, Art `build·compose·explain` —
> **`build` is the one column shared by all three** zones (the lever that lets the grid separate a topic
> row-spike from a work-mode column-spike). The concrete cozy theme is **Emberwood** — a golden-hour hamlet
> of log cabins (the Sounding Cabin / Tinker Workshop / Atelier Cabin around a central Lodge + hearth) — per
> [`2026-07-21-world-art-direction-cozy-cabin.md`](./2026-07-21-world-art-direction-cozy-cabin.md); all
> child-facing labels, signage, and palette live there.

## 6. The signal → hypothesis (the actual point)
- Every activity action → a `{domain, workMode, probeId}` event.
- The map tracks **voluntary revisit after novelty fades** (unprompted return; prompted/rewarded returns
  are tagged and excluded — reuses the existing novelty gate).
- The guide view shows a **revisable hypothesis** with supporting *and* disconfirming evidence + visible
  coverage gaps; never a score/label. Child can dispute/annotate/withdraw.
- **Synthetic demo:** an honestly-labeled **"a week later…"** time-lapse where the map visibly quiets,
  then asks what the child drifts back to — makes "return over days" legible in a single session.

## 7. Accessibility (now by construction)
The 2D map is real DOM (keyboard + screen-reader) and is the **primary** surface, not a fallback — so
parity isn't a bolt-on. Every zone ships `ActivityDOM`, a first-class accessible version of its activity
that preserves the *act of choosing what to revisit* (not a lesser to-do list). `plainViewEquals` parity
test stays.

## 8. Beauty (asset + art pipeline)
Per `stylizedWorldAssetPipeline.md`: **CC0 backbone** (Kenney + Quaternius + KayKit — commercial, no
attribution; avoid Synty's AI/UGC-banning EULA) → `gltf-transform` to **Meshopt + KTX2 GLB** →
`gltfjsx --transform` → instance repeats to `<50` draw calls. **One locked art-direction pack** (palette
+ one HDRI, self-hosted + no external fetch + one shading model + **fog** + frozen shadows + subtle
Bloom/Vignette/ACES) is authored up front (reference images) and fed to every zone loop for cohesion.
Mood: **cozy, warm, inviting** (A Short Hike / Alba / Animal Crossing), not the moody references.

## 9. Won't-ship-broken (QA gate upgrades — build alongside the core)
Per `RESEARCH-visual-ux-qa-harness.md`, before/while building: apps expose `window.__qa`; the gate
**hard-fails a dead *primary* action**, flags an `aria-hidden` primary canvas, tests *inside* the canvas
(raycast round-trip + pointer-sweep pixel-diff), and adds a VLM rubric grader (clarity / primary-action-
obvious / interaction-sense). This makes the exact v1 failure un-shippable.

## 10. Out of scope for v1
Live LLM; live gaussian-splat worlds (optional far-backdrop only, later); the other 3 domains; real child
data; the full 7/30-day live cohort (synthetic time-lapse stands in); social/co-presence.

## 11. Build order
1. **Lane 0 (core):** signal engine + Curiosity Map + Canvas host + `ZonePlugin` + `window.__qa` + a
   seeded end-to-end smoke (map → stub room → event → grid → hypothesis). Land green first.
2. **Lanes 1–3 (parallel loops):** Music, Code, Art zones against the frozen `ZonePlugin` interface +
   the art-direction pack.
3. **Integrate:** register all three, run the upgraded QA gate, operator review on `localhost`.
