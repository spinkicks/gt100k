/**
 * The crosswalk has to cover this app's furniture, in both directions.
 *
 * The table itself moved to `@gt100k/discovery-catalog` when the console started receiving what
 * this app emits: a receiver resolving artifact ids against a different catalog discards exactly
 * what it cannot resolve, silently, so there can only be one table. But only the app knows what
 * gadgets it actually has, so this check cannot move with it. It is the half that catches a gadget
 * added here and never added there, which would emit into nothing.
 */
import { CATALOG, artifactFor } from "@gt100k/discovery-catalog";
import { describe, expect, it } from "vitest";

import { GADGETS } from "../gadgets/registry";

describe("every gadget in the room is on the map", () => {
  it("maps each one, so nothing a child can touch emits into nothing", () => {
    for (const g of GADGETS) {
      expect(artifactFor(g.id), `${g.id} has no crosswalk row`).toBeDefined();
    }
  });

  it("has no rows for gadgets that do not exist", () => {
    // A stale row is a silent lie: it resolves, so nothing fails, and it files a child's engagement
    // under a domain nothing in the app can reach.
    const ids = new Set(GADGETS.map((g) => g.id));
    for (const id of CATALOG.keys()) {
      expect(ids.has(id), `${id} is in the crosswalk but not in the registry`).toBe(true);
    }
  });
});
