import { Chess } from "chess.js";
import {
  chooseAiMove,
  createFreeplayGame,
  evaluateMaterial,
  getGameStatus,
  legalTargets,
  statusMessage,
  toOurBoard,
  tryMove,
} from "./freeplay";
import { sq } from "./logic";

describe("createFreeplayGame / toOurBoard", () => {
  test("starts a standard game with White to move", () => {
    const game = createFreeplayGame();
    expect(game.turn()).toBe("w");
    expect(game.fen()).toContain(" w ");
  });

  test("toOurBoard maps the starting position into our Piece shape", () => {
    const game = createFreeplayGame();
    const board = toOurBoard(game);
    expect(board[7]?.[4]).toEqual({ type: "K", color: "w" }); // e1
    expect(board[0]?.[4]).toEqual({ type: "K", color: "b" }); // e8
    expect(board[6]?.[4]).toEqual({ type: "P", color: "w" }); // e2
  });
});

describe("legalTargets / tryMove", () => {
  test("legalTargets surfaces a pawn's opening double-push", () => {
    const game = createFreeplayGame();
    const targets = legalTargets(game, sq("e", 2));
    expect(targets).toEqual(expect.arrayContaining([sq("e", 3), sq("e", 4)]));
  });

  test("tryMove plays a legal move and advances the turn", () => {
    const game = createFreeplayGame();
    const move = tryMove(game, sq("e", 2), sq("e", 4));
    expect(move).not.toBeNull();
    expect(game.turn()).toBe("b");
  });

  test("tryMove rejects an illegal move without throwing", () => {
    const game = createFreeplayGame();
    const move = tryMove(game, sq("e", 2), sq("e", 5));
    expect(move).toBeNull();
    expect(game.turn()).toBe("w"); // untouched
  });
});

describe("getGameStatus / statusMessage", () => {
  test("a fresh game is just 'playing', no check", () => {
    const status = getGameStatus(createFreeplayGame());
    expect(status).toEqual({ kind: "playing", inCheck: false });
    expect(statusMessage(status)).toBe("");
  });

  test("fool's mate is detected as checkmate for White (Black wins)", () => {
    // 1. f3 e5 2. g4 Qh4#
    const game = new Chess();
    game.move("f3");
    game.move("e5");
    game.move("g4");
    game.move("Qh4");
    const status = getGameStatus(game);
    expect(status).toEqual({ kind: "checkmate", winner: "b" });
    expect(statusMessage(status)).toBe("Checkmate — the AI wins.");
    expect(game.isGameOver()).toBe(true);
  });

  test("a known stalemate position is detected", () => {
    // Classic stalemate: Black king boxed in with no legal moves, not in check.
    const game = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(game.isCheckmate()).toBe(false);
    const status = getGameStatus(game);
    expect(status.kind).toBe("stalemate");
    expect(statusMessage(status)).toBe("Stalemate — it's a draw.");
  });
});

describe("evaluateMaterial", () => {
  test("the starting position is materially even", () => {
    expect(evaluateMaterial(createFreeplayGame())).toBe(0);
  });

  test("White up a queen scores +9", () => {
    const game = new Chess("4k3/8/8/8/8/8/8/Q3K3 w - - 0 1");
    expect(evaluateMaterial(game)).toBe(9);
  });

  test("Black up a rook scores -5 (from White's perspective)", () => {
    const game = new Chess("4k3/8/8/8/8/8/r7/4K3 w - - 0 1");
    expect(evaluateMaterial(game)).toBe(-5);
  });
});

describe("chooseAiMove", () => {
  test("always returns one of the legal moves for the side to move", () => {
    const game = createFreeplayGame();
    game.move("e4");
    const legal = game.moves({ verbose: true });
    const aiMove = chooseAiMove(game);
    expect(aiMove).not.toBeNull();
    expect(legal.some((m) => m.from === aiMove!.from && m.to === aiMove!.to)).toBe(true);
  });

  test("returns null when there are no legal moves (game already over)", () => {
    const game = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"); // stalemate
    expect(chooseAiMove(game)).toBeNull();
  });

  test("prefers an obvious free capture over quiet moves", () => {
    // Black to move; Black rook on d5 can capture a completely undefended
    // White knight on d1 for free by sliding down the d-file (and the White
    // king on h1 is too far away to ever recapture it). The AI must take it
    // over any quiet, non-capturing rook move.
    const game = new Chess("4k3/8/8/3r4/8/8/8/3N3K b - - 0 1");
    const move = chooseAiMove(game, 2, () => 0);
    expect(move).not.toBeNull();
    expect(move!.from).toBe("d5");
    expect(move!.to).toBe("d1");
    expect(move!.captured).toBe("n");
  });

  test("depth-2 minimax avoids a losing trade in favor of a safe capture", () => {
    // Black to move with a queen on d8. Qxd1 "wins" White's undefended rook,
    // but the White king on e1 immediately recaptures the queen (queen for
    // rook is a bad trade). Qxa5 wins an undefended pawn with no recapture
    // possible. A naive 1-ply "grab the biggest capture" AI would blunder
    // into Qxd1; the depth-2 minimax must prefer the safe Qxa5 instead.
    const game = new Chess("3qk3/8/8/P7/8/8/8/3RK3 b - - 0 1");
    const move = chooseAiMove(game, 2, () => 0);
    expect(move).not.toBeNull();
    expect(move!.from).toBe("d8");
    expect(move!.to).toBe("a5");
    expect(move!.captured).toBe("p");
  });
});
