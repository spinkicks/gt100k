/**
 * What counts as a try, and what does not.
 *
 * The wellbeing engine decides how hard to push a child from a success rate, and the only surface
 * that can produce one is a puzzle that knows a right answer from a wrong one. Chess does, and this
 * pins the distinction the whole signal rests on.
 *
 * THE DISTINCTION THAT MATTERS. `illegal` and `wrong` are different things, and conflating them
 * would poison the rate. A child dragging a bishop sideways has mis-clicked; a child playing a
 * legal move that is not the solution has genuinely tried and missed. Only the second is a try, and
 * `Chess.tsx` reports only the second, which is why a fumbling six-year-old does not read as
 * struggling with chess.
 */
import { describe, expect, it } from "vitest";

import { attemptMove, initState } from "../runtime/puzzles/Chess/logic.js";
import { PUZZLES } from "../runtime/puzzles/Chess/puzzles.data.js";

const puzzle = PUZZLES[0]!;

describe("what the board reports back", () => {
  it("calls the solution correct", () => {
    const first = puzzle.solution[0]!;
    const r = attemptMove(puzzle, initState(puzzle), { from: first.from, to: first.to });
    expect(r.kind).toBe("correct");
  });

  it("calls a legal move that is not the solution wrong", () => {
    // This is the one that becomes a try. Search the board for any legal non-solution move rather
    // than hardcoding one, so the test survives a change to the puzzle bank.
    const state = initState(puzzle);
    const want = puzzle.solution[0]!;
    let found: { kind: string } | null = null;
    for (let fr = 0; fr < 8 && !found; fr++) {
      for (let fc = 0; fc < 8 && !found; fc++) {
        for (let tr = 0; tr < 8 && !found; tr++) {
          for (let tc = 0; tc < 8 && !found; tc++) {
            const from = { row: fr, col: fc };
            const to = { row: tr, col: tc };
            if (from.row === want.from.row && from.col === want.from.col) {
              if (to.row === want.to.row && to.col === want.to.col) continue;
            }
            const r = attemptMove(puzzle, initState(puzzle), { from, to });
            if (r.kind === "wrong") found = r;
          }
        }
      }
    }
    expect(found).not.toBeNull();
  });

  it("calls a move off an empty square illegal, not wrong", () => {
    // A mis-click. If this reported as a try, every child fumbling with a touch screen would read
    // as failing, and the engine would pull their difficulty down for it.
    const state = initState(puzzle);
    let empty: { row: number; col: number } | null = null;
    for (let r = 0; r < 8 && !empty; r++) {
      for (let c = 0; c < 8 && !empty; c++) {
        if (!state.board[r]?.[c]) empty = { row: r, col: c };
      }
    }
    expect(empty).not.toBeNull();
    const res = attemptMove(puzzle, state, { from: empty!, to: { row: 4, col: 4 } });
    expect(res.kind).toBe("illegal");
  });

  it("reports nothing once the puzzle is already solved", () => {
    const solved = { ...initState(puzzle), solved: true };
    const first = puzzle.solution[0]!;
    expect(attemptMove(puzzle, solved, { from: first.from, to: first.to }).kind).toBe("illegal");
  });
});
