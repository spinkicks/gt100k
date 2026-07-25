import { fireEvent, render } from "@testing-library/react";
import Chess from "./Chess";

const clickSquare = (name: string) => {
  const el = document.querySelector(`[data-square="${name}"]`);
  if (!el) throw new Error(`square ${name} not found`);
  fireEvent.click(el);
};

test("playing the mate-in-1 solution move calls onSolved", () => {
  const onSolved = vi.fn();
  render(<Chess seed={0} onSolved={onSolved} onExit={() => {}} />);

  clickSquare("a1"); // select the white rook
  clickSquare("a8"); // the winning back-rank mate

  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("a wrong-but-legal move shows a hint and resets instead of solving", () => {
  const onSolved = vi.fn();
  render(<Chess seed={0} onSolved={onSolved} onExit={() => {}} />);

  clickSquare("a1"); // select the white rook
  clickSquare("a5"); // legal rook move, but not the solution

  expect(onSolved).not.toHaveBeenCalled();
  expect(document.querySelector(".cx-message-show")).not.toBeNull();

  // Position reset: the rook is back on a1 and can still find the mate.
  clickSquare("a1");
  clickSquare("a8");
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("multi-move puzzle: player move, auto opponent reply, then the winning capture solves it", () => {
  const onSolved = vi.fn();
  render(<Chess seed={1} onSolved={onSolved} onExit={() => {}} />);

  clickSquare("e4"); // select the white knight
  clickSquare("f6"); // knight hops in with check
  expect(onSolved).not.toHaveBeenCalled();

  // The scripted black king reply (e8 -> e7) should have been auto-played.
  expect(document.querySelector('[data-square="e7"]')?.textContent).toBe("♚");

  clickSquare("h1"); // select the white rook
  clickSquare("h4"); // capture the undefended queen

  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("back button calls onExit", () => {
  const onExit = vi.fn();
  render(<Chess seed={0} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".cx-exit")!);
  expect(onExit).toHaveBeenCalled();
});
