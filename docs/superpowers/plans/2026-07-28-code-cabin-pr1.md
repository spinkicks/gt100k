# Code cabin PR 1 — the program runtime and Sprite Loop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared program runtime (`src/code/`) and the first Code-cabin door, Sprite Loop, playable through its own dev harness — with no registry entry, no room, and no art.

**Architecture:** A tiny instruction set is flattened into a list of atomic one-tick operations, and a pure stepper advances a machine state one op per tick. Sprite Loop compares the child's program to a target program by **pose-per-tick equality**, never by the shape of the path — a reference solver proves that matching the drawn path alone admits strictly more solutions than matching the trace, which is the design's central guarantee expressed as a test.

**Tech Stack:** TypeScript (strict), React 18, Vitest, Vite. Existing helpers: `src/lib/rng.ts` (`mulberry32`), `src/puzzles/openTier.ts`, `src/teachin/`.

**Spec:** `docs/superpowers/specs/2026-07-28-code-cabin-design.md`. Read §1.1 (X1/X2), §2.1 (Sprite Loop), §3 (the runtime) before starting.

## Global Constraints

- **X1** — the difference between a right and a wrong answer must require *executing* the program, not reading a picture of it.
- **X2** — no door may be solvable by matching a static image. The demo shows motion and leaves **no persistent trail**.
- **Offline is a hard requirement** (`src/shelf/types.ts`): no `fetch`, no network, no image URLs, no audio files. Sprite Loop is silent.
- **No score, points, stars, streak, timer, or attempt count** anywhere in UI copy or state (PRD §11). A test greps shelf prose for these words; hold puzzle copy to the same bar.
- **No numerals as part of solvable state** is a *music* rule (R1) and does **not** apply here — a `move 3` block must show its 3. Numerals that are part of the program are the domain content.
- All domain logic pure and outside components. Components hold rendering and input only.
- Package manager is **pnpm**. Run commands from `passion/apps/mvp-jul24`.
- `pnpm test` = `vitest run`. `pnpm typecheck` = `tsc --noEmit`.
- Conventional Commits. This is the `mvp-jul24` lane.
- **Do not touch** `src/gadgets/registry.ts`, `src/map/cabins.data.ts`, `src/cabin/backdrop/quads.data.ts`, or `src/shelf/cards.data.ts`. Those are PR 3 and are the files concurrent worktrees collide on.

## Deliberate scope limits, so they don't read as omissions

- **The IR carries `move` / `turn` / `wait` / `repeat` only.** `set` and `if` are listed in spec §3 and arrive with Trace & Repair in PR 2, which needs them. Building them now would be untested surface. It is one language grown in two steps, not two languages.
- **One level of `repeat` nesting.** A `repeat` body holds non-repeat statements. Lifting this is a later change and is called out in Task 1.
- **No unbounded loop exists yet**, so the step cap in Task 3 guards against nesting blowup rather than non-termination. `while` arrives with PR 2 and the cap is already the right shape for it.

## File Structure

| File | Responsibility |
|---|---|
| `src/code/program.ts` | The IR types, and `flatten` — turning nested statements into atomic one-tick ops under a cap. |
| `src/code/interpret.ts` | `step` — one op applied to one machine state. Nothing else. |
| `src/code/trace.ts` | `run` — repeated `step` into a `Trace`, with truncation reported rather than thrown. |
| `src/puzzles/SpriteLoop/logic.ts` | The puzzle type, `poseSequence`, `isSolved`, `trailOf`. Pure. |
| `src/puzzles/SpriteLoop/naive.ts` | Reference solver: enumerate tray programs, count pose-matches and trail-matches. Test-only consumer. |
| `src/puzzles/SpriteLoop/generate.ts` | `TIERS` and `generateForRound(seed, index)`. Guarantees in-bounds targets. |
| `src/puzzles/SpriteLoop/SpriteLoop.tsx` | The component: board, ghost, tray, stack, run. |
| `src/puzzles/SpriteLoop/SpriteLoop.css` | Its styles. |
| `src/puzzles/SpriteLoop/harness.tsx` | Dev-only review harness. |
| `sprite-loop.harness.html` | Root-level harness entry (the `#215` convention — see `downbeat.harness.html`). |
| `src/teachin/rules.tsx` | **Modify**: add the `sprite-loop` entry. |
| `src/teachin/diagrams.tsx` | **Modify**: add `SpriteLoopDiagram`. |

Teach-in ships with the puzzle, not with the room: `#215` landed Tune Repair, Chord Fit and Downbeat with teach-in entries and no registry rows. Spec §8.1 lists teach-in under PR 3 and is wrong on that point; follow this plan.

---

### Task 1: The IR and `flatten`

**Files:**
- Create: `passion/apps/mvp-jul24/src/code/program.ts`
- Test: `passion/apps/mvp-jul24/src/code/program.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Direction`, `Statement`, `Program`, `Op`, `FlattenResult`, `flatten(program: Program, maxOps: number): FlattenResult`, `MAX_OPS`.

- [ ] **Step 1: Write the failing test**

Create `src/code/program.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MAX_OPS, type Program, flatten } from "./program";

describe("flatten", () => {
  it("turns `move n` into n one-cell steps, because one op is one tick", () => {
    const p: Program = [{ kind: "move", steps: 3 }];
    expect(flatten(p, MAX_OPS)).toEqual({
      ops: [{ kind: "step" }, { kind: "step" }, { kind: "step" }],
      truncated: false,
    });
  });

  it("turns `wait n` into n idles, so timing occupies real ticks", () => {
    expect(flatten([{ kind: "wait", ticks: 2 }], MAX_OPS).ops).toEqual([
      { kind: "idle" },
      { kind: "idle" },
    ]);
  });

  it("keeps a turn as a single op", () => {
    expect(flatten([{ kind: "turn", quarters: 1 }], MAX_OPS).ops).toEqual([
      { kind: "turn", quarters: 1 },
    ]);
  });

  it("unrolls repeat", () => {
    const p: Program = [
      { kind: "repeat", times: 2, body: [{ kind: "move", steps: 1 }, { kind: "turn", quarters: 1 }] },
    ];
    expect(flatten(p, MAX_OPS).ops).toEqual([
      { kind: "step" },
      { kind: "turn", quarters: 1 },
      { kind: "step" },
      { kind: "turn", quarters: 1 },
    ]);
  });

  it("reports truncation instead of growing without bound", () => {
    const p: Program = [{ kind: "repeat", times: 1000, body: [{ kind: "move", steps: 1 }] }];
    const r = flatten(p, 10);
    expect(r.ops).toHaveLength(10);
    expect(r.truncated).toBe(true);
  });

  it("treats a zero or negative count as producing nothing, never as an error", () => {
    expect(flatten([{ kind: "move", steps: 0 }], MAX_OPS).ops).toEqual([]);
    expect(flatten([{ kind: "repeat", times: -1, body: [{ kind: "move", steps: 1 }] }], MAX_OPS).ops).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/code/program.test.ts`
Expected: FAIL — cannot resolve `./program`.

- [ ] **Step 3: Write the implementation**

Create `src/code/program.ts`:

