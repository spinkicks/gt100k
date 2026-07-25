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

  // Map: click the Math cabin node.
  fireEvent.click(
    screen.getByTestId("app-root").querySelector('[data-cabin="math"]') as HTMLElement,
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
