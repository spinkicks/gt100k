import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import BalanceScale, { tierFor } from "./BalanceScale";
import { TIERS, generateLevel } from "./generate";
import { type Move, isLegal, moveLabel } from "./logic";

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
    // `aria-disabled` buttons are excluded because the split rail is always present now and a
    // blocked split is a control that deliberately does nothing to the board (see BalanceScale.tsx).
    // Clicking one would burn a loop iteration without spending a move, and the assertion below
    // would go quietly vacuous.
    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-disabled") !== "true");
    // Any real move, in a deliberately unhelpful order: exchanges first (never progress), then
    // strips, then divides. Including divides matters — some states offer nothing else, and
    // stopping there would leave the budget unspent and the assertion vacuous.
    const next =
      buttons.find((b) => (b.textContent ?? "").startsWith("Break a")) ??
      buttons.find((b) => (b.textContent ?? "").startsWith("Take")) ??
      buttons.find((b) => (b.textContent ?? "").includes("Split both pans"));
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

/* ------------------------------------------------------------------------------------------------
 * THE SPLIT RAIL. Regression tests for a move that was reported invisible twice: rendered only while
 * legal (10 of 360 opening boards), then replaced with a sentence that also did not land. What is
 * asserted here is that the control EXISTS on every board and that its unavailability is expressed on
 * the board rather than by absence.
 * ---------------------------------------------------------------------------------------------- */

/** The rail control for a given factor, found by its accessible name. */
function railSplit(k: number): HTMLElement {
  return screen.getByRole("button", { name: moveLabel({ kind: "divide", k }) });
}

/**
 * Play a level's own solution up to the point where its divide becomes legal, and return that k.
 * Legal splits are far too rare on opening boards to find one by rendering seeds.
 */
function advanceToLegalSplit(seed: number): number {
  const level = generateLevel(seed, 0);
  for (const move of level.solution) {
    if (move.kind === "divide") return move.k;
    fireEvent.click(screen.getByRole("button", { name: moveLabel(move) }));
  }
  throw new Error("this tier guarantees a divide in the shortest solution");
}