```ts
/**
 * The program representation shared by every door in the Code cabin.
 *
 * ONE LANGUAGE, THREE DOORS. The doors differ in what the child edits and in what counts as done;
 * they never differ in what a program is. That is what makes the blocks-to-typed climb meaningful —
 * a child moving from Sprite Loop to Trace & Repair meets the same language in a new
 * representation, not a second language. See the spec's §3.
 *
 * WHAT IS NOT HERE YET. `set` and `if` are in the spec's IR and arrive with Trace & Repair, which is
 * the door that needs them. Building them now would be untested surface.
 *
 * ONE TICK IS ONE ATOMIC OP, and that is the load-bearing decision in this file. `move 3` is three
 * ticks, `wait 2` is two, `turn` is one. It matters because Sprite Loop's hardest tier distinguishes
 * two programs that trace the *same path at different speeds*: if a whole `move 3` collapsed into one
 * tick, those two programs would produce identical traces and the tier could not exist. Timing has to
 * cost ticks for rule X1 to have anything to bite on.
 */

/** Quarter turns clockwise from north: 0 = N, 1 = E, 2 = S, 3 = W. */
export type Direction = 0 | 1 | 2 | 3;

/**
 * A statement as the child assembles it.
 *
 * `repeat` bodies hold non-repeat statements only — one level of nesting. That is a deliberate limit
 * for the first door rather than a property of the language: `flatten` recurses, so lifting it is a
 * change to the block editor and not to this file.
 */
export type Statement =
  | { readonly kind: "move"; readonly steps: number }
  | { readonly kind: "turn"; readonly quarters: number }
  | { readonly kind: "wait"; readonly ticks: number }
  | { readonly kind: "repeat"; readonly times: number; readonly body: readonly Statement[] };

export type Program = readonly Statement[];

/** One tick's worth of work. `step` advances a cell; `idle` passes time; `turn` rotates. */
export type Op =
  | { readonly kind: "step" }
  | { readonly kind: "turn"; readonly quarters: number }
  | { readonly kind: "idle" };

export interface FlattenResult {
  readonly ops: readonly Op[];
  /** True when the cap was reached. A reported outcome, never a thrown one — see `trace.ts`. */
  readonly truncated: boolean;
}

/**
 * The default op cap.
 *
 * Nothing in this door can loop forever — `repeat` is bounded and there is no `while` yet — so this
 * guards against nested repeats multiplying rather than against non-termination. It is already the
 * right shape for `while`, which arrives with PR 2.
 */
export const MAX_OPS = 4096;

/** Flatten nested statements into atomic ops, stopping at `maxOps`. */
export function flatten(program: Program, maxOps: number): FlattenResult {
  const ops: Op[] = [];
  let truncated = false;

  const push = (op: Op): boolean => {
    if (ops.length >= maxOps) {
      truncated = true;
      return false;
    }
    ops.push(op);
    return true;
  };

  const walk = (stmts: readonly Statement[]): boolean => {
    for (const s of stmts) {
      switch (s.kind) {
        case "move":
          for (let i = 0; i < Math.trunc(s.steps); i++) if (!push({ kind: "step" })) return false;
          break;
        case "wait":
          for (let i = 0; i < Math.trunc(s.ticks); i++) if (!push({ kind: "idle" })) return false;
          break;
        case "turn":
          if (!push({ kind: "turn", quarters: s.quarters })) return false;
          break;
        case "repeat":
          for (let i = 0; i < Math.trunc(s.times); i++) if (!walk(s.body)) return false;
          break;
      }
    }
    return true;
  };

  walk(program);
  return { ops, truncated };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/code/program.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/code/program.ts passion/apps/mvp-jul24/src/code/program.test.ts
git commit -m "feat(mvp-jul24): the Code cabin's program IR, one tick per atomic op"
```

---

### Task 2: The stepper

**Files:**
- Create: `passion/apps/mvp-jul24/src/code/interpret.ts`
- Test: `passion/apps/mvp-jul24/src/code/interpret.test.ts`

**Interfaces:**
- Consumes: `Direction`, `Op` from `./program`.
- Produces: `MachineState`, `Pose`, `poseOf(state: MachineState): Pose`, `step(ops: readonly Op[], state: MachineState): MachineState`, `atEnd(ops, state): boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/code/interpret.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { type MachineState, atEnd, poseOf, step } from "./interpret";
import type { Op } from "./program";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };

describe("step", () => {
  it("moves north as decreasing y, because the board's origin is top-left", () => {
    const after = step([{ kind: "step" }], START);
    expect(poseOf(after)).toEqual({ x: 4, y: 3, facing: 0 });
  });

  it("moves east, south and west from the matching facings", () => {
    const ops: readonly Op[] = [{ kind: "step" }];
    expect(poseOf(step(ops, { ...START, facing: 1 }))).toEqual({ x: 5, y: 4, facing: 1 });
    expect(poseOf(step(ops, { ...START, facing: 2 }))).toEqual({ x: 4, y: 5, facing: 2 });
    expect(poseOf(step(ops, { ...START, facing: 3 }))).toEqual({ x: 3, y: 4, facing: 3 });
  });

  it("turns clockwise and wraps through north", () => {
    const ops: readonly Op[] = [{ kind: "turn", quarters: 1 }];
    expect(step(ops, { ...START, facing: 3 }).facing).toBe(0);
  });

  it("turns anticlockwise on a negative quarter", () => {
    expect(step([{ kind: "turn", quarters: -1 }], START).facing).toBe(3);
  });

  it("idles without moving but still spends a tick", () => {
    const after = step([{ kind: "idle" }], START);
    expect(poseOf(after)).toEqual(poseOf(START));
    expect(after.pc).toBe(1);
  });

  it("advances the program counter by exactly one op", () => {
    expect(step([{ kind: "step" }, { kind: "step" }], START).pc).toBe(1);
  });

  it("is a no-op past the end, so a caller cannot run off the list", () => {
    const done: MachineState = { ...START, pc: 1 };
    expect(step([{ kind: "step" }], done)).toEqual(done);
    expect(atEnd([{ kind: "step" }], done)).toBe(true);
  });

  it("never mutates the state it is given", () => {
    const before = { ...START };
    step([{ kind: "step" }], START);
    expect(START).toEqual(before);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/code/interpret.test.ts`
Expected: FAIL — cannot resolve `./interpret`.

- [ ] **Step 3: Write the implementation**

Create `src/code/interpret.ts`:

```ts
/**
 * One op, one tick, one new state.
 *
 * A STEPPER AND NOT A `run`. Trace & Repair's whole instrument is a step scrubber the child drags
 * through execution, so the unit the runtime exposes has to be the single tick. `run` in `trace.ts`
 * is a thin loop over this; nothing in the app is allowed to have a private way of advancing a
 * program.
 *
 * PURE AND NON-MUTATING, so a trace can hold every intermediate state without any of them aliasing.
 * A scrubber that could scrub backwards over shared objects would be a bug factory.
 */
import type { Direction, Op } from "./program";

/** Where the machine is and what it is about to do. */
export interface MachineState {
  readonly x: number;
  readonly y: number;
  readonly facing: Direction;
  /** Index of the next op to apply. */
  readonly pc: number;
}

/** The visible part of a state: where the creature is and which way it points. */
export interface Pose {
  readonly x: number;
  readonly y: number;
  readonly facing: Direction;
}

export function poseOf(s: MachineState): Pose {
  return { x: s.x, y: s.y, facing: s.facing };
}

export function atEnd(ops: readonly Op[], s: MachineState): boolean {
  return s.pc >= ops.length;
}

/** Column and row deltas for each facing. North is negative y: the board's origin is top-left. */
const DX: readonly number[] = [0, 1, 0, -1];
const DY: readonly number[] = [-1, 0, 1, 0];

function rotate(facing: Direction, quarters: number): Direction {
  const q = (((facing + Math.trunc(quarters)) % 4) + 4) % 4;
  return q as Direction;
}

/**
 * Apply `ops[state.pc]`. Past the end this returns the state unchanged rather than throwing, so a
 * caller that over-steps stalls instead of crashing — which is what a scrubber dragged to the far
 * right does.
 */
export function step(ops: readonly Op[], state: MachineState): MachineState {
  if (atEnd(ops, state)) return state;
  const op = ops[state.pc]!;
  const pc = state.pc + 1;
  switch (op.kind) {
    case "step":
      return { x: state.x + DX[state.facing]!, y: state.y + DY[state.facing]!, facing: state.facing, pc };
    case "turn":
      return { x: state.x, y: state.y, facing: rotate(state.facing, op.quarters), pc };
    case "idle":
      return { x: state.x, y: state.y, facing: state.facing, pc };
  }
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/code/interpret.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/code/interpret.ts passion/apps/mvp-jul24/src/code/interpret.test.ts
git commit -m "feat(mvp-jul24): a pure one-tick stepper for the Code cabin"
```

