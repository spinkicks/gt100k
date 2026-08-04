/**
 * A child who arrived through ingest has to be readable by the console.
 *
 * The roster deliberately has one code path: synthetic children and real ones are both produced by
 * running the real discovery chain over an interaction log, and the only difference is where the
 * log came from. The Plan panel quietly broke that. It re-derived against `PILOT_CATALOG` and a
 * fixed April clock, so a real child's gadget ids resolved to nothing, their voluntary engagement
 * came back empty, and the panel returned no plan card at all — for a child a guide had just
 * promoted, having satisfied a gate that takes two months to reach.
 *
 * These tests use the catalogue the console actually holds, so they fail if it ever narrows again.
 */
import { describe, expect, it } from "vitest";

import { CONSOLE_CATALOG } from "../app/console-data.js";
import { CATALOG as GADGET_CATALOG } from "@gt100k/discovery-catalog";
import { SEED_LIBRARY } from "@gt100k/concierge";

describe("the catalogue the console reads children against", () => {
  it("knows every game a child can play on the wall", () => {
    // Without these a real child's solves resolve to nothing and the console shows "0 tracked".
    for (const id of GADGET_CATALOG.keys()) {
      expect(CONSOLE_CATALOG.has(id), `gadget ${id} missing from the console catalogue`).toBe(true);
    }
  });

  it("knows every curated resource a child can follow", () => {
    // The larger half. Only eight of the forty-four pursuits have a game, so for the rest a
    // followed link is the only act that can become evidence. The ingest route resolves these; if
    // the console did not, a follow would count on the way in and vanish on the way back out.
    for (const r of SEED_LIBRARY) {
      expect(CONSOLE_CATALOG.has(r.id), `resource ${r.id} missing from the console catalogue`).toBe(
        true,
      );
    }
  });

  it("is strictly larger than the pilot fixtures alone", () => {
    // The regression this guards. The plan panel used to hold only the fixtures, which is a
    // catalogue that describes no real child.
    expect(CONSOLE_CATALOG.size).toBeGreaterThan(GADGET_CATALOG.size + SEED_LIBRARY.length);
  });

  it("gives every artifact exactly one meaning", () => {
    // Three sources merge here. A shared id across two of them would silently retag one child's
    // play as another domain, which is worse than a crash and much harder to notice.
    const seen = new Map<string, string>();
    for (const [id, art] of CONSOLE_CATALOG) {
      const path = art.domainPath.join("/");
      const held = seen.get(id);
      expect(held === undefined || held === path).toBe(true);
      seen.set(id, path);
    }
  });
});
