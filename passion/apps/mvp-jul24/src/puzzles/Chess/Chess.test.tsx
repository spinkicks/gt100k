import { act, fireEvent, render, screen } from "@testing-library/react";
import Chess from "./Chess";
import { TACTICS } from "./bank";

const clickSquare = (name: string) => {
  const el = document.querySelector(`[data-square="${name}"]`);
  if (!el) throw new Error(`square ${name} not found`);
  fireEvent.click(el);
};

/** Deterministic rng that always selects `id` out of the bank — lets tests
 * pin down which random tactic loads without hardcoding array indices. */
function rngFor(id: string): () => number {
  const idx = TACTICS.findIndex((t) => t.id === id);
  if (idx < 0) throw new Error(`no such tactic: ${id}`);
  return () => (idx + 0.5) / TACTICS.length;
}

describe("Tactics mode — random bank puzzle", () => {
  test("loads a bank puzzle on open and playing its solution calls onSolved", () => {
    const onSolved = vi.fn();
    render(
      <Chess seed={0} onSolved={onSolved} onExit={() => {}} rng={rngFor("corner-mate-h8-rook")} />,
    );

    expect(screen.getByText(/checkmate in one/i)).toBeInTheDocument();
    clickSquare("a1"); // select the white rook
    clickSquare("a8"); // the back-rank mate

    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  test("a wrong-but-legal move shows a hint and resets instead of solving", () => {
    const onSolved = vi.fn();
    render(
      <Chess seed={0} onSolved={onSolved} onExit={() => {}} rng={rngFor("corner-mate-h8-rook")} />,
    );

    clickSquare("a1");
    clickSquare("a5"); // legal rook move, but not the solution

    expect(onSolved).not.toHaveBeenCalled();
    expect(document.querySelector(".cx-message-show")).not.toBeNull();

    // Position reset: the rook is back on a1 and can still find the mate.
    clickSquare("a1");
    clickSquare("a8");
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  test("multi-ply puzzle: player move, auto opponent reply, then the winning move solves it", () => {
    const onSolved = vi.fn();
    render(
      <Chess seed={0} onSolved={onSolved} onExit={() => {}} rng={rngFor("knight-fork-queen")} />,
    );

    clickSquare("e4"); // select the white knight
    clickSquare("f6"); // knight hops in with check
    expect(onSolved).not.toHaveBeenCalled();

    // The scripted black king reply (e8 -> e7) should have been auto-played.
    expect(document.querySelector('[data-square="e7"]')?.textContent).toBe("♚");

    clickSquare("h1"); // select the white rook
    clickSquare("h4"); // capture the undefended queen

    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  test("an illegal (nonsense) move is rejected outright and does not solve", () => {
    const onSolved = vi.fn();
    render(
      <Chess seed={0} onSolved={onSolved} onExit={() => {}} rng={rngFor("corner-mate-h8-rook")} />,
    );
    clickSquare("a1");
    clickSquare("b2"); // rook cannot move diagonally — not a listed target, click is a no-op
    expect(onSolved).not.toHaveBeenCalled();
  });

  test("solving does not auto-close: 'Next puzzle' only appears once solved, and loads a different tactic", () => {
    const onSolved = vi.fn();
    // rng() = 0 deterministically picks TACTICS[0] first, then — since Next
    // excludes the just-solved id from the pool — TACTICS[1] next.
    render(<Chess seed={0} onSolved={onSolved} onExit={() => {}} rng={() => 0} />);

    const first = TACTICS[0]!;
    const second = TACTICS[1]!;
    expect(document.querySelector(".cx-next")).toBeNull();

    const [firstFrom, firstTo] = [first.solution[0]!.from, first.solution[0]!.to];
    const squareName = (s: { row: number; col: number }) =>
      `${String.fromCharCode(97 + s.col)}${8 - s.row}`;
    clickSquare(squareName(firstFrom));
    clickSquare(squareName(firstTo));

    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".cx-next")).not.toBeNull();

    fireEvent.click(screen.getByText("Next puzzle →"));

    // A new puzzle loaded: the board reset to the second tactic's starting
    // position, and the "solved" UI (Next button) is gone again.
    expect(document.querySelector(".cx-next")).toBeNull();
    const secondFrom = squareName(second.solution[0]!.from);
    const secondPiece = second.board[second.solution[0]!.from.row]?.[second.solution[0]!.from.col];
    expect(
      document.querySelector(`[data-square="${secondFrom}"]`)?.getAttribute("aria-label"),
    ).toContain(secondPiece?.type);

    // Solving the second tactic fires onSolved again (not just once ever).
    const [secondFrom2, secondTo2] = [second.solution[0]!.from, second.solution[0]!.to];
    clickSquare(squareName(secondFrom2));
    clickSquare(squareName(secondTo2));
    expect(onSolved).toHaveBeenCalledTimes(2);
  });

  test("back button calls onExit", () => {
    const onExit = vi.fn();
    render(<Chess seed={0} onSolved={() => {}} onExit={onExit} />);
    fireEvent.click(document.querySelector(".cx-exit")!);
    expect(onExit).toHaveBeenCalled();
  });
});

describe("mode toggle", () => {
  test("defaults to Tactics, and switches to Free Play on click", () => {
    render(
      <Chess seed={0} onSolved={() => {}} onExit={() => {}} rng={rngFor("corner-mate-h8-rook")} />,
    );

    // Tactics is active by default: the tactic prompt is visible and the
    // starting free-play position (e.g. two rooks on rank 1) is not.
    expect(screen.getByText(/checkmate in one/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tactics" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: "Free Play" }));

    expect(screen.getByRole("tab", { name: "Free Play" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText(/checkmate in one/i)).not.toBeInTheDocument();
    expect(screen.getByText("New game")).toBeInTheDocument();
    // A standard game starts with a White pawn on e2.
    expect(document.querySelector('[data-square="e2"]')?.textContent).toBe("♙");
  });
});

describe("Free Play vs AI", () => {
  test("a legal player move triggers an automatic AI reply, returning the turn to White", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Chess seed={0} onSolved={() => {}} onExit={() => {}} />);
      fireEvent.click(screen.getByRole("tab", { name: "Free Play" }));

      const clickSquare = (name: string) => {
        const el = document.querySelector(`[data-square="${name}"]`);
        if (!el) throw new Error(`square ${name} not found`);
        fireEvent.click(el);
      };

      // White plays 1. e4.
      clickSquare("e2");
      clickSquare("e4");
      expect(document.querySelector('[data-square="e4"]')?.textContent).toBe("♙");
      expect(document.querySelector('[data-square="e2"]')?.textContent).toBe("");

      // It's now Black's (the AI's) turn — the status line says so, regardless
      // of which reply the AI ends up picking.
      expect(screen.getByText("AI is thinking…")).toBeInTheDocument();

      // Let the AI's scheduled reply run, then flush the resulting re-render.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // The AI must have played *some* legal reply and handed the turn back
      // to White — asserted via the status line rather than any specific
      // move, since the AI's tie-break has some intentional variety (e.g. it
      // may reply 1...c5 or 1...Nc6 or another equally-good move).
      expect(screen.getByText("Your move — you're White.")).toBeInTheDocument();
      // Confirm it's actually interactive again: White can select a piece
      // and see legal destinations highlighted.
      clickSquare("d2");
      expect(document.querySelector('[data-square="d4"]')?.className).toContain("cx-target");
    } finally {
      vi.useRealTimers();
    }
  });

  test("New game resets the Free Play board to the starting position", () => {
    render(<Chess seed={0} onSolved={() => {}} onExit={() => {}} />);
    fireEvent.click(screen.getByRole("tab", { name: "Free Play" }));
    fireEvent.click(screen.getByText("New game"));
    expect(document.querySelector('[data-square="e2"]')?.textContent).toBe("♙");
    expect(document.querySelector('[data-square="e4"]')?.textContent).toBe("");
  });
});