---

### Task 3: `run` and the reported step cap

**Files:**
- Create: `passion/apps/mvp-jul24/src/code/trace.ts`
- Test: `passion/apps/mvp-jul24/src/code/trace.test.ts`

**Interfaces:**
- Consumes: `flatten`, `MAX_OPS`, `Program` from `./program`; `MachineState`, `step`, `atEnd` from `./interpret`.
- Produces: `Trace`, `run(program: Program, start: MachineState, maxOps?: number): Trace`.

- [ ] **Step 1: Write the failing test**

Create `src/code/trace.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { MachineState } from "./interpret";
import type { Program } from "./program";
import { run } from "./trace";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };

describe("run", () => {
  it("includes the start as the first frame, so a scrubber has something to show at tick zero", () => {
    const t = run([{ kind: "move", steps: 2 }], START);
    expect(t.frames).toHaveLength(3);
    expect(t.frames[0]).toEqual(START);
  });

  it("produces one frame per tick", () => {
    const t = run([{ kind: "move", steps: 1 }, { kind: "turn", quarters: 1 }], START);
    expect(t.frames.map((f) => [f.x, f.y, f.facing])).toEqual([
      [4, 4, 0],
      [4, 3, 0],
      [4, 3, 1],
    ]);
  });

  it("counts a wait as a tick that changes nothing", () => {
    const t = run([{ kind: "wait", ticks: 2 }], START);
    expect(t.frames).toHaveLength(3);
    expect(t.frames[2]).toEqual({ ...START, pc: 2 });
  });

  it("reports truncation rather than hanging or throwing", () => {
    const p: Program = [{ kind: "repeat", times: 5000, body: [{ kind: "move", steps: 1 }] }];
    const t = run(p, START, 32);
    expect(t.truncated).toBe(true);
    expect(t.frames).toHaveLength(33);
  });

  it("is not truncated for an ordinary program", () => {
    expect(run([{ kind: "move", steps: 4 }], START).truncated).toBe(false);
  });

  it("returns a single frame for an empty program", () => {
    expect(run([], START)).toEqual({ frames: [START], truncated: false });
  });

  it("is deterministic: the same program and start give the same frames", () => {
    const p: Program = [{ kind: "repeat", times: 3, body: [{ kind: "move", steps: 2 }, { kind: "turn", quarters: 1 }] }];
    expect(run(p, START)).toEqual(run(p, START));
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/code/trace.test.ts`
Expected: FAIL — cannot resolve `./trace`.

- [ ] **Step 3: Write the implementation**

Create `src/code/trace.ts`:

```ts
/**
 * A whole run, as the sequence of states it passed through.
 *
 * WHY TRUNCATION IS A REPORTED OUTCOME AND NOT AN ERROR. A program that runs longer than the room is
 * willing to wait is a real thing that happens in this domain, and the honest thing to tell a child
 * is "it never stopped" — which is a fact about their program, and a genuine lesson. Throwing would
 * turn it into a crash, and silently capping would turn it into a wrong answer with no explanation.
 * So `truncated` rides along on the result and the surface decides how to say it.
 *
 * `frames[0]` is the start state, before any op. So `frames.length` is ticks + 1, and a scrubber's
 * leftmost position is a real frame rather than a special case.
 */
import { type MachineState, atEnd, step } from "./interpret";
import { MAX_OPS, type Program, flatten } from "./program";

export interface Trace {
  /** One state per tick, starting with the un-executed start state. */
  readonly frames: readonly MachineState[];
  /** True when the op cap was hit — either flattening or ticking. */
  readonly truncated: boolean;
}

export function run(program: Program, start: MachineState, maxOps: number = MAX_OPS): Trace {
  const { ops, truncated } = flatten(program, maxOps);
  const frames: MachineState[] = [start];
  let cur = start;
  while (!atEnd(ops, cur)) {
    cur = step(ops, cur);
    frames.push(cur);
  }
  return { frames, truncated };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/code/trace.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/code/trace.ts passion/apps/mvp-jul24/src/code/trace.test.ts
git commit -m "feat(mvp-jul24): traces with a reported step cap, not a thrown one"
```

---

### Task 4: Sprite Loop's domain logic

**Files:**
- Create: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/logic.ts`
- Test: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/logic.test.ts`

**Interfaces:**
- Consumes: `Program`, `Statement` from `../../code/program`; `MachineState`, `Pose`, `poseOf` from `../../code/interpret`; `run` from `../../code/trace`.
- Produces: `GRID`, `TrayBlock`, `SpriteLoopPuzzle`, `poseSequence(program, start, maxOps?): readonly Pose[]`, `isSolved(puzzle, attempt): boolean`, `trailOf(poses): ReadonlySet<string>`, `cellKey(x, y): string`, `inBounds(pose): boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/puzzles/SpriteLoop/logic.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { MachineState } from "../../code/interpret";
import type { Program } from "../../code/program";
import { type SpriteLoopPuzzle, inBounds, isSolved, poseSequence, trailOf } from "./logic";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };

const puzzleFor = (target: Program): SpriteLoopPuzzle => ({
  start: START,
  target,
  tray: [
    { kind: "move", steps: 1 },
    { kind: "turn", quarters: 1 },
    { kind: "wait", ticks: 1 },
  ],
});

describe("poseSequence", () => {
  it("is one pose per tick including the start", () => {
    expect(poseSequence([{ kind: "move", steps: 2 }], START)).toEqual([
      { x: 4, y: 4, facing: 0 },
      { x: 4, y: 3, facing: 0 },
      { x: 4, y: 2, facing: 0 },
    ]);
  });
});

describe("isSolved", () => {
  it("accepts an identical program", () => {
    const target: Program = [{ kind: "move", steps: 2 }, { kind: "turn", quarters: 1 }];
    expect(isSolved(puzzleFor(target), target)).toBe(true);
  });

  it("accepts a different program with the same pose sequence", () => {
    // `move 2` and two `move 1`s flatten to the same ops, so both are right. The room asks for a
    // behaviour, never for one specific spelling of it.
    const target: Program = [{ kind: "move", steps: 2 }];
    const attempt: Program = [{ kind: "move", steps: 1 }, { kind: "move", steps: 1 }];
    expect(isSolved(puzzleFor(target), attempt)).toBe(true);
  });

  it("rejects the same path walked at a different speed — rule X1", () => {
    const target: Program = [{ kind: "move", steps: 1 }, { kind: "wait", ticks: 1 }, { kind: "move", steps: 1 }];
    const attempt: Program = [{ kind: "move", steps: 2 }];
    expect(isSolved(puzzleFor(target), attempt)).toBe(false);
  });

  it("rejects a program that ends facing elsewhere, since facing is on screen", () => {
    const target: Program = [{ kind: "move", steps: 1 }, { kind: "turn", quarters: 1 }];
    const attempt: Program = [{ kind: "move", steps: 1 }, { kind: "turn", quarters: -1 }];
    expect(isSolved(puzzleFor(target), attempt)).toBe(false);
  });

  it("rejects a program of a different length", () => {
    expect(isSolved(puzzleFor([{ kind: "move", steps: 2 }]), [{ kind: "move", steps: 1 }])).toBe(false);
  });

  it("rejects an empty attempt", () => {
    expect(isSolved(puzzleFor([{ kind: "move", steps: 1 }]), [])).toBe(false);
  });
});

describe("trailOf", () => {
  it("collapses timing away — which is exactly why it is not the solve criterion", () => {
    const slow = poseSequence([{ kind: "move", steps: 1 }, { kind: "wait", ticks: 3 }, { kind: "move", steps: 1 }], START);
    const fast = poseSequence([{ kind: "move", steps: 2 }], START);
    expect(trailOf(slow)).toEqual(trailOf(fast));
    expect(slow).not.toEqual(fast);
  });
});

describe("inBounds", () => {
  it("accepts the middle and rejects off-board", () => {
    expect(inBounds({ x: 0, y: 0, facing: 0 })).toBe(true);
    expect(inBounds({ x: -1, y: 4, facing: 0 })).toBe(false);
    expect(inBounds({ x: 4, y: 9, facing: 0 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/SpriteLoop/logic.test.ts`
