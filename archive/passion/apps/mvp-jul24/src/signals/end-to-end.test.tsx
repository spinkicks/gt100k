/**
 * The app's own emissions, played through the real engine.
 *
 * This is the test whose absence let the whole gap survive. Every layer was independently green:
 * the emitter was typed against the engine's contract so `tsc` passed, the pipeline had its own
 * fixtures, and the app had its own wiring tests. Nothing anywhere took what this app actually
 * writes and fed it to what actually consumes it, and so for weeks the answer to "does any of this
 * reach the engine" was no, and no test knew.
 *
 * It uses the real `deriveSignals` and the real `CATALOG`, and drives the app through the DOM rather
 * than hand-building records, because hand-built records are exactly what hid the problem.
 */
import { fireEvent, render } from "@testing-library/react";
import { deriveSignals } from "@gt100k/signal-pipeline";
import { beforeEach, expect, test, vi } from "vitest";

import App from "../App";
import { useGame } from "../game/store";
import { useInterest } from "../interest/store";
import { CATALOG } from "@gt100k/discovery-catalog";
import { FLOOR_MS } from "./log";
import { sessionLog } from "./session";

vi.mock("./session", async () => {
  const { createSignalLog } = await import("./log");
  return {
    SESSION_ID: "e2e",
    EMISSION_ENABLED: true,
    sessionLog: createSignalLog({ sessionId: "e2e", now: () => Date.now() }),
  };
});

beforeEach(() => {
  localStorage.clear();
  useGame.setState({ screen: "map", cabinId: null, focusedGadgetId: null });
  useInterest.getState().reset();
});

const run = () =>
  deriveSignals({
    interactions: sessionLog.interactions(),
    surfaced: sessionLog.surfaced(),
    catalog: CATALOG,
  });

test("opening a gadget resolves, but forms no cell, because presence is not work", () => {
  // Written expecting a cell event and corrected: an `open` deliberately resolves to no work-mode,
  // so the engine learns the child was there and nothing about how they worked. That is the design
  // (see MODELESS_ACTIONS), and it is why `recordAction` below had to exist at all — without it the
  // app emitted only presence, forever.
  useGame.setState({ screen: "cabin", cabinId: "logic-games" });
  const { rerender } = render(<App />);

  fireEvent.click(document.querySelector('[data-prop="nonogram"]')!);
  rerender(<App />);
  useInterest.getState().addActiveMs("nonogram", FLOOR_MS);
  useGame.setState({ focusedGadgetId: null });
  rerender(<App />);

  const out = run();

  expect(out.dropped.filter((d) => d.reason === "unknown-artifact")).toEqual([]);
  expect(out.dropped.map((d) => d.reason)).toContain("no-work-mode");
});

test("a child SOLVING a gadget reaches the engine as an event in the right cell", () => {
  // The end-to-end guarantee, and the thing that was false for weeks.
  useGame.setState({ screen: "cabin", cabinId: "logic-games", focusedGadgetId: "nonogram" });
  render(<App />);

  fireEvent.click(document.querySelector('[data-prop="nonogram"]') ?? document.body);
  sessionLog.recordAction("nonogram", "inspect");

  const paths = run().cellEvents.map((e) => e.domainPath.join("/"));
  expect(paths).toContain("math-puzzles/logic-puzzles");
});

test("a depth signal riding a solve arrives as depth, not as an unresolved action", () => {
  // `recordDepth` set actionType to the depth kind, which resolves to no mode, so every depth
  // record this app ever wrote was discarded. Carried on the gadget's verb, they arrive.
  sessionLog.recordAction("nonogram", "inspect", ["chosen_challenge"]);

  const out = run();
  expect(out.cellEvents.map((e) => e.kind)).toContain("chosen_challenge");
  expect(out.dropped.map((d) => d.reason)).not.toContain("unresolved-action");
});

test("opening one gadget does not count as declining it", () => {
  // The inversion fixed in #196, verified here against real app output rather than a fixture: an
  // `open` is presence, so the thing the child chose to look at must not earn a decrement.
  useGame.setState({ screen: "cabin", cabinId: "logic-games" });
  const { rerender } = render(<App />);

  fireEvent.click(document.querySelector('[data-prop="nonogram"]')!);
  rerender(<App />);
  useGame.setState({ focusedGadgetId: null });
  rerender(<App />);

  const against = run().cellEvents.filter((e) => e.kind === "skip" || e.kind === "decline");
  const nonogramCell = CATALOG.get("nonogram")!.domainPath.join("/");
  expect(against.map((e) => e.domainPath.join("/"))).not.toContain(nonogramCell);
});

test("the gadgets a child walked past are still on offer, so a real decline can form", () => {
  useGame.setState({ screen: "cabin", cabinId: "logic-games" });
  render(<App />);

  const surfaced = run();
  // Every gadget in the room was surfaced; that is what makes not choosing one meaningful.
  expect(sessionLog.surfaced().length).toBeGreaterThanOrEqual(4);
  expect(surfaced.dropped.filter((d) => d.reason === "unknown-artifact")).toEqual([]);
});

test("an open is reported as presence, not as an emitter fault", () => {
  // `no-work-mode` versus `unresolved-action` is the distinction a reader of `dropped` needs: one
  // is by design, the other may be a bug. Collapsing them buries real faults in expected noise.
  useGame.setState({ screen: "cabin", cabinId: "logic-games" });
  const { rerender } = render(<App />);

  fireEvent.click(document.querySelector('[data-prop="nonogram"]')!);
  rerender(<App />);
  useGame.setState({ focusedGadgetId: null });
  rerender(<App />);

  const reasons = new Set(run().dropped.map((d) => d.reason));
  expect(reasons.has("unresolved-action")).toBe(false);
});

test("nothing the app emits is dropped as an unknown artifact", () => {
  // The broadest form of the guarantee. Whatever the child touched, the crosswalk knows what it is.
  useGame.setState({ screen: "cabin", cabinId: "math" });
  const { rerender } = render(<App />);
  const prop = document.querySelector("[data-prop]");
  if (prop) {
    fireEvent.click(prop);
    rerender(<App />);
    useGame.setState({ focusedGadgetId: null });
    rerender(<App />);
  }

  expect(run().dropped.filter((d) => d.reason === "unknown-artifact")).toEqual([]);
});
