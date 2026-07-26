import { fireEvent, render, screen } from "@testing-library/react";
import RatioMixing, { jarColumns } from "./RatioMixing";
import { EASY_TIER, HARD_TIER, generateOrder, nextSeed, tierForIndex } from "./generate";
import type { RatioPuzzle } from "./logic";

/** The order the component will build for a given seed and "next order" click count. */
const orderFor = (seed: number, index: number): RatioPuzzle =>
  generateOrder(nextSeed(seed, index), tierForIndex(index));

const pourButtons = () => Array.from(document.querySelectorAll<HTMLButtonElement>(".rm-pour"));

/** Pours the correct batch, exactly as a player would: one click per ladle. */
function pourSolution(order: RatioPuzzle) {
  order.solution.forEach((count, vat) => {
    for (let n = 0; n < count; n++) {
      const button = document.querySelector<HTMLButtonElement>(`.rm-pour[data-vat="${vat}"]`);
      expect(button).not.toBeNull();
      expect(button!.disabled).toBe(false);
      fireEvent.click(button!);
    }
  });
}

test("pouring the correct batch calls onSolved exactly once", () => {
  const onSolved = vi.fn();
  render(<RatioMixing seed={11} onSolved={onSolved} onExit={() => {}} />);

  expect(onSolved).not.toHaveBeenCalled();
  pourSolution(orderFor(11, 0));
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("a jar that is full but off-ratio does not solve anything", () => {
  const onSolved = vi.fn();
  const order = orderFor(23, 0);
  render(<RatioMixing seed={23} onSolved={onSolved} onExit={() => {}} />);

  // "Just keep using the dark one." That is `alwaysSameVat(_, "darkest")` from naive.ts, and the
  // generator refuses to emit an order it solves — so the jar ends full or jammed, never right.
  for (let guard = 0; guard < order.capacity; guard++) {
    const open = pourButtons().filter((b) => !b.disabled);
    if (open.length === 0) break;
    fireEvent.click(open[open.length - 1]!);
  }
  expect(onSolved).not.toHaveBeenCalled();
  expect(document.querySelector(".rm-next")).toBeNull();
});

test("pouring is irreversible: there is no undo, only a fresh batch", () => {
  render(<RatioMixing seed={5} onSolved={() => {}} onExit={() => {}} />);
  const labels = Array.from(document.querySelectorAll("button")).map((b) => b.textContent ?? "");
  expect(labels.some((t) => /undo|take back|remove/i.test(t))).toBe(false);

  const reset = document.querySelector<HTMLButtonElement>(".rm-reset")!;
  expect(reset.disabled).toBe(true); // nothing to pour out yet

  fireEvent.click(pourButtons()[0]!);
  expect(document.querySelector(".rm-readout-units")!.textContent).not.toMatch(/^0 of/);

  fireEvent.click(document.querySelector(".rm-reset")!);
  expect(document.querySelector(".rm-readout-units")!.textContent).toMatch(/^0 of/);
  expect(document.querySelector(".rm-readout-ratio")!.textContent).toBe("empty jar");
});

test("a vat cannot be poured once its ladle would overflow the jar", () => {
  const order = orderFor(77, 0);
  render(<RatioMixing seed={77} onSolved={() => {}} onExit={() => {}} />);
  pourSolution(order);
  // Brim-full: every vat is refused rather than spilling.
  for (const button of pourButtons()) expect(button.disabled).toBe(true);
});

test("exit button calls onExit", () => {
  const onExit = vi.fn();
  render(<RatioMixing seed={1} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".rm-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test("'Next order' only appears once the jar is right, and starts a different order", () => {
  const onSolved = vi.fn();
  render(<RatioMixing seed={9} onSolved={onSolved} onExit={() => {}} />);
  expect(document.querySelector(".rm-next")).toBeNull();

  const first = orderFor(9, 0);
  pourSolution(first);
  expect(onSolved).toHaveBeenCalledTimes(1);

  const next = document.querySelector(".rm-next");
  expect(next).not.toBeNull();
  fireEvent.click(next!);

  // Fresh, empty jar; a harder bench (the tiers alternate); no repeat onSolved.
  expect(document.querySelector(".rm-next")).toBeNull();
  expect(document.querySelector(".rm-readout-units")!.textContent).toMatch(/^0 of/);
  expect(pourButtons()).toHaveLength(HARD_TIER.vatCount);
  expect(onSolved).toHaveBeenCalledTimes(1);

  pourSolution(orderFor(9, 1));
  expect(onSolved).toHaveBeenCalledTimes(2);
});

test("the first bench of a session is the easy tier", () => {
  render(<RatioMixing seed={3} onSolved={() => {}} onExit={() => {}} />);
  expect(pourButtons()).toHaveLength(EASY_TIER.vatCount);
});

test("the order card states the ratio and the capacity, and never the answer", () => {
  const order = orderFor(15, 0);
  render(<RatioMixing seed={15} onSolved={() => {}} onExit={() => {}} />);

  const card = document.querySelector(".rm-order")!.textContent ?? "";
  expect(card).toContain(`${order.targetDye} : ${order.targetWater}`);
  expect(card).toContain(`${order.capacity} units`);

  // Scaling the ratio up to the jar is the puzzle, so the unit counts must not be printed.
  const parts = order.targetDye + order.targetWater;
  const dyeUnits = (order.capacity / parts) * order.targetDye;
  const waterUnits = order.capacity - dyeUnits;
  expect(card).not.toContain(`${dyeUnits} dye`);
  expect(card).not.toContain(`${waterUnits} water`);
  // Nor may the ladle counts be given away anywhere on the bench.
  const page = document.body.textContent ?? "";
  expect(page).not.toContain(order.solution.join(" "));
});

test("the jar reports itself in numbers, not just colour", () => {
  render(<RatioMixing seed={15} onSolved={() => {}} onExit={() => {}} />);
  const order = orderFor(15, 0);

  fireEvent.click(document.querySelector('.rm-pour[data-vat="0"]')!);
  const vat = order.vats[0]!;
  expect(document.querySelector(".rm-readout-units")!.textContent).toBe(
    `${vat.dye + vat.water} of ${order.capacity} units`,
  );
  expect(document.querySelector(".rm-readout-split")!.textContent).toBe(
    `${vat.dye} dye, ${vat.water} water`,
  );
});

test("every vat is reachable and operable from the keyboard alone", () => {
  const onSolved = vi.fn();
  const order = orderFor(31, 0);
  render(<RatioMixing seed={31} onSolved={onSolved} onExit={() => {}} />);

  for (const button of pourButtons()) {
    expect(button.tabIndex).toBe(0);
    expect(button.getAttribute("aria-label")).toMatch(/Pour from Vat/);
  }

  // Keyboard activation of a native <button> is a click event; drive the whole solve that way.
  order.solution.forEach((count, vat) => {
    const button = document.querySelector<HTMLButtonElement>(`.rm-pour[data-vat="${vat}"]`)!;
    for (let n = 0; n < count; n++) {
      button.focus();
      expect(document.activeElement).toBe(button);
      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.click(button); // what the browser dispatches for Enter on a button
    }
  });
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("the jar is drawn one square per unit, in full rows wherever possible", () => {
  const order = orderFor(15, 0);
  render(<RatioMixing seed={15} onSolved={() => {}} onExit={() => {}} />);
  expect(document.querySelectorAll(".rm-unit")).toHaveLength(order.capacity);

  // Full rows keep the contents countable in groups, which is the point of drawing units at all.
  for (const capacity of [18, 20, 24, 30, 32, 35, 36, 40, 42]) {
    expect(capacity % jarColumns(capacity)).toBe(0);
  }
  expect(jarColumns(8)).toBe(8);
  expect(jarColumns(23)).toBe(10); // prime-ish capacity: ten-frames, ragged last row
});

test("the jar's contents are announced for screen readers", () => {
  render(<RatioMixing seed={2} onSolved={() => {}} onExit={() => {}} />);
  const live = document.querySelector(".rm-readout")!;
  expect(live.getAttribute("aria-live")).toBe("polite");
});

test("no score, points, stars, streak, timer or attempt count anywhere — before or after solving", () => {
  const forbidden =
    /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|level up|best|record|badge|reward)\b/i;

  render(<RatioMixing seed={42} onSolved={() => {}} onExit={() => {}} />);
  const readAll = () => {
    const text = document.body.textContent ?? "";
    const labels = Array.from(document.querySelectorAll("[aria-label]"))
      .map((el) => el.getAttribute("aria-label"))
      .join(" ");
    return `${text} ${labels}`;
  };

  expect(readAll()).not.toMatch(forbidden);
  pourSolution(orderFor(42, 0));
  expect(screen.getByText("Exactly right.")).toBeInTheDocument();
  expect(readAll()).not.toMatch(forbidden);
});

test("a dead-end batch says so plainly, with no failure language", () => {
  const order = orderFor(23, 0);
  render(<RatioMixing seed={23} onSolved={() => {}} onExit={() => {}} />);
  for (let guard = 0; guard < order.capacity; guard++) {
    const open = pourButtons().filter((b) => !b.disabled);
    if (open.length === 0) break;
    fireEvent.click(open[open.length - 1]!);
  }
  expect(document.querySelector(".rm-note")!.textContent).toBe("Nothing left fits this jar.");
  expect(document.body.textContent ?? "").not.toMatch(
    /\b(wrong|failed|lost|oops|sorry|try again)\b/i,
  );
  // And the way out is one ordinary click.
  fireEvent.click(document.querySelector(".rm-reset")!);
  expect(document.querySelector(".rm-readout-units")!.textContent).toMatch(/^0 of/);
});