Expected: FAIL — cannot resolve `./logic`.

- [ ] **Step 3: Write the implementation**

Create `src/puzzles/SpriteLoop/logic.ts`:

```ts
/**
 * Sprite Loop — build a behaviour that matches a demonstrated one.
 *
 * NO MAZE, NO OBSTACLES, NO GOAL TILE, AND THAT IS THE DESIGN. "Reach the goal past the obstacles"
 * is constraint satisfaction, which this app already measures four times in `logic-games`; shipping
 * it here would report programming interest for a child who likes deduction. The board is empty and
 * the target is *motion*.
 *
 * THE SOLVE CRITERION IS THE POSE SEQUENCE, NEVER THE TRAIL (rules X1 and X2)
 * ------------------------------------------------------------------------------------------------
 * A pose per tick, compared in order. Two consequences, both intended:
 *
 *  - **Different spellings of the same behaviour are both right.** `move 2` and two `move 1`s are
 *    the same program once flattened. The room asks for a behaviour, not for one phrasing of it.
 *  - **The same path at a different speed is wrong.** That is the whole reason `wait` exists and the
 *    reason a tick is one atomic op. `trailOf` below throws timing away, and the generator's hardest
 *    tier is authored so that two tray programs share a trail and differ in trace — so a child who
 *    matched the drawn shape would have no way to choose between them. `naive.ts` proves it.
 *
 * `trailOf` is therefore NOT a fallback solve check and must never be used as one. It exists to make
 * the weaker criterion measurable, so a test can assert that it is weaker.
 *
 * WHY FACING IS COMPARED. The creature is drawn pointing somewhere, so its facing is on screen. A
 * criterion that ignored it would accept a program the child can see is wrong, which teaches that
 * the room is not reading what it displays.
 */
import { type MachineState, type Pose, poseOf } from "../../code/interpret";
import { MAX_OPS, type Program } from "../../code/program";
import { run } from "../../code/trace";

/** The board is 9x9 and has no walls. Generated targets are guaranteed to stay on it. */
export const GRID = 9;

/** A block the child may take from the tray. `repeat` arrives with an empty body. */
export type TrayBlock =
  | { readonly kind: "move"; readonly steps: number }
  | { readonly kind: "turn"; readonly quarters: number }
  | { readonly kind: "wait"; readonly ticks: number }
  | { readonly kind: "repeat"; readonly times: number };

export interface SpriteLoopPuzzle {
  readonly start: MachineState;
  /**
   * The ghost's program. **Never rendered as code** — the child sees it only as motion, which is
   * rule X2. Nothing in the component may print it.
   */
  readonly target: Program;
  /** Which blocks this round offers. Bounding the tray is what makes `naive.ts` able to enumerate. */
  readonly tray: readonly TrayBlock[];
}

export function poseSequence(program: Program, start: MachineState, maxOps: number = MAX_OPS): readonly Pose[] {
  return run(program, start, maxOps).frames.map(poseOf);
}

export function isSolved(puzzle: SpriteLoopPuzzle, attempt: Program): boolean {
  const want = poseSequence(puzzle.target, puzzle.start);
  const got = poseSequence(attempt, puzzle.start);
  if (got.length !== want.length) return false;
  return want.every((p, i) => p.x === got[i]!.x && p.y === got[i]!.y && p.facing === got[i]!.facing);
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * The set of cells a run visits, with order and timing discarded.
 *
 * This is the criterion a child would be using if the demo left a drawn path behind it, and the
 * reason the demo does not. Used by tests and by nothing else.
 */
export function trailOf(poses: readonly Pose[]): ReadonlySet<string> {
  return new Set(poses.map((p) => cellKey(p.x, p.y)));
}

export function inBounds(p: Pose): boolean {
  return p.x >= 0 && p.x < GRID && p.y >= 0 && p.y < GRID;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/SpriteLoop/logic.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/puzzles/SpriteLoop/logic.ts passion/apps/mvp-jul24/src/puzzles/SpriteLoop/logic.test.ts
git commit -m "feat(mvp-jul24): Sprite Loop solves on the pose sequence, never the trail"
```

---

### Task 5: The reference solver

**Files:**
- Create: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/naive.ts`
- Test: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/naive.test.ts`

**Interfaces:**
- Consumes: `SpriteLoopPuzzle`, `poseSequence`, `trailOf`, `isSolved` from `./logic`; `Program`, `Statement` from `../../code/program`.
- Produces: `enumeratePrograms(tray, maxLength): readonly Program[]`, `solutionsByPose(puzzle, maxLength): readonly Program[]`, `solutionsByTrail(puzzle, maxLength): readonly Program[]`.

- [ ] **Step 1: Write the failing test**

