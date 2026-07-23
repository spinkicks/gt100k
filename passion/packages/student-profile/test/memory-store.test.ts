import { describe, it, expect } from "vitest";
import { emptyProfile, createMemoryProfileStore } from "../src/index.js";

const A = emptyProfile("kid-a", "Ari");
const B = emptyProfile("kid-b", "Bex");

describe("createMemoryProfileStore", () => {
  it("save→load returns a deep-equal profile that is NOT the same reference", async () => {
    const store = createMemoryProfileStore();
    await store.save(A);
    const loaded = await store.load("kid-a");
    expect(loaded).toEqual(A);
    expect(loaded).not.toBe(A);
  });

  it("returns null for an unknown kidId", async () => {
    const store = createMemoryProfileStore();
    expect(await store.load("nope")).toBeNull();
  });

  it("stored state is immutable to caller mutation (clone on save AND on load)", async () => {
    const store = createMemoryProfileStore();
    const mutable = { ...emptyProfile("kid-m", "Mo"), interactions: [] as unknown[] };
    await store.save(mutable as never);
    // Mutate the object we handed to save() — the store's copy must not change.
    mutable.interactions.push({ tampered: true });
    const first = await store.load("kid-m");
    expect(first!.interactions).toHaveLength(0);
    // Mutate the object we got back from load() — the store's copy must not change.
    (first!.interactions as unknown[]).push({ tampered: true });
    const second = await store.load("kid-m");
    expect(second!.interactions).toHaveLength(0);
  });

  it("list() returns the kidIds of saved profiles", async () => {
    const store = createMemoryProfileStore();
    await store.save(A);
    await store.save(B);
    expect([...(await store.list())].sort()).toEqual(["kid-a", "kid-b"]);
  });

  it("accepts a seed and lists/loads it", async () => {
    const store = createMemoryProfileStore([A, B]);
    expect([...(await store.list())].sort()).toEqual(["kid-a", "kid-b"]);
    expect(await store.load("kid-b")).toEqual(B);
  });

  it("save overwrites an existing kidId", async () => {
    const store = createMemoryProfileStore([A]);
    const updated = { ...A, displayName: "Ari-2" };
    await store.save(updated);
    expect((await store.load("kid-a"))!.displayName).toBe("Ari-2");
    expect(await store.list()).toHaveLength(1);
  });
});
