import { render } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import App from "../App";
import { useGame } from "../game/store";
import { useInterest } from "../interest/store";
import { FLOOR_MS } from "./log";
import { sessionLog } from "./session";

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ screen: "map", cabinId: null, focusedGadgetId: null });
  // Static backend: no WebGL/Canvas in jsdom (same reason as App.integration.test).
  useGame.getState().setBackend("static");
  useInterest.getState().reset();
});

test("the map surfaces only the cabins a child can actually enter", () => {
  render(<App />);

  const ids = sessionLog.surfaced().map((s) => s.artifactId);
  expect(ids).toContain("math");
  // Locked cabins are not available, so they are not declinable either —
  // surfacing them would manufacture declines against unreachable content.
  expect(ids).not.toContain("music");
  expect(ids).not.toContain("code");
  expect(ids).not.toContain("art");
});

test("entering a cabin surfaces its gadgets, making the unchosen ones declinable", () => {
  useGame.setState({ screen: "cabin", cabinId: "math" });
  render(<App />);

  const ids = sessionLog.surfaced().map((s) => s.artifactId);
  expect(ids).toContain("nonogram");
  expect(ids).toContain("logic-grid");
});

test("an open emits an interaction only once enough active time has accrued", () => {
  useGame.setState({ screen: "cabin", cabinId: "math" });
  const { rerender } = render(<App />);

  useGame.setState({ focusedGadgetId: "nonogram" });
  rerender(<App />);
  useInterest.getState().addActiveMs("nonogram", FLOOR_MS);

  useGame.setState({ focusedGadgetId: null });
  rerender(<App />);

  const opens = sessionLog.interactions().filter((i) => i.actionType === "open");
  expect(opens.map((i) => i.artifactId)).toEqual(["nonogram"]);
});

test("a glance is recorded as an under_floor open, never dropped", () => {
  useGame.setState({ screen: "cabin", cabinId: "math" });
  const { rerender } = render(<App />);

  useGame.setState({ focusedGadgetId: "nonogram" });
  rerender(<App />);
  useInterest.getState().addActiveMs("nonogram", 1_000);

  useGame.setState({ focusedGadgetId: null });
  rerender(<App />);

  // Dropping this would leave "surfaced, never engaged" — which E4 reads as a
  // decline, turning a brief attempt into negative evidence. It survives, and
  // the bucket lets the engine decide what it is worth.
  const [only] = sessionLog.interactions();
  expect(only?.actionType).toBe("open");
  expect(only?.dwellBucket).toBe("under_floor");
  // A glance still asserts no depth: the app must not claim revision happened.
  expect(only?.depthSignals).toBeUndefined();
});
