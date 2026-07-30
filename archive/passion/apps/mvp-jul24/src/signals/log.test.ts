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

  test("records where in the order the thing sat, when the surface knows", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordSurfaced("nonogram", 0);
    log.recordSurfaced("logic-grid", 1);

    expect(log.surfaced().map((s) => s.position)).toEqual([0, 1]);
  });

  test("leaves the key out entirely when it does not, rather than writing undefined", () => {
    // The field is optional because inventing a position for an unordered surface is worse than
    // leaving it out, and the difference has to survive `JSON.stringify`, which drops `undefined`
    // values and would otherwise make "no order here" and "order lost in transit" the same record.
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordSurfaced("nonogram");

    expect(Object.keys(log.surfaced()[0]!)).toEqual([
      "kidId",
      "artifactId",
      "sessionId",
      "timestamp",
    ]);
  });

  test("position zero survives, which is the one an ordinal bug eats", () => {
    // `position && { position }` would drop the first item in every list, and the first item is the
    // one a position effect is most about.
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordSurfaced("nonogram", 0);

    expect(log.surfaced()[0]).toHaveProperty("position", 0);
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
        dwellBucket: "short",
      },
    ]);
  });

  test("an open below the floor is still recorded, tagged under_floor", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordOpen("nonogram", FLOOR_MS - 1);

    // Dropping it would leave "surfaced, never engaged" — which E4 reads as a
    // decline. A brief attempt must never become NEGATIVE evidence.
    const [only] = log.interactions();
    expect(only?.artifactId).toBe("nonogram");
    expect(only?.dwellBucket).toBe("under_floor");
  });

  test("buckets an open by how long it held attention, never by raw duration", () => {
    const c = clock(Date.parse("2026-07-25T10:00:00.000Z"));
    const log = createSignalLog({ sessionId: "s1", now: c.now });

    log.recordOpen("a", 1_000);
    log.recordOpen("b", 30_000);
    log.recordOpen("c", 3 * 60_000);
    log.recordOpen("d", 10 * 60_000);

    expect(log.interactions().map((i) => i.dwellBucket)).toEqual([
      "under_floor",
      "short",
      "medium",
      "long",
    ]);
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
      "dwellBucket",
      "kidId",
      "prompted",
      "sessionId",
      "timestamp",
    ]);
  });
});
