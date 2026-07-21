import type { Hasher } from "./ports.js";

const SHA256_HEX = /^[0-9a-f]{64}$/;

function decodeDigest(digest: string): Uint8Array {
  if (!SHA256_HEX.test(digest)) {
    throw new Error("INVALID_SHA256_DIGEST");
  }

  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(digest.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function compareBytes(left: Uint8Array, right: Uint8Array): number {
  for (let index = 0; index < left.length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

function hashWithPrefix(prefix: 0x00 | 0x01, parts: readonly Uint8Array[], hasher: Hasher): string {
  const inputLength = parts.reduce((length, part) => length + part.length, 1);
  const input = new Uint8Array(inputLength);
  input[0] = prefix;

  let offset = 1;
  for (const part of parts) {
    input.set(part, offset);
    offset += part.length;
  }

  return hasher.hash(input);
}

/** Computes a deterministic RFC-6962 root over SHA-256 content digests. */
export function merkleRoot(hashes: readonly string[], hasher: Hasher): string {
  if (hashes.length === 0) {
    throw new Error("EMPTY_MERKLE_INPUT");
  }

  let level = hashes
    .map(decodeDigest)
    .sort(compareBytes)
    .map((digest) => hashWithPrefix(0x00, [digest], hasher));

  while (level.length > 1) {
    const nextLevel: string[] = [];

    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      if (left === undefined) {
        throw new Error("INVALID_MERKLE_LEVEL");
      }

      const right = level[index + 1];
      if (right === undefined) {
        nextLevel.push(left);
        continue;
      }

      nextLevel.push(hashWithPrefix(0x01, [decodeDigest(left), decodeDigest(right)], hasher));
    }

    level = nextLevel;
  }

  const root = level[0];
  if (root === undefined) {
    throw new Error("EMPTY_MERKLE_INPUT");
  }
  return root;
}
