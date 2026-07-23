# STATUS — Tinker Workshop cabin (photoreal explorable Discovery cabin)

Durable memory between sessions (LAAS-style). NOT the spec (`PROJECT.md`) and NOT the gap list
(`DELTA.md`) — this is the live working state. See `.loop/progress.md` for the turn-by-turn loop log;
this file holds the higher-level mission/rules/decisions. Update after every meaningful step.

## 0. Rehydration protocol (read first, every session)
1. Read `.loop/progress.md` top-to-bottom (rehydration + Next actions).
2. Read `PROJECT.md` (floors + Definition of Done) + `DELTA.md` (current worst-first gaps).
3. Skim §8 Gotchas in `.loop/progress.md` so you don't repeat a solved mistake.
4. **Never re-plan from scratch. Continue from the Next-actions queue.**

## 1. Mission
Ship a fresh, standalone, **photoreal, explorable 3D Tinker Workshop cabin** (Code-domain Discovery
cabin) that runs the full Discovery loop: explore (WASD + mouse-look) → a Code "first taste" mini-app
(debug a broken contraption) → behavioral signal capture into an `InterestHypothesis`. Fireplace + cat
mandatory. "Done" = every canonical framing self-scores ≥8/10 vs `reference/`, mean ≥8.5, all named
gates green, ≥60fps (≥30 hard floor).

## 2. Hard rules & floors (binding — see PROJECT.md for the machine-checked list)
- Banned outcomes: crushed pure-black shadows; flat/unlit surfaces; no visible fire light; missing
  cat; blown highlights; z-fighting/holes; nondeterministic frames; silent fps cliff.
- Deterministic harness hooks required: `?seed ?cam=x,y,z,yaw,pitch[,fov] ?freeze=1`, plus
  `window.__cabin = { ready, error, progress, progressMsg, stats }`.
- Repo is PUBLIC: only CC0/CC-licensed assets; `reference/` + binaries gitignored; no secrets.

## 3. Verified environment facts
- Runtime: macOS, Chrome/Chromium via Playwright. Harness launcher tries SwiftShader → Metal/ANGLE,
  caches the winner in `.cache/webgl-flags.json`.
- Package manager: **pnpm** (repo standard). Workspace member under `passion/apps/*`.
- Harness deps: `playwright`, `sharp`, `tsx`, `vite`, `typescript`, `vitest`. Render deps TBD (bake-off).

## 4. Phase checklist
See `.loop/progress.md` (phases 1–8). None complete yet.

## 5. Current focus
Bootstrap: harness ported; awaiting stack bake-off + reference set before scaffolding the app.

## 6. Next actions
See `.loop/progress.md` → Next actions (kept live there).

## 7. Key decisions log
See `.loop/progress.md` → Key decisions (D1–D4). Additions logged there.

## 8. Gotchas / lessons learned (APPEND-ONLY)
See `.loop/progress.md` → Gotchas.

## 9. Architecture / file map
- `cabin/` — the Vite app (index.html + src): render, scene, controller, hook, params. (scaffolded next)
- `tools/` — harness: `launch.ts` `shoot.ts` `compare.ts` `gates.ts` `battery.ts` `types.d.ts`.
- `reference/` — gitignored CC-licensed aesthetic targets + README mapping each to a target.
- `shots/` — gitignored rendered framings + comparisons + stats.
- `PROJECT.md` — the brief (what/what-not/floors). `DELTA.md` — worst-first gap log. `.loop/` — loop memory.

## 10. Reference analysis
See `reference/README.md` (each golden → the aesthetic target it asserts).
