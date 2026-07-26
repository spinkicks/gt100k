import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import * as registry from "../gadgets/registry";
import { useGame } from "../game/store";
import type { Gadget, PuzzleProps } from "../game/types";
import { useInterest } from "../interest/store";
import { SIZES } from "../puzzles/Nonogram/Nonogram";
import GadgetOverlay from "./GadgetOverlay";

beforeEach(() => {
  useGame.getState().goToMap();
  useInterest.getState().reset();
});

// Belt-and-suspenders: if a stub-gadget test throws mid-assertion, its `spy.mockRestore()` call
// below never runs, and the next test would render the stub instead of the real Nonogram it
// expects. Restoring here (not just inline) means a failure stays a single-test failure.
afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * A stub puzzle that solves on one click and echoes its `tier` prop into a `data-tier`
 * *attribute* — never text, because the no-visible-number test below reads `textContent`, and
 * production markup must never render a tier at all (PRD §11). Solving a real generated Nonogram
 * through the DOM would exercise the generator, not the overlay's offer-a-harder-variant plumbing,
 * so `gadgetById` is spied per-test (same technique the "coming-soon" test above already uses)
 * rather than `vi.mock`-ing the whole registry module, which would also swap out the real Nonogram
 * that the other tests in this file render and solve for real.
 */
function StubPuzzle({ tier, onSolved, onExit }: PuzzleProps) {
  return (
    <div data-testid="stub-puzzle" data-tier={tier ?? 0}>
      <button type="button" data-testid="qa-solve" onClick={onSolved}>
        solve
      </button>
      <button type="button" onClick={onExit}>
        exit
      </button>
    </div>
  );
}

/**
 * `supportsTier` defaults to `true` here because most of these tests are specifically about the
 * offer existing and the tier reaching the puzzle. The one test that needs it unset (the
 * regression guard for the "harder can hand back an easier board" bug) passes `{ supportsTier:
 * false }` explicitly — see below.
 */
function mockStubGadget(overrides: Partial<Gadget> = {}) {
  return vi.spyOn(registry, "gadgetById").mockImplementation((id: string) => ({
    id,
    topic: "logic-games",
    label: "Stub",
    status: "active",
    hotspot: { xPct: 50, yPct: 50, label: "Stub" },
    Puzzle: StubPuzzle,
    supportsTier: true,
    ...overrides,
  }));
}

