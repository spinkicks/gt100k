import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import * as registry from "../gadgets/registry";
import { useGame } from "../game/store";
import CabinStatic from "./CabinStatic";

beforeEach(() => {
  useGame.getState().goToMap();
});

test("renders a hotspot button for each gadget in the topic, labelled by hotspot.label", () => {
  render(<CabinStatic topic="math" />);
  expect(screen.getByRole("button", { name: "Nonogram" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Logic Grid" })).toBeInTheDocument();
});

test("clicking the nonogram hotspot focuses that gadget", () => {
  render(<CabinStatic topic="math" />);
  fireEvent.click(screen.getByRole("button", { name: "Nonogram" }));
  expect(useGame.getState().focusedGadgetId).toBe("nonogram");
});

test("coming-soon gadgets render with a distinct soon marker but are still clickable", () => {
  // All math gadgets are active in the real registry now; stub in a synthetic
  // coming-soon one so this still-supported render path stays covered.
  const spy = vi.spyOn(registry, "gadgetsForTopic").mockReturnValue([
    {
      id: "mirror",
      topic: "math",
      label: "Mirror Maze",
      status: "coming-soon",
      hotspot: { xPct: 55, yPct: 60, label: "Mirror Maze" },
    },
  ]);

  render(<CabinStatic topic="math" />);
  const mirrorButton = screen.getByRole("button", { name: /Mirror Maze/ });
  expect(mirrorButton.className).toMatch(/coming-soon/);

  fireEvent.click(mirrorButton);
  expect(useGame.getState().focusedGadgetId).toBe("mirror");

  spy.mockRestore();
});

test("hotspot buttons carry data-gadget matching the gadget id and render at their mapped static position", () => {
  render(<CabinStatic topic="math" />);
  const nonogramButton = document.querySelector('[data-gadget="nonogram"]') as HTMLElement;
  expect(nonogramButton).toBeInTheDocument();
  expect(nonogramButton.style.left).toBe("20%");
  expect(nonogramButton.style.top).toBe("45%");

  fireEvent.click(nonogramButton);
  expect(useGame.getState().focusedGadgetId).toBe("nonogram");
});

test("renders the cabin background image with the topic-specific src", () => {
  render(<CabinStatic topic="math" />);
  const img = document.querySelector("img.cabin-static-bg") as HTMLImageElement;
  expect(img).toBeInTheDocument();
  expect(img.getAttribute("src")).toBe("/art/cabin-math.png");
});
