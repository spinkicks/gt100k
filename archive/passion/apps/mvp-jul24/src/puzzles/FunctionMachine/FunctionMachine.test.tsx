import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import type { PuzzleProps } from "../../game/types";
import FunctionMachine from "./FunctionMachine";
import { PROBE_BUDGET, generateMachine } from "./generate";
import { applyRule } from "./logic";

/** The input this machine is currently withholding, read off the rendered pad. */
function heldOutInput(): number {
  const tile = document.querySelector(".fm-tile-held")!;
  return Number(tile.querySelector(".fm-in")!.textContent);
}

function predict(value: number) {
  fireEvent.change(screen.getByLabelText(/What comes out\?/i), {
    target: { value: String(value) },
  });
  fireEvent.submit(document.querySelector(".fm-predict")!);
}

test("probing, then predicting the held-out input correctly, fires onSolved once", () => {
  const onSolved = vi.fn();
  render(<FunctionMachine seed={0} onSolved={onSolved} onExit={() => {}} />);
  const machine = generateMachine(0, 0);

  // Probe a couple of inputs the way a player would, then commit.
  fireEvent.click(screen.getByLabelText("run 2 through the machine"));
  fireEvent.click(screen.getByLabelText("run 3 through the machine"));
  expect(screen.getByLabelText(`input 2 came out as ${applyRule(machine.rule, 2)}`)).toBeTruthy();

  const held = heldOutInput();
  expect(onSolved).not.toHaveBeenCalled();

  predict(applyRule(machine.rule, held));

  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent(/Right: /);
  // Solving opens the machine up and says what it was doing — the point of
  // the activity is the rule, so the rule is what you get.
  expect(screen.getByRole("status")).toHaveTextContent(/The machine's rule was to/);
  // No way to fire it twice: the prediction box is gone once it is right.
  expect(document.querySelector(".fm-predict")).toBeNull();
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("a wrong prediction reveals that input and moves to a new one — never a loss", () => {
  const onSolved = vi.fn();
  render(<FunctionMachine seed={5} onSolved={onSolved} onExit={() => {}} />);
  const machine = generateMachine(5, 0);

  const first = heldOutInput();
  const truth = applyRule(machine.rule, first);
  predict(truth + 1);

  expect(onSolved).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent(
    new RegExp(`${first} comes out as ${truth}`),
  );
  // The missed input is now a known fact on the pad, not a penalty.
  expect(screen.getByLabelText(`input ${first} came out as ${truth}`)).toBeTruthy();
  // A different input is being withheld, and the prediction box is still open.
  const second = heldOutInput();
  expect(second).not.toBe(first);
  expect(document.querySelector(".fm-predict")).not.toBeNull();

  predict(applyRule(machine.rule, second));
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("the machine only runs its allowance of inputs, and never the held-out one", () => {
  render(<FunctionMachine seed={7} onSolved={() => {}} onExit={() => {}} />);

  const held = heldOutInput();
  expect(screen.queryByLabelText(`run ${held} through the machine`)).toBeNull();

  const available = () => document.querySelectorAll(".fm-tile-open").length;
  expect(available()).toBe(12 - 1);

  let spent = 0;
  while (available() > 0 && spent < 12) {
    fireEvent.click(document.querySelector<HTMLButtonElement>(".fm-tile-open")!);
    spent++;
  }
  expect(spent).toBe(PROBE_BUDGET);
  expect(document.querySelectorAll(".fm-tile-known")).toHaveLength(PROBE_BUDGET);
  expect(screen.getByText(/The machine is resting/)).toBeTruthy();

  // Running out of runs is not a fail state: predicting is still open.
  expect(document.querySelector(".fm-predict")).not.toBeNull();
  expect(heldOutInput()).toBe(held);
});

test("is keyboard operable: pad tiles are real buttons and the form submits on Enter", () => {
  const onSolved = vi.fn();
  render(<FunctionMachine seed={11} onSolved={onSolved} onExit={() => {}} />);
  const machine = generateMachine(11, 0);

  const tile = document.querySelector<HTMLButtonElement>(".fm-tile-open")!;
  expect(tile.tagName).toBe("BUTTON");
  expect(tile.tabIndex).not.toBe(-1);
  tile.focus();
  expect(document.activeElement).toBe(tile);
  fireEvent.click(tile);
  expect(document.querySelectorAll(".fm-tile-known")).toHaveLength(1);

  // The prediction field is labelled, focusable, and inside a form, so Enter
  // submits it without reaching for the mouse.
  const field = screen.getByLabelText(/What comes out\?/i) as HTMLInputElement;
  field.focus();
  expect(document.activeElement).toBe(field);
  expect(field.form).not.toBeNull();

  const held = heldOutInput();
  fireEvent.change(field, { target: { value: String(applyRule(machine.rule, held)) } });
  fireEvent.submit(field.form!);
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("an empty or nonsense prediction is ignored rather than counted as wrong", () => {
  render(<FunctionMachine seed={3} onSolved={() => {}} onExit={() => {}} />);
  const held = heldOutInput();

  fireEvent.submit(document.querySelector(".fm-predict")!);
  expect(heldOutInput()).toBe(held);
  expect(document.querySelectorAll(".fm-tile-revealed")).toHaveLength(0);

  fireEvent.change(screen.getByLabelText(/What comes out\?/i), { target: { value: "abc" } });
  fireEvent.submit(document.querySelector(".fm-predict")!);
  expect(heldOutInput()).toBe(held);
});

test("Back calls onExit", () => {
  const onExit = vi.fn();
  render(<FunctionMachine seed={0} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".fm-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test('"New machine" appears only once solved, and brings a different hidden rule', () => {
  const onSolved = vi.fn();
  render(<FunctionMachine seed={0} onSolved={onSolved} onExit={() => {}} />);

  expect(document.querySelector(".fm-next")).toBeNull();

  predict(applyRule(generateMachine(0, 0).rule, heldOutInput()));
  expect(onSolved).toHaveBeenCalledTimes(1);

  fireEvent.click(document.querySelector<HTMLButtonElement>(".fm-next")!);

  // Fresh machine: nothing run yet, full allowance, prediction box open again.
  expect(document.querySelector(".fm-next")).toBeNull();
  expect(document.querySelectorAll(".fm-tile-known")).toHaveLength(0);
  expect(screen.getByText(`The machine will run ${PROBE_BUDGET} more inputs.`)).toBeTruthy();
  expect(screen.getByRole("status")).toHaveTextContent(/Run inputs through the machine/);

  // Round 1 steps up a rung, so the next rule is a curve rather than a line.
  const next = generateMachine(1, 1);
  expect(["square", "quadratic"]).toContain(next.rule.family);

  predict(applyRule(next.rule, heldOutInput()));
  expect(onSolved).toHaveBeenCalledTimes(2);
});

test("shows no score, points, streak, star or timer anywhere", () => {
  const { container } = render(<FunctionMachine seed={2} onSolved={() => {}} onExit={() => {}} />);
  const read = () =>
    `${container.textContent ?? ""} ${Array.from(container.querySelectorAll("[aria-label]"))
      .map((el) => el.getAttribute("aria-label"))
      .join(" ")}`;

  const banned =
    /\b(score|points?|streak|stars?|timer|seconds?|level up|best|record|combo|lives?)\b/i;
  expect(read()).not.toMatch(banned);

  // Including in the two states where a scoring game would show one.
  const machine = generateMachine(2, 0);
  predict(applyRule(machine.rule, heldOutInput()) + 3);
  expect(read()).not.toMatch(banned);
  predict(applyRule(machine.rule, heldOutInput()));
  expect(read()).not.toMatch(banned);
});

test("satisfies the registry's puzzle contract", () => {
  const asGadgetPuzzle: ComponentType<PuzzleProps> = FunctionMachine;
  expect(asGadgetPuzzle).toBe(FunctionMachine);
});

test("the top rung hides a case-split or wrap-round rule, and still plays", () => {
  const onSolved = vi.fn();
  render(<FunctionMachine seed={6} initialRound={2} onSolved={onSolved} onExit={() => {}} />);

  const machine = generateMachine(6 + 2, 2);
  expect(["modular", "alternating"]).toContain(machine.rule.family);

  fireEvent.click(document.querySelector<HTMLButtonElement>(".fm-tile-open")!);
  predict(applyRule(machine.rule, heldOutInput()));
  expect(onSolved).toHaveBeenCalledTimes(1);
});
