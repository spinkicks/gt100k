import { fireEvent, render } from "@testing-library/react";
import LogicGrid from "./LogicGrid";
import { generatePuzzle, nextSeed } from "./generate";
import { type LogicPuzzle, key } from "./logic";

/** Click every cell to match the puzzle's stated solution, mirroring how a
 * player would fill in the grid: "yes" on the solution value, "no" on every
 * other value in that category. */
function solveGrid(puzzle: LogicPuzzle) {
  for (const cat of puzzle.categories) {
    for (const entity of puzzle.entities) {
      const solutionValue = puzzle.solution[entity]![cat.name]!;
      for (const value of cat.values) {
        const cell = document.querySelector(`[data-cell="${key(entity, cat.name, value)}"]`)!;
        expect(cell).toBeTruthy();
        if (value === solutionValue) {
          fireEvent.click(cell); // unknown -> yes
        } else {
          fireEvent.click(cell); // unknown -> yes
          fireEvent.click(cell); // yes -> no
        }
      }
    }
  }
}

test("generating a puzzle and marking its solution calls onSolved", () => {
  const seed = 0;
  // Mirrors the component's own derivation: puzzleIndex starts at 0, so the
  // first generated puzzle uses nextSeed(seed, 0) at "easy" difficulty.
  const puzzle = generatePuzzle(nextSeed(seed, 0), "easy");
  const onSolved = vi.fn();
  render(<LogicGrid seed={seed} onSolved={onSolved} onExit={() => {}} />);

  expect(onSolved).not.toHaveBeenCalled();
  solveGrid(puzzle);
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("exit button calls onExit", () => {
  const onExit = vi.fn();
  render(<LogicGrid seed={1} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".lg-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test("no 'Next puzzle' button until solved, and onSolved fires only once", () => {
  const seed = 2;
  const puzzle = generatePuzzle(nextSeed(seed, 0), "easy");
  const onSolved = vi.fn();
  render(<LogicGrid seed={seed} onSolved={onSolved} onExit={() => {}} />);
  expect(document.querySelector(".lg-next")).toBeNull();

  solveGrid(puzzle);
  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(document.querySelector(".lg-next")).toBeTruthy();

  // Toggling a cell after solving still shouldn't fire onSolved again.
  const [entity] = puzzle.entities;
  const cat = puzzle.categories[0]!;
  const value = cat.values[0]!;
  fireEvent.click(document.querySelector(`[data-cell="${key(entity!, cat.name, value)}"]`)!);
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("'Next puzzle' generates a different puzzle and resets the grid", () => {
  const seed = 3;
  const puzzle0 = generatePuzzle(nextSeed(seed, 0), "easy");
  const onSolved = vi.fn();
  render(<LogicGrid seed={seed} onSolved={onSolved} onExit={() => {}} />);

  solveGrid(puzzle0);
  expect(onSolved).toHaveBeenCalledTimes(1);

  const nextBtn = document.querySelector(".lg-next");
  expect(nextBtn).toBeTruthy();
  fireEvent.click(nextBtn!);

  // The board resets: the "Next puzzle" button disappears until solved
  // again, and it's showing a freshly generated ("hard") puzzle.
  expect(document.querySelector(".lg-next")).toBeNull();
  const puzzle1 = generatePuzzle(nextSeed(seed, 1), "hard");
  expect(puzzle1.entities).not.toEqual(puzzle0.entities);
  const clueEls = Array.from(document.querySelectorAll(".lg-clues li")).map((el) => el.textContent);
  expect(clueEls).toEqual(puzzle1.clues);

  solveGrid(puzzle1);
  expect(onSolved).toHaveBeenCalledTimes(2);
});
