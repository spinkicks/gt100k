import { render } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import App from "../App";
import { useGame } from "../game/store";
import { useInterest } from "../interest/store";
import { FLOOR_MS } from "./log";
import { sessionLog } from "./session";

// `session.ts`'s real `sessionLog` is a no-op: EMISSION_ENABLED is false because the backdrop's
// prop polygons and bookshelf emit nothing, so a live app-wide log would silently under-count
// every open (see the comment on EMISSION_ENABLED in ./session). That is correct in production,
// but it would make this file untestable — CabinView/MapScreen/GadgetOverlay call `sessionLog`
// unconditionally, so with the real off-switch there is nothing to observe. This mock swaps in a
// live `createSignalLog` for the session module's export, so the actual wiring code in those
// components still runs and still gets exercised — only the on/off decision is bypassed.
vi.mock("./session", async () => {
  const { createSignalLog } = await import("./log");
  return {
    SESSION_ID: "wiring-test",
    EMISSION_ENABLED: true,
    sessionLog: createSignalLog({ sessionId: "wiring-test", now: () => Date.now() }),
  };
});

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ screen: "map", cabinId: null, focusedGadgetId: null });
  // `backdrop` is the only backend now — no WebGL/Canvas in jsdom either way (same reason as
  // App.integration.test), so there is nothing left to force here.
  useInterest.getState().reset();
});

test("the map surfaces only the cabins a child can actually enter", () => {
  render(<App />);

  const ids = sessionLog.surfaced().map((s) => s.artifactId);
  expect(ids).toContain("math");
  expect(ids).toContain("logic-games");
  // Locked cabins are not available, so they are not declinable either —
  // surfacing them would manufacture declines against unreachable content.
  expect(ids).not.toContain("music");
  expect(ids).not.toContain("code");
  expect(ids).not.toContain("art");
});

test("entering a cabin surfaces its gadgets, making the unchosen ones declinable", () => {
  useGame.setState({ screen: "cabin", cabinId: "logic-games" });
  render(<App />);

  const ids = sessionLog.surfaced().map((s) => s.artifactId);
  expect(ids).toContain("nonogram");
  expect(ids).toContain("pipes");
});

test("an open emits an interaction only once enough active time has accrued", () => {
  useGame.setState({ screen: "cabin", cabinId: "logic-games" });
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
  useGame.setState({ screen: "cabin", cabinId: "logic-games" });
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