Create `src/puzzles/SpriteLoop/naive.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { MachineState } from "../../code/interpret";
import type { Program } from "../../code/program";
import type { SpriteLoopPuzzle, TrayBlock } from "./logic";
import { enumeratePrograms, solutionsByPose, solutionsByTrail } from "./naive";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };
const TRAY: readonly TrayBlock[] = [
  { kind: "move", steps: 1 },
  { kind: "turn", quarters: 1 },
  { kind: "wait", ticks: 1 },
];

describe("enumeratePrograms", () => {
  it("counts tray^length summed over lengths 1..maxLength", () => {
    // 3 blocks: 3 programs of length 1, 9 of length 2 => 12.
    expect(enumeratePrograms(TRAY, 2)).toHaveLength(12);
  });
});

describe("solutionsByPose", () => {
  it("finds the target itself", () => {
    const target: Program = [{ kind: "move", steps: 1 }, { kind: "turn", quarters: 1 }];
    const puzzle: SpriteLoopPuzzle = { start: START, target, tray: TRAY };
    const found = solutionsByPose(puzzle, 2);
    expect(found).toHaveLength(1);
    expect(found[0]).toEqual(target);
  });
});

describe("matching the trail is strictly weaker than matching the trace", () => {
  it("admits more programs when timing is discarded", () => {
    // `move 1, wait 1` visits the same cells as `move 1, move 1`? No — so use a target whose trail
    // is reachable two ways: one step then a pause, versus one step then a turn in place.
    const target: Program = [{ kind: "move", steps: 1 }, { kind: "wait", ticks: 1 }];
    const puzzle: SpriteLoopPuzzle = { start: START, target, tray: TRAY };
    const byPose = solutionsByPose(puzzle, 2);
    const byTrail = solutionsByTrail(puzzle, 2);
    expect(byPose).toHaveLength(1);
    expect(byTrail.length).toBeGreaterThan(byPose.length);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/SpriteLoop/naive.test.ts`
Expected: FAIL — cannot resolve `./naive`.

- [ ] **Step 3: Write the implementation**

Create `src/puzzles/SpriteLoop/naive.ts`:

```ts
/**
 * The reference solver. Slow, obvious, and the thing the generator is checked against.
 *
 * TWO SOLVERS, ON PURPOSE. `solutionsByPose` uses the real criterion. `solutionsByTrail` uses the
 * weaker one a child would be using if the demo left a drawn path behind it. Comparing their sizes
 * is how rule X1 becomes a test rather than an intention: if a round has one pose-solution and
 * several trail-solutions, then matching the shape is provably not enough to answer it, and the
 * child has to attend to execution.
 *
 * This mirrors the lesson the music room paid for. Tune Repair shipped with a test asserting it was
 * "fully solvable in silence", read at the time as proof the accessibility requirement was met; it
 * was proof the audio was decoration. Inverting that assertion into a guard is the cheapest
 * protection available, so `generate.test.ts` asserts the inequality for the timing tier.
 *
 * Enumeration is exponential in `maxLength` and that is fine — the trays are three or four blocks
 * and `maxLength` is single digits, and this runs only in tests.
 *
 * `repeat` blocks are deliberately NOT enumerated: a repeat is sugar for its unrolled body, so any
 * behaviour reachable with one is reachable without it at greater length. Enumerating both would
 * multiply the search for no new behaviours.
 */
import type { Program, Statement } from "../../code/program";
import { type SpriteLoopPuzzle, type TrayBlock, isSolved, poseSequence, trailOf } from "./logic";

function asStatement(b: TrayBlock): Statement | null {
  switch (b.kind) {
    case "move":
      return { kind: "move", steps: b.steps };
    case "turn":
      return { kind: "turn", quarters: b.quarters };
    case "wait":
      return { kind: "wait", ticks: b.ticks };
    case "repeat":
      return null;
  }
}

/** Every program of length 1..maxLength drawable from the tray, repeats excluded. */
export function enumeratePrograms(tray: readonly TrayBlock[], maxLength: number): readonly Program[] {
  const atoms = tray.map(asStatement).filter((s): s is Statement => s !== null);
  const out: Program[] = [];
  let frontier: Program[] = [[]];
  for (let len = 1; len <= maxLength; len++) {
    const next: Program[] = [];
    for (const prefix of frontier) {
      for (const a of atoms) {
        const p = [...prefix, a];
        next.push(p);
        out.push(p);
      }
    }
    frontier = next;
  }
  return out;
}

export function solutionsByPose(puzzle: SpriteLoopPuzzle, maxLength: number): readonly Program[] {
  return enumeratePrograms(puzzle.tray, maxLength).filter((p) => isSolved(puzzle, p));
}

/** The weaker criterion: same cells visited, timing and order discarded. Never a solve check. */
export function solutionsByTrail(puzzle: SpriteLoopPuzzle, maxLength: number): readonly Program[] {
  const want = trailOf(poseSequence(puzzle.target, puzzle.start));
  const same = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean =>
    a.size === b.size && [...a].every((k) => b.has(k));
  return enumeratePrograms(puzzle.tray, maxLength).filter((p) =>
    same(want, trailOf(poseSequence(p, puzzle.start))),
  );
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/SpriteLoop/naive.test.ts`
Expected: PASS, 3 tests. If the third test's inequality does not hold for that particular target, change the target to `[{kind:"move",steps:1},{kind:"turn",quarters:1},{kind:"wait",ticks:1}]` with `maxLength` 3 and re-run — the assertion to keep is `byTrail.length > byPose.length`, not the specific round.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/puzzles/SpriteLoop/naive.ts passion/apps/mvp-jul24/src/puzzles/SpriteLoop/naive.test.ts
git commit -m "feat(mvp-jul24): a reference solver that measures trail-matching against trace-matching"
```

---

### Task 6: The generator, and the X1 guard

**Files:**
- Create: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/generate.ts`
- Test: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/generate.test.ts`

**Interfaces:**
- Consumes: `mulberry32` from `../../lib/rng`; `SpriteLoopPuzzle`, `TrayBlock`, `GRID`, `inBounds`, `poseSequence` from `./logic`; `Program`, `Statement` from `../../code/program`.
- Produces: `TIERS`, `START_POSE`, `generateForRound(seed: number, index: number): SpriteLoopPuzzle`, `tierForIndex(index: number): number`.

- [ ] **Step 1: Write the failing test**

Create `src/puzzles/SpriteLoop/generate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { poseSequence, inBounds } from "./logic";
import { solutionsByPose, solutionsByTrail } from "./naive";
import { TIERS, generateForRound } from "./generate";

const SEEDS = [1, 2, 3, 7, 11, 42, 99, 1234];

describe("generateForRound", () => {
  it("is deterministic in seed and index", () => {
    expect(generateForRound(7, 0)).toEqual(generateForRound(7, 0));
  });

  it("varies with the seed", () => {
    const a = generateForRound(1, 0);
    const b = generateForRound(2, 0);
    expect(a.target).not.toEqual(b.target);
  });

  it("keeps every target on the board, for every seed and tier", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < TIERS.length; index++) {
        const p = generateForRound(seed, index);
        for (const pose of poseSequence(p.target, p.start)) {
          expect(inBounds(pose)).toBe(true);
        }
      }
    }
  });

  it("never generates an empty target", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < TIERS.length; index++) {
        expect(generateForRound(seed, index).target.length).toBeGreaterThan(0);
      }
    }
  });

  it("offers a tray that can express the target", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < TIERS.length; index++) {
        const p = generateForRound(seed, index);
        const kinds = new Set(p.tray.map((b) => b.kind));
        for (const s of p.target) expect(kinds.has(s.kind)).toBe(true);
      }
    }
  });
});

/**
 * THE X1 GUARD. See naive.ts for why this assertion is the one that matters, and the music room's
 * "fully solvable in silence" test for what happens when it is written the other way round.
 */
