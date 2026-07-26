import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import BalanceScale from "./BalanceScale";
import { generateLevel } from "./generate";
import { moveLabel } from "./logic";

/** Drive the component through a level's real solution by clicking the labelled move buttons. */
function solveByClicking(seed: number, tierRound = 0): void {
  const level = generateLevel(seed + tierRound, tierRound % 2 === 0 ? 0 : 1);
  for (const move of level.solution) {
    fireEvent.click(screen.getByRole("button", { name: moveLabel(move) }));
  }
}

test("a full solve calls onSolved exactly once", () => {
  const onSolved = vi.fn();
  render(<BalanceScale seed={7} onSolved={onSolved} onExit={() => {}} />);
  solveByClicking(7);
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("solving reveals the bag's weight, which was never shown before", () => {
  const level = generateLevel(11, 0);
  render(<BalanceScale seed={11} onSolved={() => {}} onExit={() => {}} />);
  // The answer must not be sitting on screen at the start — that would make it a reading exercise.
  expect(screen.queryByText(/One bag weighs/)).toBeNull();
  solveByClicking(11);
  expect(screen.getByText(`One bag weighs ${level.scale.bagWeight}.`)).toBeInTheDocument();
});

test("exit calls onExit", () => {
  const onExit = vi.fn();
  render(<BalanceScale seed={3} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(screen.getByRole("button", { name: "← Back" }));
  expect(onExit).toHaveBeenCalledTimes(1);
});

test("every move is a real button, so the puzzle is keyboard operable", () => {
  render(<BalanceScale seed={5} onSolved={() => {}} onExit={() => {}} />);
  const buttons = screen.getAllByRole("button");
  expect(buttons.length).toBeGreaterThan(2);
  for (const button of buttons) {
    expect(button.tagName).toBe("BUTTON");
    expect(button).not.toHaveAttribute("disabled");
  }
});

test("no score, points, streak, star or timer language anywhere", () => {
  // PROJECT.md D7 is a hard constraint, so it gets an assertion rather than a convention.
  // Word-bounded, because plain substring matching flags "Start this one over" for "star".
  const { container } = render(<BalanceScale seed={9} onSolved={() => {}} onExit={() => {}} />);
  const text = (container.textContent ?? "").toLowerCase();
  const banned = [
    /\bscores?\b/,
    /\bpoints?\b/,
    /\bstreaks?\b/,
    /\bstars?\b/,
    /\btimer\b/,
    /\bseconds?\b/,
    /\blevel up\b/,
  ];
  for (const pattern of banned) {
    expect(text).not.toMatch(pattern);
  }
});

test("spending the whole budget resets rather than failing, and never blames the child", () => {
  const level = generateLevel(4, 0);
  render(<BalanceScale seed={4} onSolved={() => {}} onExit={() => {}} />);
  // Spend moves without steering: prefer exchanges (never progress toward the goal), fall back to
  // any strip move. One of two things must happen -- solved, or reset. Asserting the disjunction
  // keeps the test honest whichever way this seed lands, rather than depending on a lucky path.
  for (let i = 0; i < level.budget + 3; i++) {
    const buttons = screen.getAllByRole("button");
    // Any real move, in a deliberately unhelpful order: exchanges first (never progress), then
    // strips, then divides. Including divides matters — some states offer nothing else, and
    // stopping there would leave the budget unspent and the assertion vacuous.
    const next =
      buttons.find((b) => (b.textContent ?? "").startsWith("Break a")) ??
      buttons.find((b) => (b.textContent ?? "").startsWith("Take")) ??
      buttons.find((b) => (b.textContent ?? "").startsWith("Split both pans"));
    if (!next) break;
    fireEvent.click(next);
    // Stop as soon as something is announced. Clicking on would clear the note again, because a
    // successful move resets it — which is correct behaviour and would silently empty the assertion.
    if ((screen.getByRole("status").textContent ?? "").length > 0) break;
  }
  const note = screen.getByRole("status");
  const text = (note.textContent ?? "").toLowerCase();
  expect(text.length).toBeGreaterThan(0);
  expect(text).toMatch(/out of moves|one bag weighs/);
  // Whatever happened, the wording must not be punitive.
  for (const blame of ["fail", "lose", "lost", "wrong", "sorry"]) {
    expect(text).not.toContain(blame);
  }
});

test("the move counter never goes below zero", () => {
  render(<BalanceScale seed={13} onSolved={() => {}} onExit={() => {}} />);
  for (let i = 0; i < 30; i++) {
    const any = screen
      .getAllByRole("button")
      .find(
        (b) =>
          (b.textContent ?? "").startsWith("Take") || (b.textContent ?? "").startsWith("Break"),
      );
    if (!any) break;
    fireEvent.click(any);
  }
  expect(screen.getByText(/moves? left/)).toBeInTheDocument();
  expect(screen.queryByText(/-\d+ moves? left/)).toBeNull();
});

test("advancing to the next puzzle produces a fresh unsolved scale", () => {
  const onSolved = vi.fn();
  render(<BalanceScale seed={21} onSolved={onSolved} onExit={() => {}} />);
  solveByClicking(21);
  fireEvent.click(screen.getByRole("button", { name: "Next puzzle →" }));
  // A new round must not immediately re-fire onSolved, or the once-only contract is broken.
  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("button", { name: "Next puzzle →" })).toBeNull();
});
