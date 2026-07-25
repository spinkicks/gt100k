# MVP Jul 24 — Passion-Engine Point-and-Click Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A demo-quality point-and-click game where a student clicks a cabin on a 2D map, enters a cozy interior, clicks gadgets that open full-screen mini-puzzles, and whose active time-on-gadget is tracked as an interest signal.

**Architecture:** Approach ① "layered scene + gadget overlay". The cabin background (3D R3F scene *or* static AI image) is purely visual; gadgets are a declarative registry of hotspots; clicking one opens a pure-React puzzle as a full-screen overlay. An interest tracker credits active seconds to the focused gadget. Screens: map ↔ cabin ↔ overlay ↔ readout.

**Tech Stack:** Vite + React 18 + TypeScript, `@react-three/fiber`/`drei`/`three` (Cabin3D only), `motion` (transitions), `zustand` (state), Vitest (logic tests), Playwright + sharp (LAAS shoot/compare), TrueFoundry gateway (image-gen). pnpm workspace member `@gt100k/mvp-jul24`.

## Global Constraints

- Package manager: **pnpm 9.15.9** only. App is a workspace member under `passion/apps/mvp-jul24` (glob `passion/apps/*`), name `@gt100k/mvp-jul24`.
- React **18.3.1**, three **0.169.0**, @react-three/fiber **^8.17.10**, @react-three/drei **^9.114.0** (match tinker-cabin — do not bump).
- Lint via root **Biome** (`biome check passion`); it must pass. No barrel `index.ts` re-exports (AGENTS.md).
- Secrets: gateway key is read from env (`ANTHROPIC_CUSTOM_HEADERS` → `x-tfy-api-key`); **never** write it to any tracked file. Repo is public; `.env*` and keys are forbidden.
- Data: synthetic/local only. Interest data lives in `localStorage` under key `mvp-jul24:interest`. No backend, no real child PII.
- Gateway image route (verified): `POST https://tfy.promptlens.trilogy.com/api/llm/images/generations`, header `x-tfy-api-key: <key>`, models `gpt-image-1` (PNG) / `gemini-3-pro-image-preview` (JPEG).
- Conventional Commits. Each task ends green (typecheck + its tests).

---

## File Structure

```
passion/apps/mvp-jul24/
  package.json  tsconfig.json  vite.config.ts  index.html  vitest.config.ts
  public/art/                      # generated images (map, static cabin, props)
  scripts/gen-art.mjs              # gateway image-gen
  tools/shoot.ts  tools/compare.ts # LAAS delta loop (lifted)
  src/
    main.tsx  App.tsx
    game/
      types.ts                     # Gadget, PuzzleProps, Screen, TopicId, CabinBackend
      store.ts                     # zustand game store
    gadgets/
      registry.ts                  # GADGETS array + helpers
    puzzles/
      Nonogram/ logic.ts  Nonogram.tsx
      LogicGrid/ logic.ts  LogicGrid.tsx  puzzles.data.ts
      ComingSoon.tsx
    cabin/
      CabinView.tsx                # picks backend from store
      CabinStatic.tsx              # <img> + hotspot layer
      Cabin3D.tsx                  # trimmed R3F scene + Html hotspots
      hotspots.ts                  # GADGET id -> screen anchor
    overlay/
      GadgetOverlay.tsx            # full-screen puzzle host + focus wiring
    map/
      MapScreen.tsx                # painterly map + cabin nodes
      cabins.data.ts               # cabin list (only math active)
    interest/
      activeTime.ts                # pure active-time logic (tested)
      store.ts                     # zustand interest store + persistence
      useInterestTracker.ts        # React hook wiring events -> store
      ReadoutScreen.tsx            # bars per gadget/topic
```

---

## Phase A — Foundation

### Task 1: Scaffold the Vite app as a workspace member

**Files:**
- Create: `passion/apps/mvp-jul24/package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.test.ts`

