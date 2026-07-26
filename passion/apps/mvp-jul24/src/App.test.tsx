import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import App from "./App";
import { useGame } from "./game/store";
import { useInterest } from "./interest/store";

test("renders app root", () => {
  render(<App />);
  expect(screen.getByTestId("app-root")).toBeInTheDocument();
});

beforeEach(() => {
  useGame.setState({ screen: "map", cabinId: null, focusedGadgetId: null });
  useInterest.setState({ byGadget: {} });
});

// PRD §11 refuses any child-facing quantified or ranked display of the child's own engagement.
// A time-on-task ranking makes the measured quantity a target, which converts the instrument into
// an engagement-contingent reward (d = -0.46 in children, growing to -0.55 at ~2 weeks).
test("no child-reachable navigation offers the interest readout", () => {
  render(<App />);
  expect(screen.queryByRole("button", { name: /interest/i })).not.toBeInTheDocument();
  const nav = screen.getByRole("navigation", { name: /primary/i });
  expect(nav.querySelectorAll("button")).toHaveLength(1);
});

// The stronger guard: not "the button is gone" but "nothing a child can reach prints a duration".
// A button-absence test passes again the day someone adds a different entry point.
test("no child-reachable screen renders a time-on-task figure", () => {
  useInterest.setState({ byGadget: { nonogram: { activeMs: 90_000, opens: 3, solves: 1 } } });
  const { container } = render(<App />);
  expect(container.textContent).not.toMatch(/\d+(\.\d+)?\s*(sec|min)\b/);
});

test("the readout is still reachable behind the QA gate, for an operator", async () => {
  const { installQa } = await import("./qa");
  installQa();
  useInterest.setState({ byGadget: { nonogram: { activeMs: 90_000, opens: 3, solves: 1 } } });
  window.__qa?.showReadout();
  render(<App />);
  expect(screen.getByText("Your interests")).toBeInTheDocument();
  expect(window.__qa?.interest().nonogram?.activeMs).toBe(90_000);
});
