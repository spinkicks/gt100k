import { describe, expect, it } from "vitest";
import { isSolved as litsSolved } from "../../../puzzles/LITS/logic";
import { isSolved as logicGridSolved } from "../../../puzzles/LogicGrid/logic";
import { isWon as minesweeperWon } from "../../../puzzles/Minesweeper/logic";
import { isSolved as mirrorSolved } from "../../../puzzles/Mirror/logic";
import { isSolved as nonogramSolved } from "../../../puzzles/Nonogram/logic";
import { isSolved as pipesSolved } from "../../../puzzles/Pipes/logic";
import type { PreviewSnapshot } from "./contract";
import { PREVIEW_KINDS, buildSnapshot, isPreviewKind, previewSeed } from "./snapshots";

/**
 * Ask each puzzle's OWN checker whether the snapshot is solved.
 *
 * This is the assertion that keeps the previews honest. A preview-local notion of "looks finished"
 * could drift from the real rule — LITS in particular admits many valid shadings, and Minesweeper's
 * win condition is about revealed safe cells rather than flagged mines — so "solved on the wall" is
 * defined here as "the shipping puzzle logic says this board is solved", nothing weaker.
 */
function solvedByPuzzleLogic(snapshot: PreviewSnapshot): boolean {
  switch (snapshot.kind) {
    case "nonogram":
      return nonogramSolved(snapshot.grid, snapshot.puzzle);
    case "logic-grid":
      return logicGridSolved(snapshot.marks, snapshot.puzzle);
    case "minesweeper":
      return minesweeperWon(snapshot.board);
    case "pipes":
      return pipesSolved(snapshot.grid);
    case "lits":
      return litsSolved(snapshot.shade, snapshot.puzzle);
    case "mirror":
      return mirrorSolved(snapshot.level, snapshot.mirrors);
  }
}

describe("PREVIEW_KINDS", () => {
  it("covers every puzzle the brief asks for", () => {
    expect([...PREVIEW_KINDS].sort()).toEqual([
      "lits",
      "logic-grid",
      "minesweeper",
      "mirror",
      "nonogram",
      "pipes",
    ]);
  });

  it("does not claim a preview for gadgets that have none", () => {
    // Chess is authored as an `object` prop, so it has no plane to warp onto. Fraction Laser and
    // Function Machine do not exist yet (see contract.ts for the three-step change that adds them).
    expect(isPreviewKind("chess")).toBe(false);
    expect(isPreviewKind("fraction-laser")).toBe(false);
    expect(isPreviewKind("function-machine")).toBe(false);
  });
});

describe("previewSeed", () => {
  it("is stable for a given gadget id, so the wall board never reshuffles", () => {
    expect(previewSeed("nonogram")).toBe(previewSeed("nonogram"));
  });

  it("differs between gadgets", () => {
    const seeds = PREVIEW_KINDS.map(previewSeed);
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it("is a non-negative 32-bit integer, which every generator here expects", () => {
    for (const kind of PREVIEW_KINDS) {
      const seed = previewSeed(kind);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("buildSnapshot", () => {
  it("tags the snapshot with the kind it was asked for", () => {
    for (const kind of PREVIEW_KINDS) {
      expect(buildSnapshot(kind, previewSeed(kind), false).kind).toBe(kind);
    }
  });

  it("is deterministic in (kind, seed, solved)", () => {
    for (const kind of PREVIEW_KINDS) {
      for (const solved of [false, true]) {
        const a = buildSnapshot(kind, 4242, solved);
        const b = buildSnapshot(kind, 4242, solved);
        expect(a).toEqual(b);
      }
    }
  });

  it("produces a board the puzzle's own logic calls solved when asked for solved", () => {
    for (const kind of PREVIEW_KINDS) {
      const snapshot = buildSnapshot(kind, previewSeed(kind), true);
      expect(solvedByPuzzleLogic(snapshot), `${kind} solved snapshot`).toBe(true);
    }
  });

  it("holds across many seeds, not just the ones the room happens to use", () => {
    for (let seed = 1; seed <= 12; seed++) {
      for (const kind of PREVIEW_KINDS) {
        expect(solvedByPuzzleLogic(buildSnapshot(kind, seed * 7919, true)), `${kind}@${seed}`).toBe(
          true,
        );
      }
    }
  });

  it("produces an unsolved board when asked for unsolved", () => {
    for (const kind of PREVIEW_KINDS) {
      const snapshot = buildSnapshot(kind, previewSeed(kind), false);
      expect(solvedByPuzzleLogic(snapshot), `${kind} unsolved snapshot`).toBe(false);
    }
  });

  it("leaves an unsolved board looking started-but-unfinished, not empty of information", () => {
    // The unsolved state is what an untouched prop shows, so it has to read as an invitation. Each
    // of these is the thing a player would actually see on first meeting the puzzle.
    const nonogram = buildSnapshot("nonogram", 1, false);
    if (nonogram.kind !== "nonogram") throw new Error("kind");
    expect(nonogram.puzzle.rowClues.length).toBeGreaterThan(0);
    expect(nonogram.grid.flat().every((c) => c === "empty")).toBe(true);

    const pipes = buildSnapshot("pipes", 1, false);
    if (pipes.kind !== "pipes") throw new Error("kind");
    // Scrambled, not blank: at least one tile is off its solved rotation.
    expect(pipes.grid.flat().some((t) => t.rotation !== t.solvedRotation)).toBe(true);

    const mirror = buildSnapshot("mirror", 1, false);
    if (mirror.kind !== "mirror") throw new Error("kind");
    expect(mirror.mirrors.flat().some((cell) => cell !== null)).toBe(true);
  });
});

describe("solved and unsolved snapshots really differ", () => {
  it("changes the player-state half of every snapshot", () => {
    for (const kind of PREVIEW_KINDS) {
      const seed = previewSeed(kind);
      expect(buildSnapshot(kind, seed, true), kind).not.toEqual(buildSnapshot(kind, seed, false));
    }
  });

  it("keeps the puzzle definition identical, so only the marks move", () => {
    // Solving must not silently hand the wall a different puzzle: the clue rails, region borders and
    // pipe layout have to stay put or the prop appears to change board when the child wins.
    const unsolved = buildSnapshot("nonogram", 99, false);
    const solved = buildSnapshot("nonogram", 99, true);
    if (unsolved.kind !== "nonogram" || solved.kind !== "nonogram") throw new Error("kind");
    expect(solved.puzzle).toEqual(unsolved.puzzle);

    const litsA = buildSnapshot("lits", 99, false);
    const litsB = buildSnapshot("lits", 99, true);
    if (litsA.kind !== "lits" || litsB.kind !== "lits") throw new Error("kind");
    expect(litsB.puzzle.regions).toEqual(litsA.puzzle.regions);
  });
});
