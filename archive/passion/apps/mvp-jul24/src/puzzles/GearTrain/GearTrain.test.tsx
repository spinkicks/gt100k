import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import GearTrain from "./GearTrain";
import { generateLevel } from "./generate";
import { SLOTS } from "./logic";

/** Place the level's real solution by picking each gear from the rack and clicking its slot. */
function solveByClicking(seed: number, round = 0): void {
  const { solution } = generateLevel(seed + round, round % 2 === 0 ? 0 : 1);
  for (const slot of SLOTS) {
    const teeth = solution[slot] as number;
    fireEvent.click(screen.getByRole("button", { name: `${teeth} teeth` }));
    const slotButton = screen
      .getAllByRole("button")
      .find(
        (b) =>
          (b.className ?? "").includes("gt-slot") &&
          !(b.className ?? "").includes("gt-slot-filled"),
      );
    if (!slotButton) throw new Error(`no empty slot for ${slot}`);
    fireEvent.click(slotButton);
  }
}

test("a full solve calls onSolved exactly once", () => {
  const onSolved = vi.fn();
  render(<GearTrain seed={5} onSolved={onSolved} onExit={() => {}} />);
  solveByClicking(5);
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("exit calls onExit", () => {
  const onExit = vi.fn();
  render(<GearTrain seed={2} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(screen.getByRole("button", { name: "← Back" }));
  expect(onExit).toHaveBeenCalledTimes(1);
});

test("the target is stated up front, and the realign count only once the train is complete", () => {
  const { train } = generateLevel(8, 0);
  const { container } = render(<GearTrain seed={8} onSolved={() => {}} onExit={() => {}} />);
  expect(screen.getByText(/Fill all three slots/)).toBeInTheDocument();
  // Scoped to the rule sentence: a bare /20/ also matches a "20 teeth" gear in the rack.
  const rule = container.querySelector(".gt-rule");
  expect(rule?.textContent).toContain(String(train.target));
  solveByClicking(8);
  expect(screen.getByText(/ember tooth back on top after/)).toBeInTheDocument();
});

test("a gear can be taken back out, so nothing is committing", () => {
  render(<GearTrain seed={12} onSolved={() => {}} onExit={() => {}} />);
  const { train } = generateLevel(12, 0);
  const first = train.inventory[0] as number;
  fireEvent.click(screen.getByRole("button", { name: `${first} teeth` }));
  const empty = screen.getAllByRole("button").find((b) => (b.className ?? "").includes("gt-slot"));
  if (!empty) throw new Error("no slot");
  fireEvent.click(empty);
  // The gear left the rack...
  expect(screen.queryByRole("button", { name: `${first} teeth` })).toBeNull();
  // ...and clicking the filled slot returns it.
  const filled = screen
    .getAllByRole("button")
    .find((b) => (b.className ?? "").includes("gt-slot-filled"));
  if (!filled) throw new Error("slot not filled");
  fireEvent.click(filled);
  expect(screen.getByRole("button", { name: `${first} teeth` })).toBeInTheDocument();
});

test("teeth are drawn as countable geometry, not just printed", () => {
  const { train } = generateLevel(3, 0);
  const { container } = render(<GearTrain seed={3} onSolved={() => {}} onExit={() => {}} />);
  // The crank is always on screen, so its teeth must be real polygons — one per tooth.
  const polys = container.querySelectorAll("svg polygon");
  expect(polys.length).toBeGreaterThanOrEqual(train.crankTeeth);
});

test("every control is a real button, so the puzzle is keyboard operable", () => {
  render(<GearTrain seed={6} onSolved={() => {}} onExit={() => {}} />);
  const buttons = screen.getAllByRole("button");
  expect(buttons.length).toBeGreaterThan(4);
  for (const button of buttons) {
    expect(button.tagName).toBe("BUTTON");
    expect(button).not.toHaveAttribute("disabled");
  }
});

test("no score, points, streak, star or timer language anywhere", () => {
  // PROJECT.md D7 is a hard constraint, so it gets an assertion rather than a convention.
  const { container } = render(<GearTrain seed={9} onSolved={() => {}} onExit={() => {}} />);
  const text = (container.textContent ?? "").toLowerCase();
  for (const pattern of [
    /\bscores?\b/,
    /\bpoints?\b/,
    /\bstreaks?\b/,
    /\bstars?\b/,
    /\btimer\b/,
    /\bseconds?\b/,
    /\blevel up\b/,
  ]) {
    expect(text).not.toMatch(pattern);
  }
});

test("advancing produces a fresh unsolved train without re-firing onSolved", () => {
  const onSolved = vi.fn();
  render(<GearTrain seed={15} onSolved={onSolved} onExit={() => {}} />);
  solveByClicking(15);
  fireEvent.click(screen.getByRole("button", { name: "Next puzzle →" }));
  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Fill all three slots/)).toBeInTheDocument();
});
