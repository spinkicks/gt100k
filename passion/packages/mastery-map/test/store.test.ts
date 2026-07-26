/**
 * The in-memory `MapStore` (spec §4). Two behaviours carry real weight here and both are tested for
 * the failure and not only the happy path:
 *
 * - optimistic concurrency, because two guides editing the same map is a real case and
 *   last-write-wins would silently discard one of them;
 * - most-specific-match resolution, because a merged DAG is one nobody authored and nobody
 *   validated, so the fallback must pick ONE map rather than blend two.
 */
import { describe, expect, it } from "vitest";

import { cleanMap, milestone } from "../src/__fixtures__/builders.js";
import { MAP_VERSION_CONFLICT, createMemoryMapStore } from "../src/memory-store.js";
import type { MasteryMap } from "../src/model.js";

const cabinMap = cleanMap({
  id: "map-cabin",
  domainPath: ["games-strategy"],
  milestones: [milestone({ id: "cabin-only" })],
});

const chessMap = cleanMap({
  id: "map-chess",
  domainPath: ["games-strategy", "chess"],
  milestones: [milestone({ id: "chess-only" })],
});

describe("createMemoryMapStore, optimistic concurrency", () => {
  it("accepts a brand new map at version 1 when nothing is stored", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);
    await expect(store.get(["games-strategy"])).resolves.toEqual(cabinMap);
  });

  it("rejects a brand new map that does not start at version 1", async () => {
    const store = createMemoryMapStore();
    await expect(store.put({ ...cabinMap, version: 2 })).rejects.toThrow(MAP_VERSION_CONFLICT);
  });

  it("accepts the next version in sequence", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);
    await store.put({ ...cabinMap, version: 2 });
    await expect(store.get(["games-strategy"])).resolves.toMatchObject({ version: 2 });
  });

  it("rejects a version that skips ahead", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);
    await expect(store.put({ ...cabinMap, version: 3 })).rejects.toThrow(MAP_VERSION_CONFLICT);
  });

  /**
   * The case the rule exists for. Both guides read version 1 and both write version 2. Without the
   * check the second write would land on top of the first and the first guide's edit would be gone
   * with nothing anywhere recording that it happened.
   */
  it("rejects the second of two guides who both edited version 1", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);

    const guideA = { ...cabinMap, version: 2, milestones: [milestone({ id: "from-guide-a" })] };
    const guideB = { ...cabinMap, version: 2, milestones: [milestone({ id: "from-guide-b" })] };
    await store.put(guideA);
    await expect(store.put(guideB)).rejects.toThrow(MAP_VERSION_CONFLICT);

    const stored = await store.get(["games-strategy"]);
    expect(stored?.milestones.map((m) => m.id)).toEqual(["from-guide-a"]);
  });

  it("leaves the stored map untouched when a put is rejected", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);
    await expect(store.put({ ...cabinMap, version: 9 })).rejects.toThrow(MAP_VERSION_CONFLICT);
    await expect(store.get(["games-strategy"])).resolves.toEqual(cabinMap);
  });
});

describe("createMemoryMapStore, most-specific-match resolution", () => {
  it("resolves a sub-topic spike to the sub-topic map when one exists", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);
    await store.put(chessMap);
    await expect(store.get(["games-strategy", "chess"])).resolves.toEqual(chessMap);
  });

  it("falls back to the cabin map when no sub-topic map exists", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);
    await expect(store.get(["games-strategy", "chess"])).resolves.toEqual(cabinMap);
  });

  /**
   * The two are NEVER blended. A merged DAG is one nobody authored and nobody validated, so the
   * resolved map must be exactly one of the stored maps, milestones and identity included.
   */
  it("never merges the two: the winner is one whole stored map", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);
    await store.put(chessMap);

    const resolved = await store.get(["games-strategy", "chess"]);
    expect(resolved?.id).toBe("map-chess");
    expect(resolved?.milestones.map((m) => m.id)).toEqual(["chess-only"]);
    expect(resolved?.milestones.map((m) => m.id)).not.toContain("cabin-only");
  });

  it("does not promote a sub-topic map up to a cabin query", async () => {
    const store = createMemoryMapStore();
    await store.put(chessMap);
    await expect(store.get(["games-strategy"])).resolves.toBeNull();
  });

  it("returns null when nothing matches at either level", async () => {
    const store = createMemoryMapStore();
    await expect(store.get(["music-sound", "production"])).resolves.toBeNull();
  });
});

