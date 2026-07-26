import { beforeEach, expect, test } from "vitest";
import { createSignalLog } from "./log";
import { EMISSION_ENABLED, sessionLog } from "./session";

beforeEach(() => localStorage.clear());

// Relocated from testing `sessionLog` (below EMISSION_ENABLED is false, so the session-level
// log no longer records) to `createSignalLog` directly, which is the thing that actually holds
// this behaviour. The log itself is untouched by this task.
test("the log uses one session id for the whole page load", () => {
  const log = createSignalLog({ sessionId: "s-test", now: () => Date.now() });
  log.recordSurfaced("nonogram");
  log.recordSurfaced("logic-grid");

  const ids = new Set(log.surfaced().map((s) => s.sessionId));
  expect(ids.size).toBe(1);
  expect([...ids][0]).toMatch(/\S/);
});

// PROJECT.md: the backdrop's prop polygons and the bookshelf emit nothing, and the backdrop is now
// the only backend. So a log that looks well-formed would under-count every open. Emission is OFF,
// stated in one place, rather than silently partial.
test("emission is off, and that is an explicit recorded fact", () => {
  expect(EMISSION_ENABLED).toBe(false);
});

test("with emission off the log accepts calls and records nothing", () => {
  sessionLog.recordSurfaced("nonogram");
  sessionLog.recordOpen("nonogram", 60_000);
  sessionLog.recordDepth("nonogram", "unrequired_revision");
  expect(sessionLog.surfaced()).toHaveLength(0);
  expect(sessionLog.interactions()).toHaveLength(0);
});
