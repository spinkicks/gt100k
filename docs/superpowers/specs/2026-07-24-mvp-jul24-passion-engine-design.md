# MVP Jul 24 — Passion-Engine point-and-click game (design)

**Date:** 2026-07-24 · **Owner:** Felipe · **App:** `passion/apps/mvp-jul24`
**Status:** approved design, pre-implementation.

## 1. What this is

A point-and-click discovery game and the newest face of the **Discover** pillar (interest-lab,
`docs/SCOPE.md` / `docs/PASSION-LAB-PLAN.md`). A student opens a **2D painterly map** of topic
**cabins** (music / math / code / …). They click a cabin, land in its **interior**, click **gadgets**
on the walls; each gadget fills the screen as a **mini-puzzle** they can actually play. The system
**tracks active time per gadget** — the raw signal for "what is this kid drawn to?" — and shows a
simple readout.

This MVP is a **demo** (driven on Felipe's machine, synthetic/local data only — no child PII, no
backend). It reuses the cozy art direction and the `tinker-cabin` codebase as a parts bin.

## 2. Today's scope (Definition of Done)

Priority is **puzzle *feel* first, then map/cabin visuals.**

1. **Map** — painterly map with one **clickable Math/Puzzles cabin** (others visible, inert).
2. **Cabin view** — cozy interior with clickable **gadget hotspots**. Two swappable backends,
   **A/B toggle** (`?cabin=3d|static`): `Cabin3D` (R3F, lifted from tinker-cabin, fixed camera) and
   `CabinStatic` (AI-generated static image + hotspot overlay). Felipe picks the winner.
3. **Gadget framework** — a pluggable registry; adding a puzzle is one entry.
4. **Two polished puzzles** — **Nonogram** and **Logic-grid deduction** (names×categories + clues,
   per the reference image). Both fully playable with win detection.
5. **Coming-soon gadgets** — mirror/laser, chess, minesweeper, pipes, LITS present as inert
   "coming soon" hotspots (proves the framework, sets the roadmap).
6. **Interest tracking** — active seconds per gadget (pause on idle / tab-hidden / window-blur),
   `localStorage` persistence, + a simple **readout screen** (bars per gadget/topic).
7. **Art + LAAS wired** — a gateway image-gen script (map, static cabin, props) and the
   shoot/compare LAAS delta loop lifted from tinker-cabin, so visuals iterate.

**Explicitly NOT today:** real backend/DB, real user accounts, more than one active cabin, the
coming-soon puzzles' logic, the fancy in-scene 3D zoom (see §5 approach ③), Chromebook perf tuning.

## 3. Architecture — approach ① "layered scene + gadget overlay" (approved)

The background (3D cabin **or** static image) is **purely visual**. Gadgets are a declarative
registry of **hotspots**. Clicking a hotspot opens the puzzle as a **full-screen React overlay** with
a `motion` zoom-in transition. Puzzles are **pure React** — decoupled from three.js, easy to build
and test. The same overlay rides on either cabin backend, so the 3D-vs-static A/B is free.

```
MapScreen ──click cabin──▶ CabinView(backend: 3d|static)
                              │  renders gadget hotspots
                              └─click hotspot──▶ GadgetOverlay(zoom-in)
                                                   └─mounts PuzzleComponent
InterestTracker: starts/stops a per-gadget active-time timer as the focused gadget changes.
```

Rejected: ② true in-scene 3D zoom (couples every puzzle to three.js; a nonogram-in-world is awkward;
breaks the static path). ③ hybrid dolly-zoom → overlay is the **tomorrow** polish path.

## 4. Modules (deep, isolated units)

Standalone **Vite + React + TypeScript** app (matches tinker-cabin; simpler than Next for a game).
`rapier` physics dropped — no walking. `motion` for transitions. Local state via a small store
(Zustand or context). No workspace-package coupling — we **copy** lifted code, per "fresh app, lift
pieces."

- **`src/game/`** — top-level screen router (map ↔ cabin ↔ readout) + the game store (current screen,
  current cabin, focused gadget). One clear place for "where am I / what's active."
- **`src/map/`** — `MapScreen`: painterly map image + clickable cabin nodes (absolute-positioned
  hotspots). Data-driven from a `cabins` list; only Math is `active`.
- **`src/cabin/`** — `CabinView` + the backend interface `CabinBackend`. Two implementations:
  - `Cabin3D` — R3F fixed-camera scene lifted/trimmed from tinker-cabin (`scene/Cabin`, lights, env).
  - `CabinStatic` — `<img>` of an AI cozy cabin + an SVG/abs-positioned hotspot layer.
  Both consume the **same** `GadgetHotspot[]` (id + screen/anchor position + label).
