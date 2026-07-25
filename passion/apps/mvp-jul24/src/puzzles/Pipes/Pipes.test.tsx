import { fireEvent, render } from "@testing-library/react";
import Pipes from "./Pipes";
import { EASY_SIZE, HARD_SIZE, generateLevel, nextSeed } from "./generate";
import { makeGrid } from "./logic";

/** Click every non-blank tile the number of times needed to reach its
 * solvedRotation, mirroring how a player would solve the rendered board. */
function solveBoard(initial: ReturnType<typeof makeGrid>) {
  for (let r = 0; r < initial.length; r++) {
    for (let c = 0; c < initial[r]!.length; c++) {
      const tile = initial[r]![c]!;
      if (tile.kind === "blank") continue;
      const clicksNeeded = (tile.solvedRotation - tile.rotation + 4) % 4;
      const btn = document.querySelector(`[aria-label^="pipe row ${r + 1} column ${c + 1}"]`);
      expect(btn).toBeTruthy();
      for (let i = 0; i < clicksNeeded; i++) fireEvent.click(btn!);
    }
  }
}

test("rotating a generated puzzle into its solved orientation calls onSolved", () => {
  const seed = 0;
  // Mirrors the component's own derivation: puzzleIndex starts at 0, so the
  // first generated level uses nextSeed(seed, 0) at EASY_SIZE.
  const level = generateLevel(nextSeed(seed, 0), EASY_SIZE);
  const initial = makeGrid(level, nextSeed(seed, 0));
  const onSolved = vi.fn();
  render(<Pipes seed={seed} onSolved={onSolved} onExit={() => {}} />);

  expect(onSolved).not.toHaveBeenCalled();
  solveBoard(initial);
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("exit button calls onExit", () => {
  const onExit = vi.fn();
  render(<Pipes seed={1} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".pp-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test("no 'Next puzzle' button until the puzzle is solved, and Back/onSolved-once still hold", () => {
  render(<Pipes seed={2} onSolved={() => {}} onExit={() => {}} />);
  expect(document.querySelector(".pp-next")).toBeNull();
});

test("'Next puzzle' appears once solved, and generates a different board on click", () => {
  const seed = 3;
  const level0 = generateLevel(nextSeed(seed, 0), EASY_SIZE);
  const initial0 = makeGrid(level0, nextSeed(seed, 0));
  const onSolved = vi.fn();
  render(<Pipes seed={seed} onSolved={onSolved} onExit={() => {}} />);

  solveBoard(initial0);
  expect(onSolved).toHaveBeenCalledTimes(1);

  const nextBtn = document.querySelector(".pp-next");
  expect(nextBtn).toBeTruthy();

  // Snapshot the solved board's tile-kind layout before advancing.
  const kindsBefore = Array.from(document.querySelectorAll(".pp-tile")).map((el) =>
    Array.from(el.classList).find((cls) => cls.startsWith("pp-kind-")),
  );

  fireEvent.click(nextBtn!);

  // Next puzzle starts unsolved again, and the button disappears until it's
  // solved once more.
  expect(document.querySelector(".pp-next")).toBeNull();

  const kindsAfter = Array.from(document.querySelectorAll(".pp-tile")).map((el) =>
    Array.from(el.classList).find((cls) => cls.startsWith("pp-kind-")),
  );
  expect(kindsAfter).not.toEqual(kindsBefore);

  // The new puzzle is solvable too: solve it and confirm onSolved fires
  // again. puzzleIndex 1 is odd, so the component alternates to HARD_SIZE.
  const level1 = generateLevel(nextSeed(seed, 1), HARD_SIZE);
  const initial1 = makeGrid(level1, nextSeed(seed, 1));
  solveBoard(initial1);
  expect(onSolved).toHaveBeenCalledTimes(2);
});