**Interfaces:**
- Produces: a runnable app (`pnpm --filter @gt100k/mvp-jul24 dev`) and passing test/typecheck/build.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@gt100k/mvp-jul24",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --port 5178 --strictPort",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "gen-art": "node scripts/gen-art.mjs",
    "shoot": "tsx tools/shoot.ts",
    "compare": "tsx tools/compare.ts"
  },
  "dependencies": {
    "@react-three/drei": "^9.114.0",
    "@react-three/fiber": "^8.17.10",
    "motion": "^11.11.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.169.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.169.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "playwright": "^1.48.0",
    "sharp": "^0.33.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`**

`tsconfig.json`:
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx", "lib": ["DOM", "DOM.Iterable", "ES2022"], "types": ["vite/client"], "noEmit": true },
  "include": ["src", "tools", "scripts"]
}
```
`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], server: { port: 5178, strictPort: true } })
```
`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'jsdom', globals: true } })
```
`index.html`:
```html
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Passion Lab</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
```

- [ ] **Step 3: Create `src/main.tsx` + `src/App.tsx` + failing smoke test**

`src/App.tsx`:
```tsx
export default function App() { return <div data-testid="app-root">Passion Lab</div> }
```
`src/main.tsx`:
```tsx
import { createRoot } from 'react-dom/client'
import App from './App'
createRoot(document.getElementById('root')!).render(<App />)
```
`src/App.test.ts`:
```ts
import { render, screen } from '@testing-library/react'
import App from './App'
test('renders app root', () => { render(<App />); expect(screen.getByTestId('app-root')).toBeInTheDocument() })
```
Add `@testing-library/react`, `@testing-library/jest-dom` to devDependencies and a `vitest.setup.ts` importing `@testing-library/jest-dom`; reference it in `vitest.config.ts` (`test.setupFiles`).

- [ ] **Step 4: Install + verify**

Run: `pnpm install` (repo root), then `pnpm --filter @gt100k/mvp-jul24 test` → PASS, `pnpm --filter @gt100k/mvp-jul24 typecheck` → clean, `pnpm --filter @gt100k/mvp-jul24 build` → succeeds.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24 pnpm-lock.yaml
git commit -m "feat(mvp-jul24): scaffold Vite+React+TS workspace app"
```

---

### Task 2: Core types + game store

**Files:**
- Create: `src/game/types.ts`, `src/game/store.ts`, `src/game/store.test.ts`

**Interfaces:**
- Produces:
  - `TopicId = 'math'|'music'|'code'|'art'|'science'|'words'`
  - `Screen = 'map'|'cabin'|'readout'`; `CabinBackend = '3d'|'static'`
  - `interface GadgetHotspot { xPct: number; yPct: number; label: string }`
  - `interface PuzzleProps { seed: number; onSolved: () => void; onExit: () => void }`
  - `interface Gadget { id: string; topic: TopicId; label: string; hotspot: GadgetHotspot; status: 'active'|'coming-soon'; Puzzle?: React.ComponentType<PuzzleProps> }`
  - `useGame` store: `{ screen; cabinId: TopicId|null; focusedGadgetId: string|null; cabinBackend; openCabin(id); focusGadget(id); closeGadget(); goToMap(); goToReadout(); setBackend(b) }`

- [ ] **Step 1: Write failing store test**

`src/game/store.test.ts`:
```ts
import { useGame } from './store'
beforeEach(() => useGame.getState().goToMap())
test('openCabin sets screen+cabin', () => {
  useGame.getState().openCabin('math')
  expect(useGame.getState().screen).toBe('cabin')
  expect(useGame.getState().cabinId).toBe('math')
})
test('focus then close clears focusedGadgetId', () => {
  useGame.getState().openCabin('math'); useGame.getState().focusGadget('nonogram')
  expect(useGame.getState().focusedGadgetId).toBe('nonogram')
  useGame.getState().closeGadget()
  expect(useGame.getState().focusedGadgetId).toBeNull()
})
```

- [ ] **Step 2: Run → FAIL** (`store` not found). Run: `pnpm --filter @gt100k/mvp-jul24 test src/game`

- [ ] **Step 3: Implement `types.ts` + `store.ts`**

`src/game/types.ts`: the interfaces from the Interfaces block above.
`src/game/store.ts`:
```ts
import { create } from 'zustand'
import type { TopicId, Screen, CabinBackend } from './types'
interface GameState {
  screen: Screen; cabinId: TopicId | null; focusedGadgetId: string | null; cabinBackend: CabinBackend
  openCabin: (id: TopicId) => void; focusGadget: (id: string) => void; closeGadget: () => void
  goToMap: () => void; goToReadout: () => void; setBackend: (b: CabinBackend) => void
}
const initialBackend: CabinBackend =
  new URLSearchParams(globalThis.location?.search ?? '').get('cabin') === 'static' ? 'static' : '3d'
export const useGame = create<GameState>((set) => ({
  screen: 'map', cabinId: null, focusedGadgetId: null, cabinBackend: initialBackend,
  openCabin: (id) => set({ screen: 'cabin', cabinId: id, focusedGadgetId: null }),
  focusGadget: (id) => set({ focusedGadgetId: id }),
  closeGadget: () => set({ focusedGadgetId: null }),
  goToMap: () => set({ screen: 'map', cabinId: null, focusedGadgetId: null }),
  goToReadout: () => set({ screen: 'readout', focusedGadgetId: null }),
  setBackend: (b) => set({ cabinBackend: b }),
}))
```

