import { fireEvent, render } from "@testing-library/react";
import LITS from "./LITS";

test("shading the known solution calls onSolved", () => {
  const onSolved = vi.fn();
  render(<LITS seed={0} onSolved={onSolved} onExit={() => {}} />);
  // click every cell that belongs to the authored solution
  for (const el of Array.from(document.querySelectorAll('[data-solution="1"]'))) {
    fireEvent.click(el);
  }
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("onSolved fires only once even after further clicks", () => {
  const onSolved = vi.fn();
  render(<LITS seed={0} onSolved={onSolved} onExit={() => {}} />);
  const solutionCells = Array.from(document.querySelectorAll('[data-solution="1"]'));
  for (const el of solutionCells) fireEvent.click(el);
  expect(onSolved).toHaveBeenCalledTimes(1);
  // shade-then-unshade a cell — still solved-once, no duplicate calls.
  const first = solutionCells[0]!;
  fireEvent.click(first);
  fireEvent.click(first);
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("an unsolved board never calls onSolved", () => {
  const onSolved = vi.fn();
  render(<LITS seed={1} onSolved={onSolved} onExit={() => {}} />);
  const solutionCells = Array.from(document.querySelectorAll('[data-solution="1"]'));
  // Shade all but the last solution cell — leaves one region incomplete.
  for (const el of solutionCells.slice(0, -1)) fireEvent.click(el);
  expect(onSolved).not.toHaveBeenCalled();
});

test("exit button calls onExit", () => {
  const onExit = vi.fn();
  render(<LITS seed={1} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".lits-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test("no 'Next puzzle' button until solved", () => {
  render(<LITS seed={2} onSolved={() => {}} onExit={() => {}} />);
  expect(document.querySelector(".lits-next")).toBeNull();
});

test("'Next puzzle' loads a different bank puzzle, resets the board, and does not exit", () => {
  const onSolved = vi.fn();
  const onExit = vi.fn();
  render(<LITS seed={5} onSolved={onSolved} onExit={onExit} />);

  const solutionCells = () => Array.from(document.querySelectorAll('[data-solution="1"]'));
  // Snapshot which cells are the current puzzle's solution before shading any of them —
  // this is the puzzle's "identity" for comparison after advancing.
  const keysBefore = solutionCells().map((el) =>
    el.getAttribute("aria-label")?.replace(", shaded", ""),
  );

  for (const el of solutionCells()) fireEvent.click(el);
  expect(onSolved).toHaveBeenCalledTimes(1);

  const nextBtn = document.querySelector(".lits-next");
  expect(nextBtn).toBeTruthy();
  fireEvent.click(nextBtn!);

  // Board resets (nothing shaded, "Next puzzle" hidden again until re-solved) and the
  // subgame does NOT auto-close.
  expect(document.querySelectorAll(".lits-shaded").length).toBe(0);
  expect(document.querySelector(".lits-next")).toBeNull();
  expect(onExit).not.toHaveBeenCalled();

  const keysAfter = solutionCells().map((el) =>
    el.getAttribute("aria-label")?.replace(", shaded", ""),
  );
  expect(keysAfter).not.toEqual(keysBefore);

  // The new puzzle is still fully solvable through the UI.
  for (const el of solutionCells()) fireEvent.click(el);
  expect(onSolved).toHaveBeenCalledTimes(2);
});
