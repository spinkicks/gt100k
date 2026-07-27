/**
 * Where a thing sat in the list, so preference can be told apart from position bias.
 *
 * A room with a handful of gadgets has no meaningful ordering: they are placed in a scene and a
 * child sees them at once. A list does. People pick the top of a list far more often than the
 * bottom regardless of content, so on a launcher surface "chose the first subtopic" and "preferred
 * that subtopic" are not the same claim, and today's `SurfacedRecord` cannot distinguish them.
 *
 * This records position and does nothing else with it, deliberately. Correcting for position
 * requires knowing the size of the effect in THIS surface with THESE children, which we cannot know
 * before the surface exists. What we can do now is make sure the data is there when the question is
 * asked, because a position not recorded at surfacing time is not recoverable afterwards.
 *
 * It is optional, because a surface with no ordering (a scene, a single offer) has no honest value
 * to put here, and an invented one would be worse than an absent one.
 */
import type { Artifact } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import type { Interaction, SurfacedRecord } from "../src/model.js";
import { deriveSignals } from "../src/pipeline.js";

const ART: Artifact = {
  id: "res-a",
  domainPath: ["math-puzzles", "logic-puzzles"],
  affordedModes: ["investigate"],
  kind: "resource",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};
const OTHER: Artifact = { ...ART, id: "res-b" };
const CATALOG = new Map([
  [ART.id, ART],
  [OTHER.id, OTHER],
]);

const day = (n: number): string => `2026-07-${String(n).padStart(2, "0")}T00:00:00.000Z`;

describe("a surfaced record can say where in the list it was", () => {
  it("accepts a position", () => {
    const rec: SurfacedRecord = {
      kidId: "k1",
      artifactId: "res-a",
      sessionId: "s1",
      timestamp: day(1),
      position: 0,
    };

    expect(rec.position).toBe(0);
  });

  it("is optional, because a surface with no ordering has nothing honest to put here", () => {
    const rec: SurfacedRecord = {
      kidId: "k1",
      artifactId: "res-a",
      sessionId: "s1",
      timestamp: day(1),
    };

    expect(rec.position).toBeUndefined();
  });

  it("changes no signal, so recording it cannot alter what the engine believes", () => {
    // The guarantee that makes this safe to add before we know how to use it. If position ever
    // starts moving a belief, that has to be a deliberate change with its own evidence, not a
    // side effect of having written the number down.
    const interactions: readonly Interaction[] = [
      {
        kidId: "k1",
        artifactId: "res-a",
        actionType: "inspect",
        timestamp: day(2),
        prompted: false,
        sessionId: "s1",
      },
    ];
    const withoutPos: readonly SurfacedRecord[] = [
      { kidId: "k1", artifactId: "res-a", sessionId: "s1", timestamp: day(1) },
      { kidId: "k1", artifactId: "res-b", sessionId: "s1", timestamp: day(1) },
    ];
    const withPos: readonly SurfacedRecord[] = withoutPos.map((r, i) => ({ ...r, position: i }));

    const a = deriveSignals({ interactions, surfaced: withoutPos, catalog: CATALOG });
    const b = deriveSignals({ interactions, surfaced: withPos, catalog: CATALOG });

    expect(b.cellEvents).toEqual(a.cellEvents);
    expect(b.dropped).toEqual(a.dropped);
  });
});