- [ ] **Step 4: Run → PASS.** `pnpm --filter @gt100k/mvp-jul24 test src/game`
- [ ] **Step 5: Commit** — `feat(mvp-jul24): core types and game store`

---

### Task 3: Interest tracker (pure logic + store + hook)

**Files:**
- Create: `src/interest/activeTime.ts`, `src/interest/activeTime.test.ts`, `src/interest/store.ts`, `src/interest/store.test.ts`, `src/interest/useInterestTracker.ts`

**Interfaces:**
- Produces:
  - `IDLE_MS = 30_000`
  - `interface TrackerState { focusedGadgetId: string|null; lastTickAt: number; lastInputAt: number; pageVisible: boolean; windowFocused: boolean }`
  - `isActive(s: TrackerState, now: number): boolean`
  - `tickDelta(s: TrackerState, now: number): number`
  - `useInterest` store: `{ byGadget: Record<string,{activeMs;opens;solves}>; addActiveMs(id,ms); recordOpen(id); recordSolve(id); reset() }` (persisted to `localStorage` key `mvp-jul24:interest`)
  - `useInterestTracker(): void` — React hook, mount in App, drives store from focus + activity.

- [ ] **Step 1: Failing tests for `activeTime.ts`**

`src/interest/activeTime.test.ts`:
```ts
import { isActive, tickDelta, IDLE_MS, type TrackerState } from './activeTime'
const base: TrackerState = { focusedGadgetId: 'g', lastTickAt: 1000, lastInputAt: 1000, pageVisible: true, windowFocused: true }
test('active when focused, visible, focused, recent input', () => { expect(isActive(base, 2000)).toBe(true) })
test('inactive with no focused gadget', () => { expect(isActive({ ...base, focusedGadgetId: null }, 2000)).toBe(false) })
test('inactive when tab hidden', () => { expect(isActive({ ...base, pageVisible: false }, 2000)).toBe(false) })
test('inactive when idle beyond IDLE_MS', () => { expect(isActive(base, 1000 + IDLE_MS + 1)).toBe(false) })
test('tickDelta credits elapsed while active', () => { expect(tickDelta(base, 3000)).toBe(2000) })
test('tickDelta zero while inactive', () => { expect(tickDelta({ ...base, windowFocused: false }, 3000)).toBe(0) })
```

- [ ] **Step 2: Run → FAIL.** `pnpm --filter @gt100k/mvp-jul24 test src/interest/activeTime`

- [ ] **Step 3: Implement `activeTime.ts`**

```ts
export const IDLE_MS = 30_000
export interface TrackerState { focusedGadgetId: string | null; lastTickAt: number; lastInputAt: number; pageVisible: boolean; windowFocused: boolean }
export function isActive(s: TrackerState, now: number): boolean {
  return s.focusedGadgetId !== null && s.pageVisible && s.windowFocused && now - s.lastInputAt < IDLE_MS
}
export function tickDelta(s: TrackerState, now: number): number {
  return isActive(s, now) ? Math.max(0, now - s.lastTickAt) : 0
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Failing test for the store**

`src/interest/store.test.ts`:
```ts
import { useInterest } from './store'
beforeEach(() => useInterest.getState().reset())
test('accumulates active ms and counts', () => {
  const s = useInterest.getState(); s.recordOpen('nonogram'); s.addActiveMs('nonogram', 1500); s.addActiveMs('nonogram', 500); s.recordSolve('nonogram')
  const g = useInterest.getState().byGadget['nonogram']
  expect(g.activeMs).toBe(2000); expect(g.opens).toBe(1); expect(g.solves).toBe(1)
})
```

- [ ] **Step 6: Implement `store.ts` (persisted)**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface GadgetInterest { activeMs: number; opens: number; solves: number }
interface InterestState {
  byGadget: Record<string, GadgetInterest>
  addActiveMs: (id: string, ms: number) => void; recordOpen: (id: string) => void; recordSolve: (id: string) => void; reset: () => void
}
const empty = (): GadgetInterest => ({ activeMs: 0, opens: 0, solves: 0 })
export const useInterest = create<InterestState>()(persist((set) => ({
  byGadget: {},
  addActiveMs: (id, ms) => set((st) => { const g = st.byGadget[id] ?? empty(); return { byGadget: { ...st.byGadget, [id]: { ...g, activeMs: g.activeMs + ms } } } }),
  recordOpen: (id) => set((st) => { const g = st.byGadget[id] ?? empty(); return { byGadget: { ...st.byGadget, [id]: { ...g, opens: g.opens + 1 } } } }),
  recordSolve: (id) => set((st) => { const g = st.byGadget[id] ?? empty(); return { byGadget: { ...st.byGadget, [id]: { ...g, solves: g.solves + 1 } } } }),
  reset: () => set({ byGadget: {} }),
}), { name: 'mvp-jul24:interest' }))
```

