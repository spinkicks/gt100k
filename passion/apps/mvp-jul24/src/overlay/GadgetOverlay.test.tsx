import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import * as registry from "../gadgets/registry";
import { useGame } from "../game/store";
import { useInterest } from "../interest/store";
import GadgetOverlay from "./GadgetOverlay";

beforeEach(() => {
  useGame.getState().goToMap();
  useInterest.getState().reset();
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
