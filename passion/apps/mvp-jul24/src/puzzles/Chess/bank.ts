// The Tactics-mode puzzle bank: 30+ curated chess tactics, each defined by a
// FEN (the position) + a UCI move list (the solution), converted at module
// load into the `ChessPuzzle` shape the hand-rolled tactic engine in
// `logic.ts` already knows how to play. Every entry here is verified by
// `bank.test.ts` using `chess.js` (the same real rules engine `freeplay.ts`
// already depends on): the FEN must be a legal position with the stated side
// to move, every solution move must be legal when played in sequence, and
// mate-labeled entries must actually be checkmate after the sequence.
//
// This is the *curated starter* bank. `scripts/ingest-lichess.mjs` documents
// (without running, since the source file is ~250MB compressed) how to
// generate a much larger bank straight from the CC0 Lichess puzzle database.

import { Chess } from "chess.js";
import { toOurBoard } from "./freeplay";
import type { ChessPuzzle, Color, Move } from "./logic";
import { sq } from "./logic";

export type TacticTheme = "mate" | "material";

/** Raw, human-authored/ingested tactic data — FEN + solution in UCI (e.g.
 * "e2e4"), independent of our internal board representation. This is the
 * shape both the curated list below and `scripts/ingest-lichess.mjs`'s
 * output target. */
export interface TacticSpec {
  id: string;
  fen: string;
  /** Solution moves in UCI (`<from><to>`, e.g. "e4f6"). Alternates sides:
   * the solver's move, then any scripted reply, etc. — same alternation
   * `logic.ts#attemptMove` expects. No promotions in this bank (the shared
   * board/engine has no promotion picker). */
  solution: string[];
  /** Short tactic tag shown in the UI, e.g. "Fork", "Back-rank mate". */
  label: string;
  theme: TacticTheme;
}

function algebraicToSquare(algebraic: string) {
  return sq(algebraic[0]!, Number(algebraic[1]));
}

/** Convert a `TacticSpec` (FEN + UCI) into the `ChessPuzzle` shape the
 * tactics engine plays, using chess.js to parse the FEN and derive the
 * board + side to move (never hand-rolled — chess.js is the single source
 * of truth for "is this a legal position"). */
export function specToPuzzle(spec: TacticSpec): ChessPuzzle {
  const chess = new Chess(spec.fen);
  const playerColor = chess.turn() as Color;
  const board = toOurBoard(chess);
  const solution: Move[] = spec.solution.map((uci) => ({
    from: algebraicToSquare(uci.slice(0, 2)),
    to: algebraicToSquare(uci.slice(2, 4)),
  }));
  const colorWord = playerColor === "w" ? "White" : "Black";
  const moveCount = Math.ceil(spec.solution.length / 2);
  const prompt =
    spec.theme === "mate"
      ? `${colorWord} to move — checkmate in ${moveCount === 1 ? "one" : moveCount}.`
      : `${colorWord} to move — ${spec.label.toLowerCase()}.`;
  return { id: spec.id, prompt, playerColor, board, solution, label: spec.label };
}

