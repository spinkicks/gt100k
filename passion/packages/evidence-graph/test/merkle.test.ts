import { describe, expect, it } from "vitest";

import { merkleRoot } from "../src/merkle.js";
import type { Hasher } from "../src/ports.js";

const DIGEST_A = "11".repeat(32);
const DIGEST_B = "22".repeat(32);
const DIGEST_C = "33".repeat(32);
const LEAF_A = "a1".repeat(32);
const LEAF_B = "b2".repeat(32);
const LEAF_C = "c3".repeat(32);
const INTERIOR_AB = "d4".repeat(32);
const INTERIOR_AA = "e5".repeat(32);
const ROOT_ABC = "f6".repeat(32);

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function leafInput(digest: string): string {
  return `00${digest}`;
}

function interiorInput(left: string, right: string): string {
  return `01${left}${right}`;
}

class ScriptedHasher implements Hasher {
  readonly inputs: string[] = [];

  constructor(private readonly outputs: Readonly<Record<string, string>>) {}

  hash(input: Uint8Array): string {
    const encoded = toHex(input);
    this.inputs.push(encoded);

    const output = this.outputs[encoded];
    if (output === undefined) {
      throw new Error(`unexpected hash input: ${encoded}`);
    }

    return output;
  }
}

function threeLeafHasher(): ScriptedHasher {
  return new ScriptedHasher({
    [leafInput(DIGEST_A)]: LEAF_A,
    [leafInput(DIGEST_B)]: LEAF_B,
    [leafInput(DIGEST_C)]: LEAF_C,
    [interiorInput(LEAF_A, LEAF_B)]: INTERIOR_AB,
    [interiorInput(INTERIOR_AB, LEAF_C)]: ROOT_ABC,
  });
}

describe("merkleRoot", () => {
  it("rejects an empty leaf set instead of inventing an unpinned root", () => {
    const hasher = new ScriptedHasher({});

    expect(() => merkleRoot([], hasher)).toThrowError("EMPTY_MERKLE_INPUT");
    expect(hasher.inputs).toEqual([]);
  });

  it.each(["ab", "AA".repeat(32), "gg".repeat(32)])(
    "rejects a non-SHA-256 lowercase digest: %s",
    (digest) => {
      const hasher = new ScriptedHasher({});

      expect(() => merkleRoot([digest], hasher)).toThrowError("INVALID_SHA256_DIGEST");
      expect(hasher.inputs).toEqual([]);
    },
  );

  it("is deterministic and permutation-independent after sorting digest bytes", () => {
    const orderedHasher = threeLeafHasher();
    const shuffledHasher = threeLeafHasher();

    const ordered = merkleRoot([DIGEST_A, DIGEST_B, DIGEST_C], orderedHasher);
    const shuffled = merkleRoot([DIGEST_C, DIGEST_A, DIGEST_B], shuffledHasher);

    expect(ordered).toBe(ROOT_ABC);
    expect(shuffled).toBe(ordered);
    expect(shuffledHasher.inputs.slice(0, 3)).toEqual([
      leafInput(DIGEST_A),
      leafInput(DIGEST_B),
      leafInput(DIGEST_C),
    ]);
  });

  it("returns the domain-separated leaf digest for a single content hash", () => {
    const hasher = new ScriptedHasher({ [leafInput(DIGEST_A)]: LEAF_A });

    expect(merkleRoot([DIGEST_A], hasher)).toBe(LEAF_A);
    expect(hasher.inputs).toEqual([leafInput(DIGEST_A)]);
  });

  it("promotes an odd right-most node unchanged instead of duplicating it", () => {
    const hasher = threeLeafHasher();

    expect(merkleRoot([DIGEST_A, DIGEST_B, DIGEST_C], hasher)).toBe(ROOT_ABC);
    expect(hasher.inputs).toEqual([
      leafInput(DIGEST_A),
      leafInput(DIGEST_B),
      leafInput(DIGEST_C),
      interiorInput(LEAF_A, LEAF_B),
      interiorInput(INTERIOR_AB, LEAF_C),
    ]);
    expect(hasher.inputs).not.toContain(interiorInput(LEAF_C, LEAF_C));
  });

  it("uses distinct single-byte domains for leaves and interior nodes", () => {
    const hasher = new ScriptedHasher({
      [leafInput(DIGEST_A)]: LEAF_A,
      [interiorInput(LEAF_A, LEAF_A)]: INTERIOR_AA,
    });

    const leaf = merkleRoot([DIGEST_A], hasher);
    const interior = merkleRoot([DIGEST_A, DIGEST_A], hasher);

    expect(leaf).not.toBe(interior);
    expect(hasher.inputs).toEqual([
      leafInput(DIGEST_A),
      leafInput(DIGEST_A),
      leafInput(DIGEST_A),
      interiorInput(LEAF_A, LEAF_A),
    ]);
  });
});
