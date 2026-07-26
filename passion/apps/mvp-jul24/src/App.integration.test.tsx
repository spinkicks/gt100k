import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { useGame } from "./game/store";
import { useInterest } from "./interest/store";
import { installQa } from "./qa";

beforeEach(() => {
  useGame.getState().goToMap();
  useInterest.getState().reset();
});

test("full loop: map -> cabin -> gadget -> solve -> readout", () => {
  const { rerender } = render(<App />);

  // Map: click the Logic Games cabin node (the one holding the deduction puzzles).
  fireEvent.click(
    screen.getByTestId("app-root").querySelector('[data-cabin="logic-games"]') as HTMLElement,
  );

  // Cabin: `backdrop` is the only backend now (no WebGL/Canvas needed in jsdom); find the nonogram
  // prop hotspot — the backdrop labels props `data-prop`, not `data-gadget` (see CabinBackdrop.tsx).
  const nonogramHotspot = document.querySelector('[data-prop="nonogram"]') as HTMLElement;
  expect(nonogramHotspot).toBeInTheDocument();

  // Open the gadget overlay.
  fireEvent.click(nonogramHotspot);
  expect(useInterest.getState().byGadget.nonogram?.opens).toBe(1);

  // Solve the nonogram by clicking every filled cell.
  for (const el of Array.from(document.querySelectorAll('[data-fill="1"]'))) fireEvent.click(el);
  expect(useInterest.getState().byGadget.nonogram?.solves).toBe(1);

  // The readout has no child-facing entry point (PRD §11 — the quantified display is
  // operator/guide-facing only, per src/qa.ts). Drive it through the `window.__qa` contract instead
  // of a nav button, then check the nonogram bar shows up. `[data-gadget="nonogram"]` here is
  // `ReadoutScreen`'s own bar-row attribute — unrelated to the backdrop's `data-prop`.
  installQa();
  window.__qa?.showReadout();
  rerender(<App />);
  expect(document.querySelector('[data-gadget="nonogram"]')).toBeInTheDocument();
  expect(screen.getByText("Nonogram")).toBeInTheDocument();
});

/**
 * The `math` cabin is on the map and openable but holds no gadgets until its games ship (see
 * src/gadgets/registry.ts). Walking into it is a normal thing a player will do, so the whole path —
 * map click → store → CabinView → backdrop → prop list — has to survive it and put a real room on
 * screen. Driven through `backdrop`, the only backend, which needs no WebGL and so needs no jsdom
 * workaround.
 *
 * This asserted zero gadgets while `math` was deliberately empty. It now holds five maths
 * activities, so the assertion flipped: the point is that the whole path works and the room comes up
 * furnished with its own props, not that the room is bare.
 */
test("entering the math cabin renders a room with its activities in it", () => {
  expect(() => render(<App />)).not.toThrow();

  fireEvent.click(
    screen.getByTestId("app-root").querySelector('[data-cabin="math"]') as HTMLElement,
  );

  expect(useGame.getState().cabinId).toBe("math");
  expect(document.querySelector(".cabin-view")).toBeInTheDocument();
  expect(document.querySelector(".cabin-backdrop")).toBeInTheDocument();
  expect(document.querySelector("img.cabin-backdrop-img")).toBeInTheDocument();
  // Its five activities are on the wall, and none of them is a deduction puzzle from the other room.
  const ids = [...document.querySelectorAll("[data-prop]")].map((el) =>
    el.getAttribute("data-prop"),
  );
  expect(ids).toHaveLength(5);
  expect(ids).toContain("gear-train");
  expect(ids).not.toContain("nonogram");
  // ...and no gadget overlay opened itself on the way in.
  expect(document.querySelector(".gadget-overlay")).toBeNull();
});

// The "Mode: 3d" A/B pill used to sit in the corner of the cabin panel and read as a debug badge.
test("the cabin panel no longer shows a backend debug badge", () => {
  render(<App />);
  fireEvent.click(
    screen.getByTestId("app-root").querySelector('[data-cabin="logic-games"]') as HTMLElement,
  );

  expect(document.querySelector(".cabin-view")).toBeInTheDocument();
  expect(document.querySelector(".cabin-view-ab-toggle")).toBeNull();
  expect(screen.queryByText(/^Mode:/)).toBeNull();
});