// The offered harder variant. A CHOICE: the easier path stays available beside it, so nothing is
// gated and nothing escalates unasked.
test("the solved state offers a harder variant and an unchanged way back", () => {
  const spy = mockStubGadget();
  useGame.getState().focusGadget("nonogram");
  render(<GadgetOverlay />);
  fireEvent.click(screen.getByTestId("qa-solve"));
  expect(screen.getByRole("button", { name: /harder/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  spy.mockRestore();
});

// PRD §11 again: a visible tier/level number is a quantified display of the child's own
// engagement, which is what the child-facing readout was removed for.
test("no tier or level number is ever rendered", () => {
  const spy = mockStubGadget();
  useGame.getState().focusGadget("nonogram");
  const { container } = render(<GadgetOverlay />);
  fireEvent.click(screen.getByTestId("qa-solve"));
  fireEvent.click(screen.getByRole("button", { name: /harder/i }));
  expect(container.textContent).not.toMatch(/\b(tier|level|difficulty)\b/i);
  expect(container.textContent).not.toMatch(/\b\d+\s*\/\s*\d+\b/);
  spy.mockRestore();
});

test("the chosen tier reaches the puzzle", () => {
  const spy = mockStubGadget();
  useGame.getState().focusGadget("nonogram");
  render(<GadgetOverlay />);
  expect(screen.getByTestId("stub-puzzle")).toHaveAttribute("data-tier", "0");
  fireEvent.click(screen.getByTestId("qa-solve"));
  fireEvent.click(screen.getByRole("button", { name: /harder/i }));
  expect(screen.getByTestId("stub-puzzle")).toHaveAttribute("data-tier", "1");
  spy.mockRestore();
});

// Regression guard for the Critical: "harder" must not appear for a gadget whose component
// ignores `tier` — for eight of the nine real gadgets, remounting resets their own round state to
// its easy default, so an unconditional button would silently hand back an EASIER board than the
// one just solved. `supportsTier` is the flag that prevents that; this proves the overlay actually
// reads it rather than always offering.
test("a gadget without supportsTier offers no harder-variant button", () => {
  const spy = mockStubGadget({ supportsTier: false });
  useGame.getState().focusGadget("nonogram");
  render(<GadgetOverlay />);
  fireEvent.click(screen.getByTestId("qa-solve"));
  expect(screen.queryByRole("button", { name: /harder/i })).not.toBeInTheDocument();
  // The easier path — the only path here — is still unconditionally present.
  expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  spy.mockRestore();
});

// The stub proves the prop is plumbed; this proves it actually changes what a REAL puzzle renders.
// Nonogram is the one gadget that honours `tier` (SIZES = [5, 7]), so it is the only place a change
// in board size is assertable end to end, through the real registry, with no mock at all.
test("choosing the real Nonogram's harder variant changes the rendered board size", () => {
  useGame.getState().focusGadget("nonogram");
  render(<GadgetOverlay />);

  const cellsAtTier0 = document.querySelectorAll(".ng-grid-cell").length;
  expect(cellsAtTier0).toBe(SIZES[0] ** 2);

  for (const el of Array.from(document.querySelectorAll('[data-fill="1"]'))) fireEvent.click(el);
  fireEvent.click(screen.getByRole("button", { name: /harder/i }));

  const cellsAtTier1 = document.querySelectorAll(".ng-grid-cell").length;
  expect(cellsAtTier1).toBe(SIZES[1] ** 2);
  expect(cellsAtTier1).not.toBe(cellsAtTier0);
});

test("focusing a gadget mounts its puzzle and records one open", () => {
  useGame.getState().focusGadget("nonogram");
  render(<GadgetOverlay />);

  // puzzle rendered: Nonogram's exit button / grid is present
  expect(document.querySelector(".ng-board")).toBeInTheDocument();
  expect(document.querySelector(".ng-exit")).toBeInTheDocument();

  expect(useInterest.getState().byGadget.nonogram?.opens).toBe(1);
});

test("renders nothing when no gadget is focused", () => {
  const { container } = render(<GadgetOverlay />);
  expect(container).toBeEmptyDOMElement();
});

test("refocusing the same gadget does not record a second open", () => {
  useGame.getState().focusGadget("nonogram");
  const { rerender } = render(<GadgetOverlay />);
  rerender(<GadgetOverlay />);
  expect(useInterest.getState().byGadget.nonogram?.opens).toBe(1);
});

test("coming-soon gadget renders ComingSoon fallback", () => {
  // All logic-games gadgets are active in the real registry now; stub in a synthetic
  // coming-soon one so this still-supported render path stays covered.
  const spy = vi.spyOn(registry, "gadgetById").mockReturnValue({
    id: "mirror",
    topic: "logic-games",
    label: "Mirror Maze",
    status: "coming-soon",
    hotspot: { xPct: 55, yPct: 60, label: "Mirror Maze" },
  });

  useGame.getState().focusGadget("mirror");
  render(<GadgetOverlay />);
  expect(document.querySelector(".coming-soon")).toBeInTheDocument();

  spy.mockRestore();
});

test("solving shows a Solved state with a Back button, and does not auto-close", () => {
  useGame.getState().focusGadget("nonogram");
  render(<GadgetOverlay />);

  for (const el of Array.from(document.querySelectorAll('[data-fill="1"]'))) fireEvent.click(el);

  expect(screen.getByText(/solved/i)).toBeInTheDocument();
  expect(useInterest.getState().byGadget.nonogram?.solves).toBe(1);
  // overlay stays mounted (not auto-closed)
  expect(useGame.getState().focusedGadgetId).toBe("nonogram");

  fireEvent.click(screen.getByRole("button", { name: /back/i }));
  expect(useGame.getState().focusedGadgetId).toBeNull();
});
