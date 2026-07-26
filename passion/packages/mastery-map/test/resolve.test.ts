/**
 * Which map a domain resolves to, tested where the rule lives rather than once per caller.
 *
 * The rule was written twice: `MapStore.get` did most-specific-then-widen, and the guide console
 * compared paths for equality. The second one is a subset of the first, so a child whose spike sits
 * on a sub-topic path, reading a map filed at the cabin above it, resolved to nothing and was told
 * they had no certified spike in a domain they demonstrably do. One implementation, both callers.
 */
import { describe, expect, it } from "vitest";

import { samePath, servesPath } from "../src/resolve.js";

describe("samePath", () => {
  it("holds for the same domain and not for a different one", () => {
    expect(samePath(["games-strategy"], ["games-strategy"])).toBe(true);
    expect(samePath(["games-strategy", "chess"], ["games-strategy", "chess"])).toBe(true);
    expect(samePath(["games-strategy", "chess"], ["games-strategy", "go"])).toBe(false);
    expect(samePath(["games-strategy"], ["games-strategy", "chess"])).toBe(false);
  });
});

describe("servesPath: most specific wins, and the fallback only ever widens", () => {
  it("serves the exact domain", () => {
    expect(servesPath(["games-strategy", "chess"], ["games-strategy", "chess"])).toBe(true);
    expect(servesPath(["games-strategy"], ["games-strategy"])).toBe(true);
  });

  /** The case the console was getting wrong: a cabin map does serve a sub-topic spike. */
  it("serves a sub-topic query from the cabin above it", () => {
    expect(servesPath(["games-strategy"], ["games-strategy", "chess"])).toBe(true);
    expect(servesPath(["code-computers"], ["code-computers", "game-dev"])).toBe(true);
  });

  /**
   * And never the other way round. A map about chess is not a map about strategy games, and
   * answering the wider question with the narrower map is a substitution the caller could not see.
   */
  it("never narrows a cabin query down to a sub-topic map", () => {
    expect(servesPath(["games-strategy", "chess"], ["games-strategy"])).toBe(false);
  });

  it("serves nothing across cabins", () => {
    expect(servesPath(["music-sound"], ["code-computers", "game-dev"])).toBe(false);
    expect(servesPath(["music-sound", "instruments"], ["music-sound", "production"])).toBe(false);
  });
});
