import { fireEvent, render } from "@testing-library/react";
import Nonogram from "./Nonogram";

const solutionSignature = () =>
  Array.from(document.querySelectorAll(".ng-grid-cell"))
    .map((el) => el.getAttribute("data-fill"))
    .join("");

const fillSolutionCells = () => {
  for (const el of Array.from(document.querySelectorAll('[data-fill="1"]'))) fireEvent.click(el);
};

test("generates a puzzle on mount and solving it calls onSolved", () => {
  const onSolved = vi.fn();
  render(<Nonogram seed={0} onSolved={onSolved} onExit={() => {}} />);
  expect(document.querySelectorAll(".ng-grid-cell").length).toBeGreaterThan(0);
  // click every cell that should be filled (data-fill="1")
  fillSolutionCells();
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("exit button calls onExit", () => {
  const onExit = vi.fn();
  render(<Nonogram seed={1} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".ng-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test("no 'Next puzzle' button before the puzzle is solved", () => {
  render(<Nonogram seed={2} onSolved={() => {}} onExit={() => {}} />);
  expect(document.querySelector(".ng-next")).toBeNull();
});

test("after solving, 'Next puzzle' appears, regenerates a different puzzle, and does not re-fire onSolved", () => {
  const onSolved = vi.fn();
  render(<Nonogram seed={3} onSolved={onSolved} onExit={() => {}} />);
  fillSolutionCells();
  expect(onSolved).toHaveBeenCalledTimes(1);

  const nextButton = document.querySelector(".ng-next");
  expect(nextButton).not.toBeNull();

  const firstSignature = solutionSignature();
  fireEvent.click(nextButton!);

  // The board reset (no cells left "filled" from the previous solve) and a
  // different underlying puzzle was generated.
  expect(document.querySelectorAll('.ng-grid-cell[data-fill="1"].ng-filled').length).toBe(0);
  expect(solutionSignature()).not.toBe(firstSignature);
  expect(document.querySelector(".ng-next")).toBeNull();

  // Solving the new puzzle fires onSolved again (once per puzzle).
  fillSolutionCells();
  expect(onSolved).toHaveBeenCalledTimes(2);
});