describe("the hardest tier cannot be answered by matching the drawn path", () => {
  it("admits strictly more trail-solutions than pose-solutions", () => {
    const index = TIERS.length - 1;
    let sawStrictlyMore = false;
    for (const seed of SEEDS) {
      const p = generateForRound(seed, index);
      const byPose = solutionsByPose(p, 3);
      const byTrail = solutionsByTrail(p, 3);
      expect(byTrail.length).toBeGreaterThanOrEqual(byPose.length);
      if (byTrail.length > byPose.length) sawStrictlyMore = true;
    }
    expect(sawStrictlyMore).toBe(true);
  });

  it("uses wait on the hardest tier, which is what makes timing matter", () => {
    const index = TIERS.length - 1;
    const anyWait = SEEDS.some((seed) =>
      generateForRound(seed, index).target.some((s) => s.kind === "wait"),
    );
    expect(anyWait).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/SpriteLoop/generate.test.ts`
Expected: FAIL — cannot resolve `./generate`.

- [ ] **Step 3: Write the implementation**

Create `src/puzzles/SpriteLoop/generate.ts`:

```ts
/**
 * Rounds for Sprite Loop.
 *
 * THREE TIERS, AND THE THIRD IS WHERE THE RULE LIVES. Tier 0 is a short walk-and-turn. Tier 1 is
 * longer and may double back. Tier 2 **always spends `wait`**, because a pause is the one thing a
 * drawn path cannot show: two programs that visit the same cells at different speeds look identical
 * as a shape and different as a run. `generate.test.ts` asserts that, and if a future edit makes the
 * hardest tier answerable by shape the suite fails rather than the design quietly rotting.
 *
 * EVERY TARGET IS GUARANTEED ON THE BOARD, by rejection: a candidate that would walk off the 9x9 is
 * discarded and redrawn. That is why the board needs no wall rule — a wall would be a hidden
 * mechanic the child was never told about, and "the creature stopped and I don't know why" is the
 * worst thing this room could teach.
 *
 * TIER CYCLES WITHIN A MOUNT, and the caller clamps for the overlay. `tierForIndex` wraps so a
 * session's rounds do not end on the hardest one; `openTier` in `../openTier.ts` is what the
 * overlay's "Try a harder one" counter must go through. This puzzle does not set
 * `Gadget.supportsTier` in PR 1 because it is not registered yet.
 */
import { type MachineState } from "../../code/interpret";
import type { Program, Statement } from "../../code/program";
import { type Rng, mulberry32 } from "../../lib/rng";
import { GRID, type SpriteLoopPuzzle, type TrayBlock, inBounds, poseSequence } from "./logic";

/** Middle of the board, facing north. Same start every round, so only the motion differs. */
export const START_POSE: MachineState = {
  x: Math.floor(GRID / 2),
  y: Math.floor(GRID / 2),
  facing: 0,
  pc: 0,
};

interface Tier {
  /** How many statements the target holds. */
  readonly length: number;
  /** Whether the target must spend a `wait`. Tier 2's whole point. */
  readonly requiresWait: boolean;
  readonly tray: readonly TrayBlock[];
}

export const TIERS: readonly Tier[] = [
  {
    length: 2,
    requiresWait: false,
    tray: [
      { kind: "move", steps: 1 },
      { kind: "move", steps: 2 },
      { kind: "turn", quarters: 1 },
    ],
  },
  {
    length: 3,
    requiresWait: false,
    tray: [
      { kind: "move", steps: 1 },
      { kind: "move", steps: 2 },
      { kind: "turn", quarters: 1 },
      { kind: "turn", quarters: -1 },
    ],
  },
  {
    length: 3,
    requiresWait: true,
    tray: [
      { kind: "move", steps: 1 },
      { kind: "turn", quarters: 1 },
      { kind: "wait", ticks: 1 },
    ],
  },
];

/** Wraps, so a run of rounds never ends on the hardest. See the file comment. */
export function tierForIndex(index: number): number {
  const n = TIERS.length;
  return ((Math.trunc(index) % n) + n) % n;
}

function pick<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

function statementFor(b: TrayBlock): Statement {
  switch (b.kind) {
    case "move":
      return { kind: "move", steps: b.steps };
    case "turn":
      return { kind: "turn", quarters: b.quarters };
    case "wait":
      return { kind: "wait", ticks: b.ticks };
    case "repeat":
      return { kind: "repeat", times: b.times, body: [] };
  }
}

function draw(rng: Rng, tier: Tier): Program {
  const out: Statement[] = [];
  for (let i = 0; i < tier.length; i++) out.push(statementFor(pick(rng, tier.tray)));
  if (tier.requiresWait && !out.some((s) => s.kind === "wait")) {
    const waits = tier.tray.filter((b) => b.kind === "wait");
    out[Math.floor(rng() * out.length)] = statementFor(pick(rng, waits));
  }
  return out;
}

export function generateForRound(seed: number, index: number): SpriteLoopPuzzle {
  const tier = TIERS[tierForIndex(index)]!;
  const rng = mulberry32(seed * 1013 + index * 7919);
  for (let attempt = 0; attempt < 200; attempt++) {
    const target = draw(rng, tier);
    if (target.length === 0) continue;
    const poses = poseSequence(target, START_POSE);
    if (!poses.every(inBounds)) continue;
    // A target that never leaves its cell is a round with nothing to watch.
    if (poses.every((p) => p.x === START_POSE.x && p.y === START_POSE.y)) continue;
    return { start: START_POSE, target, tray: tier.tray };
  }
  // Unreachable in practice — 200 rejections on a 9x9 with 3-statement targets. A short, in-bounds,
  // visibly-moving fallback rather than a throw, because a round is not worth crashing a room over.
  return {
    start: START_POSE,
    target: [{ kind: "move", steps: 1 }, { kind: "turn", quarters: 1 }],
    tray: tier.tray,
  };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/SpriteLoop/generate.test.ts`
Expected: PASS, 7 tests.

If the X1 guard's `sawStrictlyMore` is false, the tier-2 tray is not producing distinguishable pairs. Fix it by **widening the tray, not by weakening the test**: add `{ kind: "move", steps: 2 }` to tier 2's tray so a `move 1, wait 1, move 1` target has a same-trail rival in `move 2`. Re-run.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/puzzles/SpriteLoop/generate.ts passion/apps/mvp-jul24/src/puzzles/SpriteLoop/generate.test.ts
git commit -m "feat(mvp-jul24): Sprite Loop rounds, with the hardest tier guarded against shape-matching"
```

---

### Task 7: The component

**Files:**
- Create: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/SpriteLoop.tsx`
- Create: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/SpriteLoop.css`
- Test: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/SpriteLoop.test.tsx`

**Interfaces:**
- Consumes: `PuzzleProps` from `../../game/types`; `TeachIn` from `../../teachin/TeachIn`; `openTier` from `../openTier`; `TIERS`, `generateForRound` from `./generate`; `isSolved`, `poseSequence`, `GRID` from `./logic`; `Program`, `Statement` from `../../code/program`.
- Produces: default export `SpriteLoop: ComponentType<PuzzleProps>`.

**Requirements this component must meet, from spec §2.1:**

1. The demo is a **continuously looping ghost** and leaves **no persistent trail** (X2). Nothing may draw the path.
2. The target program is **never printed as code**.
3. The tray shows **every** available block, always.
4. `repeat` renders as a **visible bracket enclosing its body**, so nesting is a shape rather than a syntax.
5. An illegal drop reads as **unavailable**, never silently absent.
6. Holding a block **ghosts where the creature would go** before it is committed.
7. No score, points, stars, streak, timer, or attempt count.
8. Operable by click alone — no drag required.

- [ ] **Step 1: Write the failing test**

Create `src/puzzles/SpriteLoop/SpriteLoop.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SpriteLoop from "./SpriteLoop";
import { generateForRound } from "./generate";

const renderPuzzle = (seed = 7, tier = 0) =>
  render(<SpriteLoop seed={seed} tier={tier} onSolved={vi.fn()} onExit={vi.fn()} />);

describe("SpriteLoop", () => {
  it("offers every block in the round's tray", () => {
    renderPuzzle();
    const tray = screen.getByRole("group", { name: /blocks you can use/i });
    const puzzle = generateForRound(7, 0);
    expect(within(tray).getAllByRole("button")).toHaveLength(puzzle.tray.length);
  });

  it("adds a block to the stack on a click, so no drag is required", async () => {
    const user = userEvent.setup();
    renderPuzzle();
    const tray = screen.getByRole("group", { name: /blocks you can use/i });
    await user.click(within(tray).getAllByRole("button")[0]!);
    const stack = screen.getByRole("list", { name: /your program/i });
    expect(within(stack).getAllByRole("listitem")).toHaveLength(1);
  });

  it("never draws a path for the demonstration — rule X2", () => {
    const { container } = renderPuzzle();
    expect(container.querySelector(".sprite-loop-trail")).toBeNull();
  });

  it("never prints the target as code", () => {
    renderPuzzle();
    expect(screen.queryByTestId("sprite-loop-target-code")).toBeNull();
  });

  it("reports a solve exactly once when the program matches", async () => {
    const user = userEvent.setup();
    const onSolved = vi.fn();
    const puzzle = generateForRound(7, 0);
    render(<SpriteLoop seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    const tray = screen.getByRole("group", { name: /blocks you can use/i });
    const buttons = within(tray).getAllByRole("button");
    // Click the tray button matching each statement of the target, in order.
    for (const s of puzzle.target) {
      const i = puzzle.tray.findIndex(
        (b) =>
          b.kind === s.kind &&
          (s.kind === "move" ? b.kind === "move" && b.steps === s.steps : true) &&
          (s.kind === "turn" ? b.kind === "turn" && b.quarters === s.quarters : true) &&
          (s.kind === "wait" ? b.kind === "wait" && b.ticks === s.ticks : true),
      );
      await user.click(buttons[i]!);
    }
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("shows no score, streak, timer or attempt count", () => {
    const { container } = renderPuzzle();
    expect(container.textContent ?? "").not.toMatch(/score|point|streak|star|timer|attempt/i);
  });

  it("lets a block be removed, so a mistake is not a dead end", async () => {
    const user = userEvent.setup();
    renderPuzzle();
    const tray = screen.getByRole("group", { name: /blocks you can use/i });
    await user.click(within(tray).getAllByRole("button")[0]!);
    const stack = screen.getByRole("list", { name: /your program/i });
    await user.click(within(stack).getByRole("button", { name: /remove/i }));
    expect(within(stack).queryAllByRole("listitem")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/SpriteLoop/SpriteLoop.test.tsx`
Expected: FAIL — cannot resolve `./SpriteLoop`.

- [ ] **Step 3: Write the implementation**

Read `src/puzzles/Downbeat/Downbeat.tsx` first for the house component style — the file-head comment naming what is deliberately absent, `openTier` usage, and the `TeachIn` mount.

Create `src/puzzles/SpriteLoop/SpriteLoop.tsx` meeting all eight requirements above. Structure it as:

```tsx
/**
 * Sprite Loop — build a behaviour that matches the one being demonstrated.
 *
 * THE DEMONSTRATION LEAVES NO TRAIL, AND THAT IS THE WHOLE DESIGN (rule X2)
 * ------------------------------------------------------------------------------------------------
 * The ghost loops forever and draws nothing behind it. Drawing its path is the easier build and it
 * would convert this activity into "match this shape", which is a visual pattern task the app
 * already measures in `logic-games`. There is no `.sprite-loop-trail` class and a test asserts there
 * never is one.
 *
 * WHAT IS DELIBERATELY ABSENT
 *  - **No score, points, stars, streak, timer or attempt count** (PRD §11).
 *  - **No printed target program.** The child sees motion, never code.
 *  - **No obstacles and no goal tile.** An empty board, because a maze would be Pipes.
 *  - **No "your third block is wrong."** Running shows what the program does; it does not mark it.
 *
 * DISCOVERABILITY IS IN THE AFFORDANCES, NOT IN THE TEACH-IN. The standing ruling is that a child
 * who cannot find a mechanic needs the affordance fixed, and that copy is not a sufficient fix. So:
 * the tray always shows every block; `repeat` draws as a bracket around its body so nesting is a
 * shape; an unavailable action is drawn disabled rather than removed, because a missing control and
 * a visibly-disabled one teach different things; and holding a block ghosts where the creature would
 * go, so the mechanic is met as a consequence before it is committed.
 */
import { useCallback, useMemo, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import { openTier } from "../openTier";
import "./SpriteLoop.css";
import { TIERS, generateForRound } from "./generate";
import { GRID, isSolved, poseSequence } from "./logic";
```

Then, in this order:

1. **State:** `roundIndex`, `program: Statement[]`, `phase: "editing" | "running" | "solved"`, `hoveredBlock: TrayBlock | null`.
2. **Derived:** `puzzle = useMemo(() => generateForRound(seed, roundIndex), [seed, roundIndex])`; open at `openTier(tier ?? 0, TIERS.length)` for the first round index.
3. **The board:** a `GRID`×`GRID` CSS grid. Render the ghost at its current demo pose (animated by a `requestAnimationFrame` or `setInterval` loop over `poseSequence(puzzle.target, puzzle.start)`, looping), and the child's creature at its current pose while running. **No trail element.**
4. **The ghost preview (requirement 6):** when `hoveredBlock` is set, compute `poseSequence([...program, statementFor(hoveredBlock)], puzzle.start)` and render the resulting final pose as a translucent marker.
5. **The tray (requirement 3):** `<div role="group" aria-label="Blocks you can use">` with one `<button>` per `puzzle.tray` entry, each labelled in words plus its numeral (e.g. "move 2"). `onMouseEnter`/`onFocus` set `hoveredBlock`; `onClick` appends.
6. **The stack (requirements 4, 8):** `<ol role="list" aria-label="Your program">` with one `<li>` per statement, each carrying a "Remove" button. A `repeat` statement renders its body inside a visible bracket element.
7. **Run:** a button that steps the child's program frame by frame, then on completion calls `isSolved(puzzle, program)`; on true, set `phase: "solved"` and call `onSolved()` **once**.
8. **After a solve:** a "Next" control advancing `roundIndex`, and `onExit` wired to a "Leave" control. No count of solves.
9. **`<TeachIn id="sprite-loop" />`** mounted the way `Downbeat.tsx` mounts it.

Create `SpriteLoop.css` alongside, using `@gt100k/design-tokens` custom properties — a CSS-token gate landed in #236 and will fail CI on a custom property that does not exist. Check `src/theme.css` for the names in use.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/SpriteLoop/SpriteLoop.test.tsx`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/puzzles/SpriteLoop/SpriteLoop.tsx passion/apps/mvp-jul24/src/puzzles/SpriteLoop/SpriteLoop.css passion/apps/mvp-jul24/src/puzzles/SpriteLoop/SpriteLoop.test.tsx
git commit -m "feat(mvp-jul24): the Sprite Loop board, tray and stack"
```

---

### Task 8: The teach-in

**Files:**
- Modify: `passion/apps/mvp-jul24/src/teachin/rules.tsx`
- Modify: `passion/apps/mvp-jul24/src/teachin/diagrams.tsx`
- Test: `passion/apps/mvp-jul24/src/teachin/mounted.test.tsx` (add a row)

**Interfaces:**
- Consumes: the `ActivityTeachIn` shape already in `rules.tsx`.
- Produces: `SpriteLoopDiagram` in `diagrams.tsx`; a `"sprite-loop"` key in `TEACH_INS`, which widens `TeachInId`.

- [ ] **Step 1: Read the existing pattern**

Read `src/teachin/rules.tsx` around the music block (the `tune-repair` / `chord-fit` / `downbeat` entries) and one existing diagram in `src/teachin/diagrams.tsx` — e.g. `DownbeatDiagram`. Diagrams are **inline SVG**; offline is a hard requirement and there are no image files.

- [ ] **Step 2: Add the diagram**

In `diagrams.tsx`, add `SpriteLoopDiagram`: a small inline SVG showing two creatures side by side on an empty grid, one labelled as the one to copy, with **no path drawn between cells** — the diagram must not teach the thing rule X2 forbids. Follow the surrounding diagrams' `viewBox` and stroke conventions exactly.

- [ ] **Step 3: Add the rule entry**

In `rules.tsx`, import `SpriteLoopDiagram` alongside the existing diagram imports and add, in a new `// --- code ---` section after the music block:

```tsx
  "sprite-loop": {
    title: "Sprite Loop",
    // Says WATCH IT MOVE, and says the timing counts, because neither is visible in a still frame
    // and the board deliberately draws no path. A child could otherwise reasonably assume the job
    // was to match a shape, which is the one reading rule X2 exists to prevent.
    rule: "One creature is moving in a pattern, over and over. Build your own out of blocks so it moves the same way — the same places, in the same order, at the same speed. Press run to watch yours try.",
    Diagram: SpriteLoopDiagram,
  },
```

- [ ] **Step 4: Add the mounted-test row**

In `mounted.test.tsx`, import `SpriteLoop` and add `["sprite-loop", SpriteLoop]` to the table alongside the existing entries.

- [ ] **Step 5: Run the teach-in tests**

Run: `cd passion/apps/mvp-jul24 && pnpm vitest run src/teachin`
Expected: PASS, including the new row.

- [ ] **Step 6: Commit**

```bash
git add passion/apps/mvp-jul24/src/teachin/rules.tsx passion/apps/mvp-jul24/src/teachin/diagrams.tsx passion/apps/mvp-jul24/src/teachin/mounted.test.tsx
git commit -m "feat(mvp-jul24): the Sprite Loop teach-in, which says the timing counts"
```

---

### Task 9: The dev harness

**Files:**
- Create: `passion/apps/mvp-jul24/src/puzzles/SpriteLoop/harness.tsx`
- Create: `passion/apps/mvp-jul24/sprite-loop.harness.html`

**Interfaces:**
- Consumes: `SpriteLoop` default export; `TIERS` from `./generate`.
- Produces: nothing importable. Dev-only; `vite`'s only build entry is `index.html`, so this adds zero bytes to `dist`.

- [ ] **Step 1: Copy the established harness shape**

Read `src/puzzles/Downbeat/harness.tsx` and `downbeat.harness.html`. Follow both exactly — the root-level `<name>.harness.html` pointing at `/src/puzzles/<Name>/harness.tsx` is the convention #215 established, and the math puzzles' older in-directory `harness.html` is the one being superseded.

- [ ] **Step 2: Write `harness.tsx`**

Mirror Downbeat's harness: a seed number input, a "next round" button, one button per tier from `TIERS`, and a solve counter — the counter is fine **here** because a harness is a developer tool, not a child surface, which is why Downbeat's has one.

```tsx
const LABELS = ["0 — short walk and turn", "1 — longer, may double back", "2 — timing matters"];
```

- [ ] **Step 3: Write `sprite-loop.harness.html`**

Copy `downbeat.harness.html`, changing the title to `Sprite Loop — harness` and the script `src` to `/src/puzzles/SpriteLoop/harness.tsx`.

- [ ] **Step 4: Check it actually runs in a browser**

Run: `cd passion/apps/mvp-jul24 && pnpm dev`
Open `http://localhost:5173/sprite-loop.harness.html`. Confirm by eye: the ghost loops, no path is drawn behind it, clicking tray blocks builds a stack, hovering a block previews where the creature would land, run animates the child's creature, and a correct program reports solved. **This step is not optional** — #224 exists because wiring that passed its tests did not work in a browser.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/puzzles/SpriteLoop/harness.tsx passion/apps/mvp-jul24/sprite-loop.harness.html
git commit -m "chore(mvp-jul24): a review harness for Sprite Loop"
```

---

### Task 10: Full verification

**Files:** none — this task changes nothing and only proves the rest.

- [ ] **Step 1: Typecheck**

Run: `cd passion/apps/mvp-jul24 && pnpm typecheck`
Expected: no output, exit 0.

- [ ] **Step 2: The app's whole suite**

Run: `cd passion/apps/mvp-jul24 && pnpm test`
Expected: all pass. Record the test count in the PR body; the repo tracks it (see #221, #225).

- [ ] **Step 3: Confirm nothing in PR 3's territory was touched**

Run:

```bash
git diff --stat origin/main... -- \
  passion/apps/mvp-jul24/src/gadgets/registry.ts \
  passion/apps/mvp-jul24/src/map/cabins.data.ts \
  passion/apps/mvp-jul24/src/cabin/backdrop/quads.data.ts \
  passion/apps/mvp-jul24/src/shelf/cards.data.ts
```

Expected: empty output. If anything appears, it belongs in PR 3 — revert it here.

- [ ] **Step 4: Confirm the runtime has no forbidden dependency**

Run: `grep -rn "fetch(\|new Audio\|import.meta.env" passion/apps/mvp-jul24/src/code passion/apps/mvp-jul24/src/puzzles/SpriteLoop`
Expected: no matches. Offline is a hard requirement and this door is silent.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin HEAD
gh pr create --draft --title "The Code cabin, part 1: a program runtime and Sprite Loop"
```

Body must state: what ships (runtime + one door, harness-only, not registered), the test count, and that the X1 guard in `generate.test.ts` is the assertion a reviewer should read first.

---

## Self-review notes

**Spec coverage.** §1.1 X1/X2 → Tasks 4, 5, 6 (guard) and 7 (requirements 1–2). §2.1 Sprite Loop → Tasks 4, 6, 7. §2.1 affordances → Task 7 requirements 3–6. §3 the runtime → Tasks 1–3, minus `set`/`if` which are deferred to PR 2 with the reason stated. §6 teach-in → Task 8. §7 per-door file pattern → Tasks 4–7 and 9. §7.1 X1 guard → Task 6. §8.1 PR 1 boundary → Task 10 step 3.

**Not covered here, by design:** the room, the art, the registry, the crosswalk rows, the shelf, and the other two doors. Those are PRs 2 and 3.

**One correction to the spec** this plan makes: §8.1 places teach-in in PR 3. It belongs with the puzzle, because #215 shipped three music teach-ins with no registry rows. Fix the spec's §8.1 when PR 2 is written.

**Known soft spots.** Task 5's third test and Task 6's X1 guard are the two assertions whose exact rounds may need tuning against real generator output; both carry an instruction to widen the tray rather than weaken the assertion. Task 7 is the largest task and the only one whose implementation is described structurally rather than given verbatim — it is a UI component with eight named requirements and a test per requirement, which is the honest way to specify it without inventing pixel decisions the browser step in Task 9 is there to settle.
