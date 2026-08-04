import { describe, it, expect } from "vitest";
import { deriveSignals } from "../src/pipeline.js";
import type { Interaction } from "../src/model.js";
import { CATALOG } from "../src/__fixtures__/pipeline.fixtures.js";

/**
 * `tries` exists so the wellbeing engine can tell a bored child from a drowning one. It may never
 * reach the belief math.
 *
 * A child who loves a thing they are bad at has to read as exactly as interested as a child who
 * finds the same thing easy. Let a success rate into a posterior and interest quietly becomes
 * performance, which is the opposite of what this system claims to measure.
 *
 * The guarantee is structural, the same shape as `dwellBucket`'s: the engine only ever folds
 * `CellEvent`s, so as long as tries never appear on one, no amount of future editing in `fold.ts`
 * can multiply a success rate into alpha. This test exists to fail loudly if someone plumbs it
 * through trying to be helpful.
 */
describe("tries cannot reach the belief math", () => {
  const artifactId = [...CATALOG.keys()][0]!;

  const withTries = (tries: number, ts: string): Interaction => ({
    kidId: "k",
    artifactId,
    actionType: "tinker",
    timestamp: ts,
    prompted: false,
    sessionId: "s1",
    tries,
  });

  const days = [
    "2026-02-01T00:00:00.000Z",
    "2026-02-05T00:00:00.000Z",
    "2026-02-09T00:00:00.000Z",
  ] as const;

  it("emits identical cell events whether the child breezed through or struggled", () => {
    const easy = deriveSignals({
      interactions: days.map((d) => withTries(1, d)),
      catalog: CATALOG,
    });
    const hard = deriveSignals({
      interactions: days.map((d) => withTries(20, d)),
      catalog: CATALOG,
    });
    expect(hard.cellEvents).toEqual(easy.cellEvents);
  });

  it("never copies the count onto an emitted CellEvent", () => {
    // Stronger than equality: the field has to be structurally absent, so no future consumer can
    // reach for it even if they want to.
    const { cellEvents } = deriveSignals({
      interactions: days.map((d) => withTries(7, d)),
      catalog: CATALOG,
    });
    expect(cellEvents.length).toBeGreaterThan(0);
    for (const e of cellEvents) {
      expect(Object.hasOwn(e, "tries")).toBe(false);
    }
    expect(JSON.stringify(cellEvents)).not.toMatch(/tries/);
  });

  it("does not change how many events an interaction produces", () => {
    // A struggling child must not generate more or fewer observations than a fluent one, or the
    // evidence mass itself would encode performance even with the field stripped.
    const without = deriveSignals({
      interactions: days.map((d) => ({ ...withTries(1, d), tries: undefined })),
      catalog: CATALOG,
    });
    const with20 = deriveSignals({
      interactions: days.map((d) => withTries(20, d)),
      catalog: CATALOG,
    });
    expect(with20.cellEvents.length).toBe(without.cellEvents.length);
  });
});