- **`src/gadgets/`** — the **Gadget contract + registry**:
  `type Gadget = { id; topic; label; hotspot; status: 'active'|'coming-soon'; Puzzle?: React.FC<PuzzleProps> }`.
  A single `GADGETS` array is the source of truth for both cabin backends and the overlay.
- **`src/puzzles/`** — pure-React, self-contained, each with its own win-check + a `PuzzleProps`
  contract (`{ onSolved, onExit, seed }`):
  - `Nonogram/` — generator (from a target grid), row/col clue derivation, fill/cross interaction,
    solved-detection.
  - `LogicGrid/` — entities × categories model, a **clue engine** (constraint types: is/isn't,
    relational), a grid UI with mark/eliminate, and constraint-satisfaction win-check.
  - `ComingSoon` — placeholder overlay for inert gadgets.
- **`src/interest/`** — `InterestTracker` (active-time state machine) + `interestStore` +
  `ReadoutScreen`. Active-time rules: accumulate while a gadget is focused AND the page is visible AND
  the window is focused AND input seen within an idle window (default 30s). Persist per-gadget totals
  + lightweight session events to `localStorage`. Readout = horizontal bars per gadget/topic.
  (Concepts lifted from `tinker-cabin/cabin/src/interest/signals.ts` & `gadgetSignals.ts`.)
- **`scripts/gen-art.mjs`** — TrueFoundry gateway image-gen. Confirmed working:
  `POST https://tfy.promptlens.trilogy.com/api/llm/images/generations`, header `x-tfy-api-key`
  (read from env — never committed), models `gpt-image-1` / `gemini-3-pro-image-preview`. Generates
  the map, the static cabin variant, and props into `public/art/`.
- **`src/laas/` + `tools/`** — shoot/compare delta loop lifted from tinker-cabin `tools/` for
  iterating visuals against a named hero reference.

## 5. Data flow & state

- **Game store:** `{ screen: 'map'|'cabin'|'readout', cabinId, focusedGadgetId, cabinBackend }`.
- **Interest store:** `{ byGadget: Record<id, {activeMs, opens, solves}>, sessionStartedAt }`,
  persisted to `localStorage` under a namespaced key. Interest = time, not correctness (a kid lingering
  on a puzzle they can't solve is still *interested*).
- **Puzzle → game:** puzzles are dumb; they call `onSolved()` / `onExit()`. The overlay owns
  focus/timer start-stop; the tracker subscribes to `focusedGadgetId`.

## 6. Art direction

Cozy painterly (cabin) + painterly-parchment (map, "Promise Land"-style themed nodes). Iterate with
the **LAAS loop**: name a hero reference frame → itemize contents → score gaps → "for each gap, what
raises it +2; do the two cheapest" → re-render. Content-floor (never empty/flat) with a cost sense,
though no hard Chromebook ceiling today.

## 7. Delegation plan (parallel subagents)

After the `Gadget` contract + `PuzzleProps` + game-store interface are fixed (done first, in the main
session), fan out independent agents:
- **A** — `Cabin3D`: trim tinker-cabin's scene to a fixed-camera cabin + hotspot anchors.
- **B** — `Nonogram` puzzle (pure React + tests).
- **C** — `LogicGrid` puzzle (clue engine + tests).
- **D** — art-gen (`gen-art.mjs`) + a first map & static-cabin pass via the gateway + LAAS compare.
- **E** — `InterestTracker` + `ReadoutScreen`.
Integration (map ↔ cabin ↔ overlay ↔ readout wiring, A/B toggle) happens in the main session.

## 8. Testing & gate

- **Puzzle logic** unit-tested (vitest): clue derivation, win-detection, constraint solving.
- **Interest tracker** unit-tested: idle/visibility/blur pause correctness.
- **Manual/webapp smoke:** map→cabin→gadget→solve→readout, both cabin backends.
- Factory gate: typecheck + test + build green before any PR.

## 9. Risks

- *Scope creep* ("all puzzles") → framework + exactly 2 polished; rest inert. Enforced in §2.
- *Lifting tinker-cabin drags in physics/WASD* → copy only scene/lights/gadget-visual bits; drop
  rapier + controls; rebuild camera as fixed + click-to-focus.
- *Static-cabin hotspots drift from the art* → author hotspots against the actual generated image;
  keep positions data-driven for quick nudging.
- *Interest signal is only as honest as the pause logic* → unit-test idle/visibility/blur.
