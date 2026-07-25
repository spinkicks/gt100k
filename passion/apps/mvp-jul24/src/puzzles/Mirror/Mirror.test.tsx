import { fireEvent, render, screen } from "@testing-library/react";
import Mirror from "./Mirror";

// Every generated level's mirrors start flipped from the solution orientation
// (see generate.ts), so clicking every mirror on the board exactly once is
// always the full solution regardless of which board a given seed produced.
function solveByClickingEveryMirror() {
  const mirrors = document.querySelectorAll<HTMLButtonElement>(".mr-mirror");
  expect(mirrors.length).toBeGreaterThan(0);
  for (const mirror of mirrors) fireEvent.click(mirror);
}

test("rotating every mirror once routes the beam to the target and fires onSolved once", () => {
  const onSolved = vi.fn();
  render(<Mirror seed={0} onSolved={onSolved} onExit={() => {}} />);

  expect(onSolved).not.toHaveBeenCalled();

  solveByClickingEveryMirror();

  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent(/locked onto the target/i);

  // Clicking further (rotating back and forth) must not call onSolved again.
  const mirrors = document.querySelectorAll<HTMLButtonElement>(".mr-mirror");
  for (const mirror of mirrors) {
    fireEvent.click(mirror);
    fireEvent.click(mirror);
  }
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("clicking a floor or target cell does nothing (only mirrors rotate)", () => {
  const onSolved = vi.fn();
  render(<Mirror seed={0} onSolved={onSolved} onExit={() => {}} />);
  fireEvent.click(screen.getByLabelText("target"));
  expect(onSolved).not.toHaveBeenCalled();
});

test("Back button calls onExit", () => {
  const onExit = vi.fn();
  render(<Mirror seed={0} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".mr-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test('"Next puzzle" only appears once solved, and generates a fresh, unsolved board', () => {
  const onSolved = vi.fn();
  render(<Mirror seed={0} onSolved={onSolved} onExit={() => {}} />);

  expect(document.querySelector(".mr-next")).toBeNull();

  const firstBoardMirrors = Array.from(document.querySelectorAll(".mr-mirror")).map((el) =>
    el.getAttribute("aria-label"),
  );

  solveByClickingEveryMirror();
  expect(onSolved).toHaveBeenCalledTimes(1);

  const nextButton = document.querySelector<HTMLButtonElement>(".mr-next");
  expect(nextButton).not.toBeNull();
  fireEvent.click(nextButton!);

  // The new round starts unsolved again, and the "Next puzzle" control
  // disappears until the player solves this new board too.
  expect(document.querySelector(".mr-next")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(/rotate it and guide the beam/i);

  const secondBoardMirrors = Array.from(document.querySelectorAll(".mr-mirror")).map((el) =>
    el.getAttribute("aria-label"),
  );
  expect(secondBoardMirrors).not.toEqual(firstBoardMirrors);

  // Solving the new board fires onSolved again (once per round).
  solveByClickingEveryMirror();
  expect(onSolved).toHaveBeenCalledTimes(2);
});
