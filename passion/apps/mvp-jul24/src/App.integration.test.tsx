import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { useGame } from "./game/store";
import { useInterest } from "./interest/store";

beforeEach(() => {
  useGame.getState().goToMap();
  useGame.getState().setBackend("static");
  useInterest.getState().reset();
});

test("full loop: map -> cabin -> gadget -> solve -> readout", () => {
  render(<App />);

  // Map: click the Logic Games cabin node (the one holding the deduction puzzles).
  fireEvent.click(
    screen.getByTestId("app-root").querySelector('[data-cabin="logic-games"]') as HTMLElement,
  );

  // Cabin: static backend is set in beforeEach (no WebGL/Canvas needed in jsdom); find the nonogram hotspot.
  const nonogramHotspot = document.querySelector('[data-gadget="nonogram"]') as HTMLElement;
  expect(nonogramHotspot).toBeInTheDocument();

  // Open the gadget overlay.
  fireEvent.click(nonogramHotspot);
  expect(useInterest.getState().byGadget.nonogram?.opens).toBe(1);

  // Solve the nonogram by clicking every filled cell.
  for (const el of Array.from(document.querySelectorAll('[data-fill="1"]'))) fireEvent.click(el);
  expect(useInterest.getState().byGadget.nonogram?.solves).toBe(1);

  // Go to the interest readout via the top bar and check the nonogram bar shows up.
  fireEvent.click(screen.getByRole("button", { name: "Interest" }));
  expect(document.querySelector('[data-gadget="nonogram"]')).toBeInTheDocument();
  expect(screen.getByText("Nonogram")).toBeInTheDocument();
});

/**
 * The `math` cabin is on the map and openable but holds no gadgets until its games ship (see
 * src/gadgets/registry.ts). Walking into it is a normal thing a player will do, so the whole path —
 * map click → store → CabinView → backend → empty prop list — has to survive it and put a real room
 * on screen. Driven through the static backend because jsdom has no WebGL for the 3D one.
 */
test("entering the empty math cabin renders a room, not a crash or a blank panel", () => {
  expect(() => render(<App />)).not.toThrow();

  fireEvent.click(
    screen.getByTestId("app-root").querySelector('[data-cabin="math"]') as HTMLElement,
  );

  expect(useGame.getState().cabinId).toBe("math");
  expect(document.querySelector(".cabin-view")).toBeInTheDocument();
  expect(document.querySelector(".cabin-static")).toBeInTheDocument();
  // The room is furnished; it just has nothing to click in it.
  expect(document.querySelector("img.cabin-static-bg")).toBeInTheDocument();
  expect(document.querySelectorAll("[data-gadget]")).toHaveLength(0);
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
