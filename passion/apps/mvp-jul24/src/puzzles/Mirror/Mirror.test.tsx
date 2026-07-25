import { fireEvent, render, screen } from "@testing-library/react";
import Mirror from "./Mirror";

// Level for seed=0 (see logic.ts LEVEL_1): one mirror at row 1, column 3 (1-indexed
// in the aria-label), starting as "/" and needing one rotation to "\" to route the
// beam from the emitter down onto the target.

test("rotating the mirror routes the beam to the target and fires onSolved once", () => {
  const onSolved = vi.fn();
  render(<Mirror seed={0} onSolved={onSolved} onExit={() => {}} />);

  const mirror = screen.getByLabelText(/mirror row 1 column 3/i);
  expect(onSolved).not.toHaveBeenCalled();

  fireEvent.click(mirror);

  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent(/locked onto the target/i);

  // Clicking further (rotating back and forth) must not call onSolved again.
  fireEvent.click(mirror);
  fireEvent.click(mirror);
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
