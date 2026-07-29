import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import type { PuzzleProps } from "../../game/types";
import FractionLaser from "./FractionLaser";
import { generateLevel, solutionFor } from "./generate";
import { fracText } from "./logic";

/**
 * Drive the board to its answer through the UI only.
 *
 * A dial has three positions, so unlike Mirror there is no "click everything
 * once" shortcut: we ask the generator what the answer is and then press each
 * prism until its spoken label says it is set to that share. That still goes
 * entirely through the rendered controls, so it exercises the real click path.
 */
function solveThroughTheUi(seed: number, round = 0) {
  const level = generateLevel(seed + round, Math.min(2, round));
  const answer = solutionFor(level);
  level.splitters.forEach((splitter, i) => {
    const want = fracText(splitter.options[answer[i]!]!);
    const button = screen.getByTestId(`prism-${splitter.row}-${splitter.col}`);
    for (let press = 0; press < splitter.options.length; press++) {
      if (button.getAttribute("aria-label")?.includes(`sending ${want} of the light`)) return;
      fireEvent.click(button);
    }
    throw new Error(`prism ${splitter.row},${splitter.col} never reached ${want}`);
  });
}

test("setting every prism to its share lights every crystal and fires onSolved once", () => {
  const onSolved = vi.fn();
  render(<FractionLaser seed={0} onSolved={onSolved} onExit={() => {}} />);

  expect(onSolved).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent(/Set every prism/i);

  solveThroughTheUi(0);

  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent(/exactly the share it asked for/i);

  // Turning dials past the answer and back must not fire it a second time.
  for (const prism of document.querySelectorAll<HTMLButtonElement>(".fl-prism")) {
    fireEvent.click(prism);
    fireEvent.click(prism);
    fireEvent.click(prism);
  }
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("a crystal only lights when its share is exact", () => {
  render(<FractionLaser seed={4} onSolved={() => {}} onExit={() => {}} />);

  const level = generateLevel(4, 0);
  const anyCrystal = level.collectors[0]!;
  const tile = screen.getByTestId(`crystal-${anyCrystal.row}-${anyCrystal.col}`);
  expect(tile.className).not.toContain("fl-crystal-lit");

  solveThroughTheUi(4);
  expect(tile.className).toContain("fl-crystal-lit");
  expect(document.querySelectorAll(".fl-crystal-lit")).toHaveLength(level.collectors.length);
});

test("every prism is keyboard operable: arrows turn the dial both ways", () => {
  render(<FractionLaser seed={9} onSolved={() => {}} onExit={() => {}} />);

  const prisms = document.querySelectorAll<HTMLButtonElement>(".fl-prism");
  expect(prisms.length).toBeGreaterThan(0);

  for (const prism of prisms) {
    // A real <button>, reachable by Tab, so Enter and Space already work.
    expect(prism.tagName).toBe("BUTTON");
    expect(prism.tabIndex).not.toBe(-1);
    prism.focus();
    expect(document.activeElement).toBe(prism);

    const before = prism.getAttribute("aria-label");
    fireEvent.keyDown(prism, { key: "ArrowUp" });
    const after = prism.getAttribute("aria-label");
    expect(after).not.toBe(before);

    // ArrowDown is the exact inverse, so the dial returns to where it was.
    fireEvent.keyDown(prism, { key: "ArrowDown" });
    expect(prism.getAttribute("aria-label")).toBe(before);
  }
});

test("a solve driven entirely from the keyboard fires onSolved", () => {
  const onSolved = vi.fn();
  render(<FractionLaser seed={21} onSolved={onSolved} onExit={() => {}} />);

  const level = generateLevel(21, 0);
  const answer = solutionFor(level);
  level.splitters.forEach((splitter, i) => {
    const want = fracText(splitter.options[answer[i]!]!);
    const button = screen.getByTestId(`prism-${splitter.row}-${splitter.col}`);
    button.focus();
    for (let press = 0; press < splitter.options.length; press++) {
      if (button.getAttribute("aria-label")?.includes(`sending ${want} of the light`)) break;
      fireEvent.keyDown(button, { key: "ArrowRight" });
    }
  });

  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("Back calls onExit", () => {
  const onExit = vi.fn();
  render(<FractionLaser seed={0} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".fl-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test("the crystals' demands are shown as a sum that makes exactly one whole", () => {
  render(<FractionLaser seed={13} onSolved={() => {}} onExit={() => {}} />);
  const ledger = document.querySelector(".fl-ledger")!;
  const level = generateLevel(13, 0);
  expect(ledger.textContent).toBe(
    `${level.collectors.map((c) => fracText(c.required)).join(" + ")} = 1 whole beam`,
  );
});

test('"Next puzzle" appears only once solved, and opens a fresh, unsolved board', () => {
  const onSolved = vi.fn();
  render(<FractionLaser seed={0} onSolved={onSolved} onExit={() => {}} />);

  expect(document.querySelector(".fl-next")).toBeNull();
  const firstBoard = document.querySelector(".fl-ledger")!.textContent;

  solveThroughTheUi(0);
  expect(onSolved).toHaveBeenCalledTimes(1);

  fireEvent.click(document.querySelector<HTMLButtonElement>(".fl-next")!);

  expect(document.querySelector(".fl-next")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(/Set every prism/i);
  expect(document.querySelector(".fl-ledger")!.textContent).not.toBe(firstBoard);

  // Round 1 steps up a rung: one more prism to work out.
  expect(document.querySelectorAll(".fl-prism")).toHaveLength(3);

  solveThroughTheUi(0, 1);
  expect(onSolved).toHaveBeenCalledTimes(2);
});

test("shows no score, points, streak, star or timer anywhere", () => {
  const { container } = render(<FractionLaser seed={2} onSolved={() => {}} onExit={() => {}} />);
  const read = () =>
    `${container.textContent ?? ""} ${Array.from(container.querySelectorAll("[aria-label]"))
      .map((el) => el.getAttribute("aria-label"))
      .join(" ")}`;

  const banned = /\b(score|points?|streak|stars?|timer|seconds?|level up|best|record|combo)\b/i;
  expect(read()).not.toMatch(banned);
  solveThroughTheUi(2);
  expect(read()).not.toMatch(banned);
});

test("satisfies the registry's puzzle contract", () => {
  // The extra `initialRound` prop is optional, so the component is still a
  // plain PuzzleProps component as far as src/gadgets/registry.ts is
  // concerned. This fails at typecheck, not at runtime, if that stops holding.
  const asGadgetPuzzle: ComponentType<PuzzleProps> = FractionLaser;
  expect(asGadgetPuzzle).toBe(FractionLaser);
});

test("the top rung is a bigger board with more prisms, and still solvable", () => {
  const onSolved = vi.fn();
  render(<FractionLaser seed={6} initialRound={2} onSolved={onSolved} onExit={() => {}} />);

  expect(document.querySelectorAll(".fl-prism")).toHaveLength(4);
  expect(document.querySelectorAll(".fl-crystal")).toHaveLength(5);

  solveThroughTheUi(6, 2);
  expect(onSolved).toHaveBeenCalledTimes(1);
});
