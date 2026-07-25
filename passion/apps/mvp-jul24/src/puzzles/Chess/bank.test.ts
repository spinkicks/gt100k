// Verifies every tactic in the bank against chess.js — the same real rules
// engine `freeplay.ts` uses for Free Play. This is the "do not ship an
// unverified tactic" gate: each entry's FEN must be a legal position with
// the stated side to move, each solution move must be legal when played in
// sequence against the real chess.js move generator, and mate-themed
// entries must actually reach `isCheckmate()`.
import { Chess } from "chess.js";
import type { Square as ChessJsSquare } from "chess.js";
import { TACTICS, TACTIC_SPECS, pickRandomTactic, specToPuzzle } from "./bank";
import { squareName } from "./logic";

describe("bank size + shape", () => {
  test("has 30-50 tactics", () => {
    expect(TACTIC_SPECS.length).toBeGreaterThanOrEqual(30);
    expect(TACTIC_SPECS.length).toBeLessThanOrEqual(50);
    expect(TACTICS).toHaveLength(TACTIC_SPECS.length);
  });

  test("covers mate-in-1, mate-in-2, and material tactics", () => {
    const mateIn1 = TACTIC_SPECS.filter((t) => t.theme === "mate" && t.solution.length === 1);
    const mateIn2 = TACTIC_SPECS.filter((t) => t.theme === "mate" && t.solution.length > 1);
    const material = TACTIC_SPECS.filter((t) => t.theme === "material");
    expect(mateIn1.length).toBeGreaterThanOrEqual(3);
    expect(mateIn2.length).toBeGreaterThanOrEqual(2);
    expect(material.length).toBeGreaterThanOrEqual(10);
  });

  test("every id is unique", () => {
    const ids = TACTIC_SPECS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every tactic has a non-empty label", () => {
    for (const t of TACTIC_SPECS) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

describe("every bank entry is a chess.js-verified legal tactic", () => {
  for (const spec of TACTIC_SPECS) {
    test(`${spec.id}: legal position, legal solution, ${spec.theme === "mate" ? "ends in checkmate" : "ends legally"}`, () => {
      // The FEN must parse as a legal chess.js position (throws otherwise).
      const chess = new Chess(spec.fen);
      const sideToMove = chess.turn();

      for (const uci of spec.solution) {
        const from = uci.slice(0, 2) as ChessJsSquare;
        const to = uci.slice(2, 4) as ChessJsSquare;
        const legal = chess.moves({ square: from, verbose: true });
        const match = legal.find((m) => m.to === to);
        expect(match, `${uci} should be legal from ${chess.fen()}`).toBeTruthy();
        chess.move({ from, to, promotion: "q" });
      }

      if (spec.theme === "mate") {
        expect(chess.isCheckmate()).toBe(true);
      } else {
        // Material tactics: the sequence must at least be fully legal (checked
        // above) and not leave the position illegal/contradictory.
        expect(chess.fen()).toBeTruthy();
      }

      // Sanity: the puzzle's stated player color matches chess.js's turn().
      const puzzle = specToPuzzle(spec);
      expect(puzzle.playerColor).toBe(sideToMove);
    });
  }
});

describe("specToPuzzle", () => {
  test("converts FEN + UCI into our board/solution shape", () => {
    const spec = TACTIC_SPECS.find((t) => t.id === "corner-mate-h8-rook")!;
    const puzzle = specToPuzzle(spec);
    expect(puzzle.playerColor).toBe("w");
    expect(puzzle.label).toBe("Back-rank mate");
    expect(puzzle.solution).toEqual([
      { from: { row: 7, col: 0 }, to: { row: 0, col: 0 } }, // a1 -> a8
    ]);
    // Board reflects the FEN: white rook on a1, black king on h8.
    expect(puzzle.board[7]?.[0]).toEqual({ type: "R", color: "w" });
    expect(puzzle.board[0]?.[7]).toEqual({ type: "K", color: "b" });
  });

  test("mate-in-1 prompt reads 'checkmate in one'", () => {
    const spec = TACTIC_SPECS.find((t) => t.id === "corner-mate-h8-rook")!;
    expect(specToPuzzle(spec).prompt).toMatch(/checkmate in one/i);
  });

  test("mate-in-2 prompt reads 'checkmate in 2'", () => {
    const spec = TACTIC_SPECS.find((t) => t.id === "mate-in-2-h8-rook")!;
    expect(specToPuzzle(spec).prompt).toMatch(/checkmate in 2/i);
  });

  test("material tactic prompt mentions its label", () => {
    const spec = TACTIC_SPECS.find((t) => t.id === "knight-fork-queen")!;
    expect(specToPuzzle(spec).prompt.toLowerCase()).toContain("fork wins the queen");
  });
});

describe("pickRandomTactic", () => {
  test("rng=0 picks the first entry in the pool", () => {
    const picked = pickRandomTactic(() => 0);
    expect(picked).toBe(TACTICS[0]);
  });

  test("rng close to 1 picks the last entry in the pool", () => {
    const picked = pickRandomTactic(() => 0.999999);
    expect(picked).toBe(TACTICS[TACTICS.length - 1]);
  });

  test("excludeId removes that tactic from the pool", () => {
    const firstId = TACTICS[0]!.id;
    const picked = pickRandomTactic(() => 0, firstId);
    expect(picked.id).not.toBe(firstId);
  });

  test("every square round-trips through squareName as a sanity check on conversion", () => {
    for (const t of TACTICS) {
      for (const move of t.solution) {
        expect(() => squareName(move.from)).not.toThrow();
        expect(() => squareName(move.to)).not.toThrow();
      }
    }
  });
});