describe("the split rail", () => {
  test("is on every board, legal or not — ÷2 and ÷3 always have a control", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { unmount } = render(
        <BalanceScale seed={seed} onSolved={() => {}} onExit={() => {}} />,
      );
      expect(screen.getByTestId("bs-rail")).toBeInTheDocument();
      for (const k of [2, 3]) expect(railSplit(k)).toBeInTheDocument();
      unmount();
    }
  });

  test("marks a blocked split as unavailable instead of hiding or disabling it", () => {
    const level = generateLevel(5, 0);
    render(<BalanceScale seed={5} onSolved={() => {}} onExit={() => {}} />);
    for (const k of [2, 3]) {
      const control = railSplit(k);
      if (isLegal(level.scale, { kind: "divide", k })) continue;
      // Present, focusable, not `disabled` — a disabled control cannot be hovered, focused or
      // pressed, and therefore cannot explain itself. This is the whole affordance argument.
      expect(control).toHaveAttribute("aria-disabled", "true");
      expect(control).not.toHaveAttribute("disabled");
      // Focusing it opens the preview, which is a state update — hence act().
      act(() => control.focus());
      expect(control).toHaveFocus();
    }
  });

  test("pressing a blocked split marks the leftovers on the pans, and pressing it again clears them", () => {
    const { container } = render(<BalanceScale seed={5} onSolved={() => {}} onExit={() => {}} />);
    const control = railSplit(2);
    expect(container.querySelectorAll(".bs-left-over")).toHaveLength(0);
    fireEvent.click(control);
    // The reason is now drawn on the objects that carry it, not written underneath the board.
    expect(container.querySelectorAll(".bs-left-over").length).toBeGreaterThan(0);
    fireEvent.click(control);
    expect(container.querySelectorAll(".bs-left-over")).toHaveLength(0);
  });

  test("pressing a blocked split spends no move", () => {
    render(<BalanceScale seed={5} onSolved={() => {}} onExit={() => {}} />);
    const before = screen.getByText(/moves? left/).textContent;
    fireEvent.click(railSplit(2));
    fireEvent.click(railSplit(3));
    expect(screen.getByText(/moves? left/).textContent).toBe(before);
  });

  test("a blocked split lights the moves that would clear a leftover", () => {
    const { container } = render(<BalanceScale seed={5} onSolved={() => {}} onExit={() => {}} />);
    fireEvent.click(railSplit(2));
    // The causal chain, shown: these buttons change a pile that is in the way. Never all of them —
    // a palette where everything glows points at nothing.
    const lit = container.querySelectorAll(".bs-move-lit");
    expect(lit.length).toBeGreaterThan(0);
    expect(lit.length).toBeLessThan(container.querySelectorAll(".bs-move").length);
  });

  test("focusing a legal split previews what it would take away, before any move is spent", () => {
    const { container } = render(<BalanceScale seed={7} onSolved={() => {}} onExit={() => {}} />);
    const k = advanceToLegalSplit(7);
    const before = screen.getByText(/moves? left/).textContent;
    fireEvent.focus(railSplit(k));
    expect(container.querySelectorAll(".bs-goes").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".bs-left-over")).toHaveLength(0);
    expect(screen.getByText(/moves? left/).textContent).toBe(before);
    fireEvent.blur(railSplit(k));
    expect(container.querySelectorAll(".bs-goes")).toHaveLength(0);
  });

  test("pressing a legal split plays it", () => {
    const { container } = render(<BalanceScale seed={7} onSolved={() => {}} onExit={() => {}} />);
    const k = advanceToLegalSplit(7);
    const stonesBefore = container.querySelectorAll(".bs-stone").length;
    fireEvent.click(railSplit(k));
    // A split halves or thirds everything on both pans, so the board must have got smaller.
    expect(container.querySelectorAll(".bs-stone").length).toBeLessThan(stonesBefore);
  });
});

/* ------------------------------------------------------------------------------------------------
 * TIERS. The tight budget is now a harder tier rather than the first thing a child meets.
 * ---------------------------------------------------------------------------------------------- */

describe("which tier a sitting opens at", () => {
  test("the first encounter gives more moves than the tier the harder-one offer leads to", () => {
    const budgetOnScreen = (tier: number): number => {
      const { unmount } = render(
        <BalanceScale seed={31} tier={tier} onSolved={() => {}} onExit={() => {}} />,
      );
      const text = screen.getByText(/moves? left/).textContent ?? "";
      unmount();
      return Number(/(\d+) moves? left/.exec(text)?.[1]);
    };
    expect(budgetOnScreen(0)).toBeGreaterThan(budgetOnScreen(1));
  });

  test("asking for a harder one never hands back an easier board", () => {
    // The failure `Gadget.supportsTier` exists to prevent: the offer remounts the puzzle, so the
    // asked-for tier has to arrive as a prop and has to be a floor, not a suggestion.
    for (let round = 0; round < 4; round++) {
      for (let chosen = 0; chosen < TIERS.length + 1; chosen++) {
        expect(tierFor(round, chosen + 1)).toBeGreaterThanOrEqual(tierFor(round, chosen));
        expect(tierFor(round, chosen)).toBeGreaterThanOrEqual(Math.min(chosen, TIERS.length - 1));
        expect(tierFor(round, chosen)).toBeLessThanOrEqual(TIERS.length - 1);
      }
    }
  });

  test("the round ramp still alternates, on top of whatever tier was asked for", () => {
    expect(tierFor(0, 0)).toBe(0);
    expect(tierFor(1, 0)).toBe(1);
    expect(tierFor(2, 0)).toBe(0);
    expect(tierFor(0, 1)).toBe(1);
    expect(tierFor(1, 1)).toBe(2);
  });
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
