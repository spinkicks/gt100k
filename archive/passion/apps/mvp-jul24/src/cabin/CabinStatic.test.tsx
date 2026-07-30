import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import * as registry from "../gadgets/registry";
import { useGame } from "../game/store";
import CabinStatic from "./CabinStatic";

beforeEach(() => {
  useGame.getState().goToMap();
});

test("renders a hotspot button for each gadget in the topic, labelled by hotspot.label", () => {
  render(<CabinStatic topic="logic-games" />);
  expect(screen.getByRole("button", { name: "Nonogram" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pipes" })).toBeInTheDocument();
  // Four, not the original seven — see src/gadgets/registry.ts.
  expect(screen.getAllByRole("button")).toHaveLength(4);
});

test("clicking the nonogram hotspot focuses that gadget", () => {
  render(<CabinStatic topic="logic-games" />);
  fireEvent.click(screen.getByRole("button", { name: "Nonogram" }));
  expect(useGame.getState().focusedGadgetId).toBe("nonogram");
});

test("coming-soon gadgets render with a distinct soon marker but are still clickable", () => {
  // All logic-games gadgets are active in the real registry now; stub in a synthetic
  // coming-soon one so this still-supported render path stays covered.
  const spy = vi.spyOn(registry, "gadgetsForTopic").mockReturnValue([
    {
      id: "mirror",
      topic: "logic-games",
      label: "Mirror Maze",
      status: "coming-soon",
      hotspot: { xPct: 55, yPct: 60, label: "Mirror Maze" },
    },
  ]);

  render(<CabinStatic topic="logic-games" />);
  const mirrorButton = screen.getByRole("button", { name: /Mirror Maze/ });
  expect(mirrorButton.className).toMatch(/coming-soon/);

  fireEvent.click(mirrorButton);
  expect(useGame.getState().focusedGadgetId).toBe("mirror");

  spy.mockRestore();
});

test("hotspot buttons carry data-gadget matching the gadget id and render at their mapped static position", () => {
  render(<CabinStatic topic="logic-games" />);
  const nonogramButton = document.querySelector('[data-gadget="nonogram"]') as HTMLElement;
  expect(nonogramButton).toBeInTheDocument();
  expect(nonogramButton.style.left).toBe("20%");
  expect(nonogramButton.style.top).toBe("45%");

  fireEvent.click(nonogramButton);
  expect(useGame.getState().focusedGadgetId).toBe("nonogram");
});

test("renders the cabin background image with the topic-specific src", () => {
  render(<CabinStatic topic="logic-games" />);
  const img = document.querySelector("img.cabin-static-bg") as HTMLImageElement;
  expect(img).toBeInTheDocument();
  expect(img.getAttribute("src")).toBe("/art/cabin-logic-games.png");
});

// A gadget-free topic has to give a normal (if quiet) room rather than throwing or rendering nothing.
// The fixture keeps moving as cabins get built: it was `math` until its five activities shipped, then
// `music` until its three did on 2026-07-27. `code` is the empty one now.
test("a topic with no gadgets renders the room with zero hotspots and does not throw", () => {
  expect(() => render(<CabinStatic topic="art" />)).not.toThrow();

  expect(document.querySelector(".cabin-static")).toBeInTheDocument();
  expect(document.querySelector("img.cabin-static-bg")?.getAttribute("src")).toBe(
    "/art/cabin-art.png",
  );
  expect(document.querySelector(".cabin-static-hearthlight")).toBeInTheDocument();
  expect(document.querySelectorAll("[data-gadget]")).toHaveLength(0);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});
