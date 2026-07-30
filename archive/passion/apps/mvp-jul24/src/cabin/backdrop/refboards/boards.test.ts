import { describe, expect, it } from "vitest";
import { isSolved as mirrorSolved, traceBeam } from "../../../puzzles/Mirror/logic";
import { isSolved as nonogramSolved } from "../../../puzzles/Nonogram/logic";
import { computePowered, isSolved as pipesSolved } from "../../../puzzles/Pipes/logic";
import {
  NONOGRAM_SIZE,
  PIPES_SIZE,
  REF_BOARD_IDS,
  buildRefBoard,
  describeRefBoard,
  isMidState,
} from "./boards";

/**
 * These boards are a **specification handed to another pipeline**: the art agent paints from the PNG
 * and then verifies the painted plate against the README's prose. So the properties worth asserting
 * are not "it renders" — that is the harness's job — but the ones a wrong reference would violate
 * silently:
 *   - determinism, or a re-export moves the target under a painting already in progress;
 *   - genuine mid-state, because a blank or solved board is the failure that looks fine in a thumbnail;
 *   - reachability, because a hand-nudged board would depict a position the puzzle cannot produce and
 *     make the whole description unverifiable;
 *   - and that the prose actually names the cells in the picture.
 */
describe("every reference board", () => {
  it("is deterministic — same board, every call", () => {
    for (const id of REF_BOARD_IDS) {
      expect(buildRefBoard(id), id).toEqual(buildRefBoard(id));
      expect(describeRefBoard(id), id).toBe(describeRefBoard(id));
    }
  });

  it("is tagged with the id it was asked for, and carries its seed", () => {
    for (const id of REF_BOARD_IDS) {
      const board = buildRefBoard(id);
      expect(board.id).toBe(id);
      expect(board.snapshot.kind).toBe(id);
      expect(Number.isInteger(board.seed), id).toBe(true);
    }
  });

  it("is a mid-state: started, and not finished", () => {
    for (const id of REF_BOARD_IDS) {
      expect(isMidState(buildRefBoard(id)), id).toBe(true);
    }
  });

  it("is unsolved according to the puzzle's own checker, not a local notion of done", () => {
    for (const id of REF_BOARD_IDS) {
      const { snapshot } = buildRefBoard(id);
      switch (snapshot.kind) {
        case "nonogram":
          expect(nonogramSolved(snapshot.grid, snapshot.puzzle), id).toBe(false);
          break;
        case "pipes":
          expect(pipesSolved(snapshot.grid), id).toBe(false);
          break;
        case "mirror":
          expect(mirrorSolved(snapshot.level, snapshot.mirrors), id).toBe(false);
          break;
        default:
          throw new Error(`unexpected snapshot kind for ${id}`);
      }
    }
  });

  it("describes itself in prose that names its own instance and size", () => {
    for (const id of REF_BOARD_IDS) {
      const text = describeRefBoard(id);
      expect(text, id).toContain(`${id}.png`);
      // The seed has to be in the text or the reference is not reproducible by whoever reads it.
      expect(text, id).toContain(String(buildRefBoard(id).seed));
      expect(text.length, id).toBeGreaterThan(500);
    }
  });
});

describe("nonogram reference", () => {
  it("is the plate-sized board, not the size the puzzle plays at", () => {
    const { snapshot } = buildRefBoard("nonogram");
    if (snapshot.kind !== "nonogram") throw new Error("kind");
    expect(snapshot.puzzle.size).toBe(NONOGRAM_SIZE);
    expect(snapshot.grid).toHaveLength(NONOGRAM_SIZE);
  });

  it("marks only cells the solution really fills, so the board is reachable by fair play", () => {
    const { snapshot } = buildRefBoard("nonogram");
    if (snapshot.kind !== "nonogram") throw new Error("kind");
    for (let r = 0; r < snapshot.puzzle.size; r++) {
      for (let c = 0; c < snapshot.puzzle.size; c++) {
        if (snapshot.grid[r]![c] === "filled") {
          expect(snapshot.puzzle.solution[r]![c], `(${r},${c})`).toBe(true);
        }
      }
    }
  });

  it("uses no crossed marks — a third symbol is not legible at plate scale", () => {
    const { snapshot } = buildRefBoard("nonogram");
    if (snapshot.kind !== "nonogram") throw new Error("kind");
    expect(snapshot.grid.flat().filter((c) => c === "crossed")).toHaveLength(0);
  });

  it("puts the same filled cells in the prose as in the grid", () => {
    const { snapshot } = buildRefBoard("nonogram");
    if (snapshot.kind !== "nonogram") throw new Error("kind");
    const text = describeRefBoard("nonogram");
    for (const [r, row] of snapshot.grid.entries()) {
      const expected = `r${r} ${row.map((c) => (c === "filled" ? "#" : ".")).join(" ")}`;
      expect(text, `row ${r}`).toContain(expected);
    }
  });
});