/**
 * Spec §8: a map whose `validation.errors` is non-empty is never returned by whatever a plan would
 * consume. `get` is that accessor, so `get` is where the rule lives. The review screen needs the
 * opposite guarantee, because a draft nobody can see is a draft nobody can fix, so it reads through
 * `getForReview` and gets the map whatever state it is in.
 */
describe("createMemoryMapStore, what a plan may consume", () => {
  const brokenRecord = {
    validatedAt: "2026-07-26T00:00:00.000Z",
    validatorVersion: "v1",
    errors: [
      { code: "E2_EMPTY", severity: "error", message: "capability is empty" },
    ] as const as MasteryMap["validation"]["errors"],
    warnings: [],
  };

  const brokenMap = cleanMap({
    id: "map-broken",
    domainPath: ["math-puzzles"],
    validation: brokenRecord,
  });

  it("never hands out a map carrying an error", async () => {
    const store = createMemoryMapStore([brokenMap]);
    await expect(store.get(["math-puzzles"])).resolves.toBeNull();
  });

  it("hands that same map to the review screen, which has to see it to correct it", async () => {
    const store = createMemoryMapStore([brokenMap]);
    await expect(store.getForReview(["math-puzzles"])).resolves.toEqual(brokenMap);
  });

  it("lists an invalid draft, because the review queue is where it gets fixed", async () => {
    const store = createMemoryMapStore([brokenMap]);
    const drafts = await store.listDrafts();
    expect(drafts.map((m) => m.id)).toEqual(["map-broken"]);
  });

  /** Staleness is judged only when a clock is supplied, exactly as warning rule 5 is. The store
      reads no clock of its own, so with none given it can check the errors and nothing else. */
  it("withholds a stale map when it is given a clock, and cannot judge age without one", async () => {
    const stale = cleanMap({
      id: "map-stale",
      domainPath: ["science-nature"],
      revalidatedAt: "2026-01-01T00:00:00.000Z",
    });
    const clocked = createMemoryMapStore([stale], "2026-07-26T00:00:00.000Z");
    await expect(clocked.get(["science-nature"])).resolves.toBeNull();
    await expect(clocked.getForReview(["science-nature"])).resolves.toEqual(stale);
    await expect(createMemoryMapStore([stale]).get(["science-nature"])).resolves.toEqual(stale);
  });

  /**
   * The fallback widens on ABSENCE and never on invalidity. Handing back the cabin map because the
   * chess map has an error would answer a question about chess with a map about games in general,
   * and the caller would have no way of knowing it had happened.
   */
  it("does not widen to the cabin map when the sub-topic map is the unusable one", async () => {
    const brokenChess = cleanMap({
      id: "map-chess",
      domainPath: ["games-strategy", "chess"],
      validation: brokenRecord,
    });
    const store = createMemoryMapStore([cabinMap, brokenChess]);
    await expect(store.get(["games-strategy", "chess"])).resolves.toBeNull();
    await expect(store.getForReview(["games-strategy", "chess"])).resolves.toMatchObject({
      id: "map-chess",
    });
  });
});

describe("createMemoryMapStore, the rest of the port", () => {
  it("lists drafts and nothing else", async () => {
    const store = createMemoryMapStore();
    await store.put(cabinMap);
    await store.put({ ...chessMap, status: "published" });
    await store.put({ ...cleanMap({ id: "map-gone" }), status: "withdrawn" });
    const drafts = await store.listDrafts();
    expect(drafts.map((m) => m.id)).toEqual(["map-cabin"]);
  });

  it("shares no references with the caller in either direction", async () => {
    const store = createMemoryMapStore();
    const mutable = structuredClone(cabinMap) as unknown as { milestones: { id: string }[] };
    await store.put(mutable as unknown as typeof cabinMap);
    mutable.milestones = [];

    const first = await store.get(["games-strategy"]);
    expect(first?.milestones.map((m) => m.id)).toEqual(["cabin-only"]);

    (first as unknown as { milestones: unknown[] }).milestones = [];
    await expect(store.get(["games-strategy"])).resolves.toEqual(cabinMap);
  });

  it("seeds from a starting set so a test does not have to put first", async () => {
    const store = createMemoryMapStore([cabinMap, chessMap]);
    await expect(store.get(["games-strategy", "chess"])).resolves.toEqual(chessMap);
  });
});