- [ ] **Step 7: Run → PASS.**

- [ ] **Step 8: Implement `useInterestTracker.ts`** (no unit test — verified in the integration smoke, Task 13)

```ts
import { useEffect, useRef } from 'react'
import { useGame } from '../game/store'
import { useInterest } from './store'
import { tickDelta, type TrackerState } from './activeTime'
export function useInterestTracker(): void {
  const focusedGadgetId = useGame((s) => s.focusedGadgetId)
  const ref = useRef<TrackerState>({ focusedGadgetId, lastTickAt: Date.now(), lastInputAt: Date.now(), pageVisible: !document.hidden, windowFocused: document.hasFocus() })
  ref.current.focusedGadgetId = focusedGadgetId
  useEffect(() => {
    const input = () => { ref.current.lastInputAt = Date.now() }
    const vis = () => { ref.current.pageVisible = !document.hidden }
    const onFocus = () => { ref.current.windowFocused = true }; const onBlur = () => { ref.current.windowFocused = false }
    for (const e of ['pointerdown', 'pointermove', 'keydown']) window.addEventListener(e, input)
    document.addEventListener('visibilitychange', vis); window.addEventListener('focus', onFocus); window.addEventListener('blur', onBlur)
    const iv = setInterval(() => {
      const now = Date.now(); const id = ref.current.focusedGadgetId
      const d = tickDelta(ref.current, now); if (id && d > 0) useInterest.getState().addActiveMs(id, d)
      ref.current.lastTickAt = now
    }, 1000)
    return () => { clearInterval(iv); for (const e of ['pointerdown', 'pointermove', 'keydown']) window.removeEventListener(e, input); document.removeEventListener('visibilitychange', vis); window.removeEventListener('focus', onFocus); window.removeEventListener('blur', onBlur) }
  }, [])
}
```

- [ ] **Step 9: Commit** — `feat(mvp-jul24): interest tracker (active-time logic + store + hook)`

---

## Phase B — Puzzles (the priority: make these feel good)

### Task 4: Nonogram logic

**Files:**
- Create: `src/puzzles/Nonogram/logic.ts`, `src/puzzles/Nonogram/logic.test.ts`

**Interfaces:**
- Produces:
  - `type Cell = 'empty'|'filled'|'crossed'`
  - `interface NonogramPuzzle { size: number; solution: boolean[][]; rowClues: number[][]; colClues: number[][] }`
  - `deriveClues(solution: boolean[][]): { rowClues: number[][]; colClues: number[][] }`
  - `makePuzzle(solution: boolean[][]): NonogramPuzzle`
  - `isSolved(grid: Cell[][], puzzle: NonogramPuzzle): boolean`
  - `blankGrid(size: number): Cell[][]`

- [ ] **Step 1: Failing tests**