describe("pipes reference", () => {
  it("is the plate-sized board", () => {
    const { snapshot } = buildRefBoard("pipes");
    if (snapshot.kind !== "pipes") throw new Error("kind");
    expect(snapshot.grid).toHaveLength(PIPES_SIZE);
    expect(snapshot.grid[0]).toHaveLength(PIPES_SIZE);
  });

  it("lights part of the network and not all of it", () => {
    const { snapshot } = buildRefBoard("pipes");
    if (snapshot.kind !== "pipes") throw new Error("kind");
    const powered = computePowered(snapshot.grid);
    const live = snapshot.grid.flat().filter((t) => t.kind !== "blank").length;
    expect(powered.size).toBeGreaterThan(1);
    expect(powered.size).toBeLessThan(live);
  });

  it("leaves every tile on a rotation the tile can actually be turned to", () => {
    // Rotations are quarter-turns 0..3. A reference showing a rotation outside that range would
    // depict a tile orientation the real board cannot produce.
    const { snapshot } = buildRefBoard("pipes");
    if (snapshot.kind !== "pipes") throw new Error("kind");
    for (const tile of snapshot.grid.flat()) {
      expect(Number.isInteger(tile.rotation)).toBe(true);
      expect(tile.rotation).toBeGreaterThanOrEqual(0);
      expect(tile.rotation).toBeLessThanOrEqual(3);
    }
  });

  it("states in prose that the size differs from the one the art brief asked for", () => {
    // The brief asked for 5x8; the generator is square-only. Silently shipping 5x5 without saying so
    // would leave the art agent verifying against the wrong row count.
    expect(describeRefBoard("pipes")).toContain("DIFFERS FROM THE BRIEF");
  });
});

describe("mirror reference", () => {
  it("sends the beam further than the untouched board does, but still not home", () => {
    const { snapshot } = buildRefBoard("mirror");
    if (snapshot.kind !== "mirror") throw new Error("kind");
    const { level, mirrors } = snapshot;
    const mid = traceBeam(level.size, mirrors, level.emitter, level.target);
    const pristine = traceBeam(level.size, level.mirrors, level.emitter, level.target);
    expect(mid.path.length).toBeGreaterThan(pristine.path.length);
    expect(mid.reachesTarget).toBe(false);
  });

  it("places mirrors only where the generated level put them", () => {
    // The mid-state may only re-orient mirrors, never add or move one — otherwise it is a board the
    // player could not have arrived at from this level.
    const { snapshot } = buildRefBoard("mirror");
    if (snapshot.kind !== "mirror") throw new Error("kind");
    for (let r = 0; r < snapshot.level.size; r++) {
      for (let c = 0; c < snapshot.level.size; c++) {
        const before = snapshot.level.mirrors[r]![c];
        const after = snapshot.mirrors[r]![c];
        expect(after === null, `(${r},${c}) occupancy`).toBe(before === null);
      }
    }
  });

  it("lists every mirror position and the whole beam path in prose", () => {
    const { snapshot } = buildRefBoard("mirror");
    if (snapshot.kind !== "mirror") throw new Error("kind");
    const text = describeRefBoard("mirror");
    for (let r = 0; r < snapshot.level.size; r++) {
      for (let c = 0; c < snapshot.level.size; c++) {
        if (snapshot.mirrors[r]![c]) expect(text, `mirror (${r},${c})`).toContain(`(${r},${c})`);
      }
    }
    const trace = traceBeam(
      snapshot.level.size,
      snapshot.mirrors,
      snapshot.level.emitter,
      snapshot.level.target,
    );
    expect(text).toContain(trace.path.map((p) => `(${p.row},${p.col})`).join(" -> "));
  });

  it("states in prose that the size differs from the one the art brief asked for", () => {
    expect(describeRefBoard("mirror")).toContain("DIFFERS FROM THE BRIEF");
  });
});