// ---------------------------------------------------------------------------
// Curated starter bank (32 tactics). Every FEN + solution below is verified
// end-to-end by bank.test.ts via chess.js.
//
// Mate-in-1 (8): a single move delivers checkmate. Several share the same
// "king boxed in by its own pawns, a rook/queen sweeps the open back rank"
// idea (like classic back-rank mates always do), mirrored across corners
// and files for board-position variety.
//
// Mate-in-2 (4): a harmless white "waiting" move, any legal black reply,
// then the same style of mate — demonstrating a short forced-looking
// sequence without requiring a full mate-in-2 solver to prove forcedness
// (matching how the original 2 authored puzzles scripted opponent replies).
//
// Material tactics (20): forks, pins, skewers, discovered attacks, and
// straightforward "win the hanging piece" tactics across all piece types.
// ---------------------------------------------------------------------------
export const TACTIC_SPECS: TacticSpec[] = [
  // Mate in 1
  {
    id: "corner-mate-h8-rook",
    fen: "7k/6pp/8/8/8/8/8/R3K3 w - - 0 1",
    solution: ["a1a8"],
    label: "Back-rank mate",
    theme: "mate",
  },
  {
    id: "corner-mate-h8-queen",
    fen: "7k/6pp/8/8/8/8/8/Q3K3 w - - 0 1",
    solution: ["a1a8"],
    label: "Back-rank mate",
    theme: "mate",
  },
  {
    id: "corner-mate-a8-rook",
    fen: "k7/pp6/8/8/8/8/8/4K2R w - - 0 1",
    solution: ["h1h8"],
    label: "Back-rank mate",
    theme: "mate",
  },
  {
    id: "corner-mate-a8-queen",
    fen: "k7/pp6/8/8/8/8/8/4K2Q w - - 0 1",
    solution: ["h1h8"],
    label: "Back-rank mate",
    theme: "mate",
  },
  {
    id: "corner-mate-b8-rook",
    fen: "1k6/ppp5/8/8/8/8/8/4K2R w - - 0 1",
    solution: ["h1h8"],
    label: "Corridor mate",
    theme: "mate",
  },
  {
    id: "corner-mate-g8-queen",
    fen: "6k1/5ppp/8/8/8/8/8/Q3K3 w - - 0 1",
    solution: ["a1a8"],
    label: "Corridor mate",
    theme: "mate",
  },
  {
    id: "corner-mate-d8-rook",
    fen: "3k4/2ppp3/8/8/8/8/8/4K2R w - - 0 1",
    solution: ["h1h8"],
    label: "Cage mate",
    theme: "mate",
  },
  {
    id: "corner-mate-e8-queen",
    fen: "4k3/3ppp2/8/8/8/8/8/Q3K3 w - - 0 1",
    solution: ["a1a8"],
    label: "Cage mate",
    theme: "mate",
  },

  // Mate in 2
  {
    id: "mate-in-2-h8-rook",
    fen: "7k/6pp/8/3p4/8/8/8/R3K3 w - - 0 1",
    solution: ["e1f1", "d5d4", "a1a8"],
    label: "Mate in 2",
    theme: "mate",
  },
  {
    id: "mate-in-2-a8-queen",
    fen: "k7/pp6/8/4p3/8/8/8/4K2Q w - - 0 1",
    solution: ["e1f1", "e5e4", "h1h8"],
    label: "Mate in 2",
    theme: "mate",
  },
  {
    id: "mate-in-2-e8-rook",
    fen: "4k3/3ppp2/8/2p5/8/8/8/R3K3 w - - 0 1",
    solution: ["e1f1", "c5c4", "a1a8"],
    label: "Mate in 2",
    theme: "mate",
  },
  {
    id: "mate-in-2-g8-queen",
    fen: "6k1/5ppp/8/3p4/8/8/8/Q3K3 w - - 0 1",
    solution: ["e1f1", "d5d4", "a1a8"],
    label: "Mate in 2",
    theme: "mate",
  },

  // Forks
  {
    id: "knight-fork-queen",
    fen: "4k3/8/8/8/4N2q/8/8/3K3R w - - 0 1",
    solution: ["e4f6", "e8e7", "h1h4"],
    label: "Fork wins the queen",
    theme: "material",
  },
  {
    id: "knight-fork-king-rook",
    fen: "r3k3/8/8/8/3N4/8/8/4K3 b - - 0 1",
    solution: ["e8d7", "d4c6"],
    label: "Fork",
    theme: "material",
  },
  {
    id: "knight-fork-two-rooks",
    fen: "r5r1/8/4N3/8/8/8/8/4K2k b - - 0 1",
    solution: ["h1g1", "e6g7"],
    label: "Fork wins a rook",
    theme: "material",
  },
  {
    id: "knight-fork-queen-king",
    fen: "4k3/6q1/8/5N2/8/8/8/4K3 b - - 0 1",
    solution: ["e8d8", "f5e7"],
    label: "Royal fork",
    theme: "material",
  },
  {
    id: "pawn-fork-two-knights",
    fen: "4k3/8/2n1n3/3P4/8/8/8/4K3 b - - 0 1",
    solution: ["e8d7", "d5c6"],
    label: "Pawn fork",
    theme: "material",
  },
  {
    id: "bishop-fork-rooks",
    fen: "r3k2r/8/8/4B3/8/8/8/4K3 b - - 0 1",
    solution: ["e8d7", "e5c7"],
    label: "Fork",
    theme: "material",
  },

  // Pins
  {
    id: "rook-pin-win-knight",
    fen: "4k3/3n4/8/3R4/8/8/8/4K3 b - - 0 1",
    solution: ["e8e7", "d5d7"],
    label: "Pin wins a knight",
    theme: "material",
  },
  {
    id: "bishop-pin-win-pawn",
    fen: "4k3/8/2p5/8/8/5B2/8/4K3 b - - 0 1",
    solution: ["e8d7", "f3c6"],
    label: "Pin wins a pawn",
    theme: "material",
  },
  {
    id: "queen-pin-win-bishop",
    fen: "4k3/8/4b3/8/8/8/8/4Q2K w - - 0 1",
    solution: ["e1e6"],
    label: "Pin wins a bishop",
    theme: "material",
  },

  // Skewers
  {
    id: "rook-skewer-king-queen",
    fen: "3qk3/8/8/8/8/8/8/3RK3 b - - 0 1",
    solution: ["e8f7", "d1d8"],
    label: "Skewer wins the queen",
    theme: "material",
  },
  {
    id: "bishop-skewer-diag",
    fen: "6k1/8/8/8/8/8/1q6/B5K1 b - - 0 1",
    solution: ["b2c3", "a1b2"],
    label: "Skewer",
    theme: "material",
  },
  {
    id: "queen-skewer-king-rook",
    fen: "3rk3/8/8/8/8/8/8/3QK3 b - - 0 1",
    solution: ["e8f7", "d1d8"],
    label: "Skewer wins a rook",
    theme: "material",
  },

  // Discovered attacks
  {
    id: "discovered-attack-pawn",
    fen: "2q3k1/3p4/8/2N5/8/8/8/2R3K1 w - - 0 1",
    solution: ["c5d7"],
    label: "Discovered attack",
    theme: "material",
  },
  {
    id: "discovered-check-bishop",
    fen: "3k4/8/1b6/3N4/8/8/8/3R3K w - - 0 1",
    solution: ["d5b6"],
    label: "Discovered check wins a bishop",
    theme: "material",
  },

  // Win the hanging piece
  {
    id: "win-undefended-rook",
    fen: "4k3/8/8/3r4/8/8/8/3N3K b - - 0 1",
    solution: ["d5d1"],
    label: "Win a free rook",
    theme: "material",
  },
  {
    id: "win-undefended-bishop",
    fen: "4k3/8/2b5/8/8/8/8/4KQ2 w - - 0 1",
    solution: ["f1c4"],
    label: "Win a free bishop",
    theme: "material",
  },
  {
    id: "win-undefended-knight",
    fen: "4k3/8/3n4/8/8/8/8/3Q3K w - - 0 1",
    solution: ["d1d6"],
    label: "Win a free knight",
    theme: "material",
  },
  {
    id: "win-undefended-pawn",
    fen: "4k3/8/8/3p4/8/2N5/8/7K w - - 0 1",
    solution: ["c3d5"],
    label: "Win a free pawn",
    theme: "material",
  },
  {
    id: "remove-the-defender",
    fen: "3rk3/8/8/8/8/8/8/R3K3 w - - 0 1",
    solution: ["a1d1", "d8d1"],
    label: "Trade into a won ending",
    theme: "material",
  },
  {
    id: "win-a-pawn-tactic",
    fen: "4k3/8/2r5/8/8/8/8/R3K3 w - - 0 1",
    solution: ["a1c1", "c6c1"],
    label: "Simplify into a winning ending",
    theme: "material",
  },
];

export const TACTICS: ChessPuzzle[] = TACTIC_SPECS.map(specToPuzzle);

/** Pick a random tactic from the bank. If `excludeId` is given and the bank
 * has more than one entry, it's excluded from the pool (used by "Next
 * puzzle" so it doesn't immediately repeat the just-solved tactic). `rng`
 * defaults to `Math.random` but is injectable for deterministic tests. */
export function pickRandomTactic(rng: () => number = Math.random, excludeId?: string): ChessPuzzle {
  const pool =
    excludeId && TACTICS.length > 1 ? TACTICS.filter((t) => t.id !== excludeId) : TACTICS;
  const idx = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[idx]!;
}
