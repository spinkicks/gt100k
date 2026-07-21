import { describe, expect, expectTypeOf, it } from "vitest";
import type { Hasher } from "../../../packages/evidence-graph/src/ports.js";
import { NodeCryptoHasher } from "../src/index.js";

const ABC_BYTES = new Uint8Array([0x61, 0x62, 0x63]);

describe("NodeCryptoHasher", () => {
  it("implements the synchronous Hasher port", () => {
    expectTypeOf<NodeCryptoHasher>().toMatchTypeOf<Hasher>();
  });

  it("returns the lowercase SHA-256 known answer and not SHA-1 or MD5", () => {
    const digest = new NodeCryptoHasher().hash(ABC_BYTES);

    expect(digest).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).not.toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(digest).not.toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it("is deterministic for identical bytes", () => {
    const hasher = new NodeCryptoHasher();

    expect(hasher.hash(ABC_BYTES)).toBe(hasher.hash(new Uint8Array(ABC_BYTES)));
  });
});
