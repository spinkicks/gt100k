import { describe, it, expect } from "vitest";
import { deriveSignals } from "../src/pipeline.js";
import type { Interaction } from "../src/model.js";
import { CATALOG } from "../src/__fixtures__/pipeline.fixtures.js";

/**
 * `dwellBucket` may be read as a validity gate or shown as a diagnostic. It may never reach the
 * belief math. The guarantee is structural rather than conventional: the engine only ever folds
 * `CellEvent`s, so as long as the bucket does not appear on one, no amount of future editing in
 * `fold.ts` can multiply a duration into alpha.
 *
 * This test exists to fail loudly if someone "helpfully" plumbs it through.
 */
describe("dwellBucket cannot reach the belief math", () => {
  const artifactId = [...CATALOG.keys()][0]!;

  const withBucket = (bucket: Interaction["dwellBucket"], ts: string): Interaction => ({
    kidId: "k",
    artifactId,
    actionType: "tinker",
    timestamp: ts,
    prompted: false,
    sessionId: "s1",
    dwellBucket: bucket,
  });

  it("never copies the bucket onto an emitted CellEvent", () => {
    const interactions: Interaction[] = [
      withBucket("under_floor", "2026-02-01T00:00:00.000Z"),
      withBucket("short", "2026-02-05T00:00:00.000Z"),
      withBucket("long", "2026-02-09T00:00:00.000Z"),
    ];
    const { cellEvents } = deriveSignals({ interactions, catalog: CATALOG });

    expect(cellEvents.length).toBeGreaterThan(0);
    for (const e of cellEvents) {
      expect(Object.hasOwn(e, "dwellBucket")).toBe(false);
    }
  });

  it("produces an identical event stream regardless of the bucket", () => {
    // If dwell ever started influencing derivation, these two would diverge.
    const at = "2026-02-05T00:00:00.000Z";
    const a = deriveSignals({
      interactions: [withBucket("under_floor", at)],
      catalog: CATALOG,
    });
    const b = deriveSignals({
      interactions: [withBucket("long", at)],
      catalog: CATALOG,
    });
    expect(a.cellEvents).toEqual(b.cellEvents);
  });
});