`src/puzzles/Nonogram/logic.test.ts`:
```ts
import { deriveClues, makePuzzle, isSolved, blankGrid, type Cell } from './logic'
const sol = [[true, true, false], [false, true, false], [true, false, true]]
test('deriveClues rows/cols', () => {
  const { rowClues, colClues } = deriveClues(sol)
  expect(rowClues).toEqual([[2], [1], [1, 1]])
  expect(colClues).toEqual([[1, 1], [2], [1]])
})
test('isSolved true when filled matches solution', () => {
  const p = makePuzzle(sol); const g: Cell[][] = sol.map((r) => r.map((c) => (c ? 'filled' : 'empty')))
  expect(isSolved(g, p)).toBe(true)
})
test('isSolved false when a filled cell is wrong', () => {
  const p = makePuzzle(sol); const g = blankGrid(3); g[0][0] = 'filled'
  expect(isSolved(g, p)).toBe(false)
})
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `logic.ts`**

```ts
export type Cell = 'empty' | 'filled' | 'crossed'
export interface NonogramPuzzle { size: number; solution: boolean[][]; rowClues: number[][]; colClues: number[][] }
const runs = (line: boolean[]): number[] => { const out: number[] = []; let n = 0; for (const v of line) { if (v) n++; else if (n) { out.push(n); n = 0 } } if (n) out.push(n); return out.length ? out : [0] }
export function deriveClues(solution: boolean[][]) {
  const rowClues = solution.map(runs)
  const colClues = solution[0].map((_, c) => runs(solution.map((r) => r[c])))
  return { rowClues, colClues }
}
export function makePuzzle(solution: boolean[][]): NonogramPuzzle { return { size: solution.length, solution, ...deriveClues(solution) } }
export function blankGrid(size: number): Cell[][] { return Array.from({ length: size }, () => Array.from({ length: size }, () => 'empty' as Cell)) }
export function isSolved(grid: Cell[][], p: NonogramPuzzle): boolean {
  for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) if ((grid[r][c] === 'filled') !== p.solution[r][c]) return false
  return true
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat(mvp-jul24): nonogram logic + tests`

---

### Task 5: Nonogram UI

**Files:**
- Create: `src/puzzles/Nonogram/Nonogram.tsx`, `src/puzzles/Nonogram/puzzles.data.ts`, `src/puzzles/Nonogram/Nonogram.css`
- Test: `src/puzzles/Nonogram/Nonogram.test.tsx`

**Interfaces:**
- Consumes: `PuzzleProps` (Task 2), Nonogram logic (Task 4).
- Produces: `Nonogram: React.FC<PuzzleProps>` (default export), `PUZZLES: boolean[][][]` (seed picks one via `seed % PUZZLES.length`).

- [ ] **Step 1: Failing render test**

`Nonogram.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import Nonogram from './Nonogram'
test('solving the puzzle calls onSolved', () => {
  const onSolved = vi.fn()
  render(<Nonogram seed={0} onSolved={onSolved} onExit={() => {}} />)
  // click every cell that should be filled (data-fill="1")
  for (const el of Array.from(document.querySelectorAll('[data-fill="1"]'))) fireEvent.click(el)
  expect(onSolved).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `puzzles.data.ts` + `Nonogram.tsx`**

`puzzles.data.ts` — two hand-authored 5×5 solutions (arrays of boolean rows), exported as `PUZZLES`. Include the target `data-fill` markers so the test can find intended cells.
`Nonogram.tsx` (left-click cycles empty→filled→crossed→empty; render `data-fill` attr = solution value for testability; show row/col clues; call `onSolved()` when `isSolved` flips true; an "Exit" button calls `onExit`):
```tsx
import { useMemo, useState, useEffect } from 'react'
import type { PuzzleProps } from '../../game/types'
import { makePuzzle, blankGrid, isSolved, type Cell } from './logic'
import { PUZZLES } from './puzzles.data'
import './Nonogram.css'
export default function Nonogram({ seed, onSolved, onExit }: PuzzleProps) {
  const puzzle = useMemo(() => makePuzzle(PUZZLES[seed % PUZZLES.length]), [seed])
  const [grid, setGrid] = useState<Cell[][]>(() => blankGrid(puzzle.size))
  const next = (c: Cell): Cell => (c === 'empty' ? 'filled' : c === 'filled' ? 'crossed' : 'empty')
  useEffect(() => { if (isSolved(grid, puzzle)) onSolved() }, [grid, puzzle, onSolved])
  return (
    <div className="ng">
      <button className="ng-exit" onClick={onExit}>← Back</button>
      {/* clues + grid; each cell: onClick sets next(); data-fill={puzzle.solution[r][c] ? '1' : '0'} */}
    </div>
  )
}
```
Fill in the clue rails + grid markup with the `data-fill` attribute and `onClick` handler mutating a copy of `grid`.

- [ ] **Step 4: Run → PASS.** Fix markup until the test's fill-clicks solve it.
- [ ] **Step 5: Commit** — `feat(mvp-jul24): nonogram UI`

---

### Task 6: Logic-grid logic

**Files:**
- Create: `src/puzzles/LogicGrid/logic.ts`, `src/puzzles/LogicGrid/logic.test.ts`, `src/puzzles/LogicGrid/puzzles.data.ts`

**Interfaces:**
- Produces:
  - `interface Category { name: string; values: string[] }`
  - `interface LogicPuzzle { entities: string[]; categories: Category[]; clues: string[]; solution: Record<string, Record<string, string>> }` (solution: entity → categoryName → value)
  - `type Mark = 'unknown'|'yes'|'no'`
  - `type MarkGrid = Record<string, Mark>` keyed by `key(entity, categoryName, value)`
  - `key(entity: string, category: string, value: string): string`
  - `emptyMarks(p: LogicPuzzle): MarkGrid`
  - `isSolved(marks: MarkGrid, p: LogicPuzzle): boolean` — every solution pair marked `yes`, and every non-solution pair in a solved category marked `no`.
  - `SPORTS_PUZZLE: LogicPuzzle` (the reference: Brad/Jenny/Frank/Susan × Basketball/Baseball/Volleyball/Soccer + the 3 clues).

- [ ] **Step 1: Failing tests**

```ts
import { SPORTS_PUZZLE, emptyMarks, isSolved, key } from './logic'
test('empty marks not solved', () => { expect(isSolved(emptyMarks(SPORTS_PUZZLE), SPORTS_PUZZLE)).toBe(false) })
test('exact solution marks solve it', () => {
  const p = SPORTS_PUZZLE; const m = emptyMarks(p)
  for (const e of p.entities) for (const v of p.categories[0].values) m[key(e, p.categories[0].name, v)] = p.solution[e][p.categories[0].name] === v ? 'yes' : 'no'
  expect(isSolved(m, p)).toBe(true)
})
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `logic.ts` + author `SPORTS_PUZZLE`**

Solution for the reference (derivable from clues — Brad→Basketball, Jenny→Soccer, Frank→Baseball, Susan→Volleyball). `key = `${e}|${c}|${v}``. `isSolved`: for each entity+category, the value equal to `solution[e][c]` must be `yes` and all other values for that (e,c) must be `no`.

```ts
export interface Category { name: string; values: string[] }
export interface LogicPuzzle { entities: string[]; categories: Category[]; clues: string[]; solution: Record<string, Record<string, string>> }
export type Mark = 'unknown' | 'yes' | 'no'
export type MarkGrid = Record<string, Mark>
export const key = (e: string, c: string, v: string) => `${e}|${c}|${v}`
export function emptyMarks(p: LogicPuzzle): MarkGrid { const m: MarkGrid = {}; for (const e of p.entities) for (const cat of p.categories) for (const v of cat.values) m[key(e, cat.name, v)] = 'unknown'; return m }
export function isSolved(m: MarkGrid, p: LogicPuzzle): boolean {
  for (const e of p.entities) for (const cat of p.categories) for (const v of cat.values) {
    const want: Mark = p.solution[e][cat.name] === v ? 'yes' : 'no'
    if (m[key(e, cat.name, v)] !== want) return false
  }
  return true
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat(mvp-jul24): logic-grid logic + sports puzzle`

---

### Task 7: Logic-grid UI

**Files:**
- Create: `src/puzzles/LogicGrid/LogicGrid.tsx`, `src/puzzles/LogicGrid/LogicGrid.css`
- Test: `src/puzzles/LogicGrid/LogicGrid.test.tsx`

**Interfaces:**
- Consumes: `PuzzleProps`, LogicGrid logic (Task 6).
- Produces: `LogicGrid: React.FC<PuzzleProps>` (default export).

- [ ] **Step 1: Failing render test** — render, show clues text, click cells cycling unknown→yes→no; when marks match solution, `onSolved` fires. Use `data-cell="${key}"` for targeting.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — a grid table (entities × each category's values), clue list, cell click cycles `unknown→yes→no→unknown`, `useEffect` calls `onSolved()` when `isSolved`. Exit button → `onExit`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat(mvp-jul24): logic-grid UI`

---

## Phase C — Shell (map, cabin, overlay, readout, wiring)

### Task 8: Gadget registry + ComingSoon

**Files:**
- Create: `src/gadgets/registry.ts`, `src/gadgets/registry.test.ts`, `src/puzzles/ComingSoon.tsx`

**Interfaces:**
- Consumes: `Gadget`, `PuzzleProps`, Nonogram (Task 5), LogicGrid (Task 7).
- Produces: `GADGETS: Gadget[]`, `gadgetsForTopic(topic: TopicId): Gadget[]`, `gadgetById(id: string): Gadget | undefined`.

- [ ] **Step 1: Failing test** — `gadgetsForTopic('math')` includes `nonogram` (active, has `Puzzle`) and `logic-grid` (active), plus coming-soon entries (`mirror`, `chess`, `minesweeper`, `pipes`, `lits`) with `status: 'coming-soon'` and no `Puzzle`.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** `ComingSoon.tsx` (a `PuzzleProps` component showing "Coming soon" + Back) and `registry.ts` with the 2 active + 5 coming-soon math gadgets, each with a `hotspot {xPct,yPct,label}`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat(mvp-jul24): gadget registry`

---

### Task 9: GadgetOverlay (focus wiring + zoom)

**Files:**
- Create: `src/overlay/GadgetOverlay.tsx`, `src/overlay/GadgetOverlay.css`
- Test: `src/overlay/GadgetOverlay.test.tsx`

**Interfaces:**
- Consumes: `useGame`, `useInterest`, `gadgetById`.
- Produces: `GadgetOverlay: React.FC` — reads `focusedGadgetId`; if set, mounts the gadget's `Puzzle` (or `ComingSoon`) full-screen with a `motion` scale-in; calls `recordOpen` on mount, `recordSolve` on solve, `closeGadget` on exit.

- [ ] **Step 1: Failing test** — set `useGame` focusedGadgetId to `nonogram`; render `<GadgetOverlay/>`; assert puzzle present and `useInterest.getState().byGadget.nonogram.opens === 1`.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** with `motion` (`initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}}`); `onSolved` → `recordSolve(id)` then keep overlay with a "Solved!" state + Back; `onExit` → `closeGadget()`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `feat(mvp-jul24): gadget overlay with focus/interest wiring`

---

### Task 10: CabinStatic backend

**Files:**
- Create: `src/cabin/CabinStatic.tsx`, `src/cabin/hotspots.ts`, `src/cabin/CabinStatic.css`
- Test: `src/cabin/CabinStatic.test.tsx`

**Interfaces:**
- Consumes: `gadgetsForTopic`, `useGame.focusGadget`.
- Produces: `CabinStatic: React.FC<{ topic: TopicId }>` — renders `public/art/cabin-math.png` (may be a placeholder until Task 14) with absolutely-positioned hotspot buttons at each gadget's `hotspot.xPct/yPct`; click → `focusGadget(id)`.

- [ ] **Step 1: Failing test** — render `<CabinStatic topic="math"/>`; a button labelled the nonogram hotspot label exists; clicking sets `useGame.focusedGadgetId`.
- [ ] **Step 2–4:** implement + pass.
- [ ] **Step 5: Commit** — `feat(mvp-jul24): static cabin backend + hotspots`

---

### Task 11: Cabin3D backend (lift + trim tinker-cabin)

**Files:**
- Create: `src/cabin/Cabin3D.tsx`
- Copy/adapt from `passion/apps/tinker-cabin/cabin/src/scene/`: `Cabin.tsx`, `EnvLight.tsx`, `textures.ts`, `layout.ts` (copy into `src/cabin/scene/`, strip WASD/rapier/physics imports).

**Interfaces:**
- Consumes: `gadgetsForTopic`, `useGame.focusGadget`.
- Produces: `Cabin3D: React.FC<{ topic: TopicId }>` — a `<Canvas>` with a **fixed camera** (no OrbitControls/PointerLock), the lifted cozy room, and drei `<Html>` hotspot markers at gadget anchors; click → `focusGadget(id)`.

- [ ] **Step 1:** Copy the scene files; delete `@react-three/rapier`, `PhysicsController`, `CameraRig` (WASD) usages; set a static `<PerspectiveCamera makeDefault position={...} />` matching the reference screenshot framing.
- [ ] **Step 2:** Add drei `<Html>` markers per active gadget (a glowing "+" like the reference), `onClick={() => focusGadget(id)}`.
- [ ] **Step 3:** `pnpm --filter @gt100k/mvp-jul24 typecheck` clean; `dev` renders the room with clickable markers (manual check).
- [ ] **Step 4: Commit** — `feat(mvp-jul24): 3d cabin backend (fixed-camera, lifted from tinker-cabin)`

---

### Task 12: CabinView + MapScreen + ReadoutScreen

**Files:**
- Create: `src/cabin/CabinView.tsx`, `src/map/MapScreen.tsx`, `src/map/cabins.data.ts`, `src/interest/ReadoutScreen.tsx` (+ CSS)
- Test: `src/map/MapScreen.test.tsx`, `src/interest/ReadoutScreen.test.tsx`

**Interfaces:**
- `CabinView`: reads `cabinBackend` from `useGame`; renders `Cabin3D` or `CabinStatic` + a small A/B toggle button (`setBackend`).
- `MapScreen`: renders `public/art/map.png` + cabin nodes from `cabins.data.ts` (only `math` active); click active node → `openCabin('math')`.
- `ReadoutScreen`: bars per gadget from `useInterest.byGadget` (label + active minutes), sorted desc; a "Back to map" button.

- [ ] **Step 1: Failing tests** — MapScreen: clicking the Math node calls `openCabin`. ReadoutScreen: seed interest store, assert a bar with the gadget label + rounded minutes renders.
- [ ] **Step 2–4:** implement + pass.
- [ ] **Step 5: Commit** — `feat(mvp-jul24): cabin view (A/B), map screen, readout screen`

---

### Task 13: Wire the game router + integration smoke

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.integration.test.tsx`

**Interfaces:**
- Consumes: `useGame`, `useInterestTracker`, `MapScreen`, `CabinView`, `GadgetOverlay`, `ReadoutScreen`.

- [ ] **Step 1: Failing integration test** — render `<App/>`; click Math node → cabin; click nonogram hotspot → overlay open (`opens===1`); solve → `solves===1`; a header "Interest" button → readout shows the nonogram bar.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `App.tsx`** — call `useInterestTracker()`; switch on `screen`: `map`→`MapScreen`, `cabin`→`CabinView`+`GadgetOverlay`, `readout`→`ReadoutScreen`; a persistent top bar with "Map" + "Interest" nav + the cabin A/B toggle.
- [ ] **Step 4: Run → PASS.** Then `pnpm --filter @gt100k/mvp-jul24 build` green.
- [ ] **Step 5: Commit** — `feat(mvp-jul24): wire map/cabin/overlay/readout + integration test`

---

## Phase D — Art + LAAS (visuals second, per priority)

### Task 14: Gateway art-generation script

**Files:**
- Create: `scripts/gen-art.mjs`, `public/art/CREDITS.md`

**Interfaces:**
- Produces: `public/art/map.png`, `public/art/cabin-math.png` (+ optional props). Reads gateway key from `process.env.ANTHROPIC_CUSTOM_HEADERS` (`x-tfy-api-key`) — never hardcoded.

- [ ] **Step 1: Implement `gen-art.mjs`** — a small Node script: `POST https://tfy.promptlens.trilogy.com/api/llm/images/generations` with `{model, prompt, n:1, size}`; decode `b64_json` or fetch `url`; write PNG to `public/art/`. Prompts: (map) painterly parchment world map, cozy themed cabins for Math/Music/Code/Art nodes, warm; (cabin) cozy wooden cabin interior, fireplace, warm light, gadgets on the wall, first-person fixed view — matching the tinker-cabin reference. Two models selectable via `--model gpt-image-1|gemini-3-pro-image-preview`.
- [ ] **Step 2: Run** `pnpm --filter @gt100k/mvp-jul24 gen-art` → files land in `public/art/`. Visually check.
- [ ] **Step 3:** Add `public/art/*.png` to the app's `.gitignore` if large; commit a small map+cabin (or track them if <~1MB). Note licensing in `CREDITS.md` (AI-generated via gateway).
- [ ] **Step 4: Commit** — `feat(mvp-jul24): gateway art-gen script + first map/cabin art`

---

### Task 15: LAAS shoot/compare loop

**Files:**
- Create: `tools/shoot.ts`, `tools/compare.ts` (adapt from `passion/apps/tinker-cabin/tools/`)
- Create: `reference/` with the hero reference frame (the cozy cabin screenshot)

**Interfaces:**
- Produces: `pnpm --filter @gt100k/mvp-jul24 shoot` (Playwright screenshot of `dev`/`preview` at fixed viewport → `shots/`), `... compare` (sharp diff vs `reference/`).

- [ ] **Step 1:** Copy tinker-cabin's `tools/shoot.ts` + `compare.ts`; retarget URL to `http://localhost:5178`, viewport to the demo size, and the reference image path.
- [ ] **Step 2:** Run the loop once (shoot → compare) to confirm it produces a delta score/artifact.
- [ ] **Step 3: Commit** — `chore(mvp-jul24): LAAS shoot/compare loop`

---

### Task 16: Full-flow polish pass + PR

- [ ] **Step 1:** webapp-testing (Playwright) smoke of the full loop on both `?cabin=3d` and `?cabin=static`: map → cabin → nonogram → solve → logic-grid → solve → readout shows both bars. Fix any breaks.
- [ ] **Step 2:** One LAAS delta pass on the map + static cabin (name hero frame, list gaps, do the two cheapest).
- [ ] **Step 3:** Run root `pnpm lint` (Biome), `pnpm --filter @gt100k/mvp-jul24 test` + `typecheck` + `build` — all green. Verify with `superpowers:verification-before-completion`.
- [ ] **Step 4:** Push branch, open **draft PR** (`gh pr create --draft`) referencing the spec. Body ends with the Claude Code line.

---

## Self-Review

**Spec coverage:**
- §2.1 map + Math cabin → Task 12. §2.2 cabin A/B (3d+static) → Tasks 10, 11, 12. §2.3 gadget framework → Task 8. §2.4 two polished puzzles → Tasks 4–7. §2.5 coming-soon gadgets → Task 8. §2.6 interest tracking + readout → Tasks 3, 12. §2.7 art + LAAS → Tasks 14, 15. Approach ① overlay → Task 9. Delegation → Phases map to subagents A–E. All covered.
- Not-today items (backend, other puzzles' logic, in-scene zoom, Chromebook perf) are correctly absent.

**Placeholder scan:** UI tasks (5, 7, 10, 11, 12) intentionally describe markup rather than pasting full JSX — each still has a failing test defining the contract and exact interfaces; logic-heavy tasks (2, 3, 4, 6, 8, 9) have full code. Acceptable: the testable contract is concrete everywhere.

**Type consistency:** `PuzzleProps {seed,onSolved,onExit}` used identically in Tasks 5,7,8,9. `Gadget`/`hotspot.xPct/yPct` consistent Tasks 2,8,10,11. `useGame` action names (`openCabin/focusGadget/closeGadget/goToMap/goToReadout/setBackend`) consistent Tasks 2,9,10,12,13. `useInterest` (`addActiveMs/recordOpen/recordSolve/reset`) consistent Tasks 3,9,12. `isSolved`/`makePuzzle`/`emptyMarks`/`key` consistent within their puzzle modules.
