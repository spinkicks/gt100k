import { beforeEach, describe, expect, test } from "vitest";
import { FLOOR_MS, createSignalLog } from "./log";

/**
 * P0 (proposal E3): the app must emit timestamped, session-scoped records that
 * `@gt100k/signal-pipeline` already expects — `Interaction` (what the child did)
 * and `SurfacedRecord` (what was available and therefore declinable).
 */

const clock = (start: number) => ({ now: () => start });

beforeEach(() => localStorage.clear());

describe("surfaced records", () => {
  test("emits one record per artifact per session, however many times it is seen", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordSurfaced("nonogram");
    log.recordSurfaced("nonogram");
    log.recordSurfaced("logic-grid");

    expect(log.surfaced().map((s) => s.artifactId)).toEqual(["nonogram", "logic-grid"]);
  });

  test("re-emits the same artifact in a new session, because declining is per-session", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    createSignalLog({ sessionId: "s1", now: c.now }).recordSurfaced("nonogram");

    const later = createSignalLog({ sessionId: "s2", now: c.now });
    later.recordSurfaced("nonogram");

    expect(later.surfaced()).toHaveLength(2);
    expect(later.surfaced().map((s) => s.sessionId)).toEqual(["s1", "s2"]);
  });
});

describe("interactions", () => {
  test("an open past the validity floor emits an interaction with the pipeline's fields", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordOpen("nonogram", FLOOR_MS);

    expect(log.interactions()).toEqual([
      {
        kidId: "local-demo",
        artifactId: "nonogram",
        actionType: "open",
        timestamp: "2026-07-25T10:00:00.000Z",
        prompted: false,
        sessionId: "s1",
      },
    ]);
  });

  test("an open below the validity floor emits nothing — a stray click is not evidence", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordOpen("nonogram", FLOOR_MS - 1);

    expect(log.interactions()).toEqual([]);
  });

  test("a depth signal is never floor-gated — completing a puzzle is evidence at any duration", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordDepth("nonogram", "self_authored_scope");

    const [only] = log.interactions();
    expect(only?.depthSignals).toEqual([{ kind: "self_authored_scope", value: 1 }]);
  });

  test("carries no duration-shaped field, so an emitter cannot reach the belief math", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });
    log.recordOpen("nonogram", FLOOR_MS);

    const [emitted] = log.interactions();
    if (!emitted) throw new Error("expected one interaction to have been emitted");

    const keys = Object.keys(emitted).sort();
    expect(keys).toEqual([
      "actionType",
      "artifactId",
      "kidId",
      "prompted",
      "sessionId",
      "timestamp",
    ]);
  });
});
