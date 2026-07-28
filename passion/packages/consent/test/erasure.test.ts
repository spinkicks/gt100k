/**
 * Taking a child back out, and being honest about where we cannot.
 *
 * The interesting behaviour is the failure path. A guardian asking for erasure gets one answer, and
 * "done" when a store still holds the data is the worst thing this code could say. So a store that
 * cannot forget is named, not swallowed, and one broken adapter never stops the others.
 */
import { describe, expect, it } from "vitest";

import { eraseEverywhere, type ErasableStore } from "../src/erasure.js";

const store = (name: string, ok: boolean): ErasableStore => ({
  name,
  erase: async () => ok,
});

const throwing = (name: string): ErasableStore => ({
  name,
  erase: async () => {
    throw new Error("disk on fire");
  },
});

describe("eraseEverywhere", () => {
  it("reports complete only when every store forgot", async () => {
    const r = await eraseEverywhere([store("profiles", true), store("logs", true)], "kid-1");
    expect(r.complete).toBe(true);
    expect(r.erased).toEqual(["profiles", "logs"]);
    expect(r.unerased).toEqual([]);
  });

  it("names the store that could not, rather than reporting success", async () => {
    // This is the EvidenceGraph case. It is content-addressed, so deleting a node breaks the edges
    // that reference it and the ids leak the shape of what went. That is E1's D2 and it is unsolved;
    // showing a guardian a green tick over it would be a lie with a person on the other end.
    const r = await eraseEverywhere(
      [store("profiles", true), store("evidence graph", false)],
      "kid-1",
    );
    expect(r.complete).toBe(false);
    expect(r.unerased).toEqual(["evidence graph"]);
    expect(r.erased).toEqual(["profiles"]);
  });

  it("keeps going after a store throws, because partial erasure beats none", async () => {
    const r = await eraseEverywhere([throwing("broken"), store("profiles", true)], "kid-1");
    expect(r.erased).toEqual(["profiles"]);
    expect(r.unerased).toEqual(["broken"]);
  });

  it("treats a throw as a failure to forget, not as an error to surface", async () => {
    await expect(eraseEverywhere([throwing("broken")], "kid-1")).resolves.toMatchObject({
      complete: false,
    });
  });

  it("is vacuously complete with nothing to erase, and says so", async () => {
    const r = await eraseEverywhere([], "kid-1");
    expect(r).toEqual({ kidId: "kid-1", erased: [], unerased: [], complete: true });
  });
});
