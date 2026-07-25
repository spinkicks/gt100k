import { beforeEach, expect, test } from "vitest";
import { sessionLog } from "./session";

beforeEach(() => localStorage.clear());

test("the app-level log uses one session id for the whole page load", () => {
  sessionLog.recordSurfaced("nonogram");
  sessionLog.recordSurfaced("logic-grid");

  const ids = new Set(sessionLog.surfaced().map((s) => s.sessionId));
  expect(ids.size).toBe(1);
  expect([...ids][0]).toMatch(/\S/);
});
