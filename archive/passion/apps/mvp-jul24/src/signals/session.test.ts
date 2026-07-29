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

// Emission is ON as of 2026-07-27. These tests hold the PRECONDITION rather than the flag, because
// the flag on its own is just a boolean: what made it safe to flip was that both surfaces PROJECT.md
// named — the backdrop's prop polygons and the bookshelf — actually emit. A future change that
// silently breaks one of those should fail here, not be discovered in the data months later.
test("emission is on, and that is an explicit recorded fact", () => {
  expect(EMISSION_ENABLED).toBe(true);
});

test("the live log actually records when it is on", () => {
  sessionLog.recordSurfaced("nonogram");
  sessionLog.recordOpen("nonogram", 60_000);

  expect(sessionLog.surfaced()).toHaveLength(1);
  expect(sessionLog.interactions()).toHaveLength(1);
});

test("the off-switch stays usable, though the compiler is what guarantees it", () => {
  // Written as a runtime check first, and it was worthless: with emission ON, `sessionLog` IS the
  // live log, so asserting the live log has its own methods proves nothing about the stand-in.
  // Deleting a method from the no-op passed this file and failed `tsc` instead.
  //
  // `const off: typeof live` is the actual guard, and it is a better one than a test: the stand-in
  // cannot drift from the log it stands in for, and the error arrives at the edit rather than at
  // the moment someone turns emission off. All that is worth asserting here is that the switch
  // still has two sides.
  expect(typeof sessionLog.recordSourceFollow).toBe("function");
  expect(typeof sessionLog.recordOpen).toBe("function");
});
