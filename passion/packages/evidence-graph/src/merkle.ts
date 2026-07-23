import type { EvidenceGraph } from "./model.js";
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

/**
 * Computes a deterministic RFC-6962 root over SHA-256 content digests, preserving the caller's
 * input order (true CT scheme — an off-the-shelf RFC-6962 verifier can re-derive it). Callers that
 * need order-independence must sort before calling; `graphMerkleRoot` orders by (timestamp, id).
 */
export function merkleRoot(hashes: readonly string[], hasher: Hasher): string {
  if (hashes.length === 0) {
    throw new Error("EMPTY_MERKLE_INPUT");
  }

  let level = hashes.map(decodeDigest).map((digest) => hashWithPrefix(0x00, [digest], hasher));

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

/**
 * Canonical node order for a project graph's Merkle root: ascending `timestamp`, then ascending
 * content `id` as a stable tiebreak for equal timestamps (keeps the root reproducible).
 */
export function orderedGraphNodeIds(graph: EvidenceGraph): string[] {
  return Object.values(graph.nodes)
    .slice()
    .sort((left, right) => {
      if (left.timestamp !== right.timestamp) {
        return left.timestamp < right.timestamp ? -1 : 1;
      }
      if (left.id === right.id) {
        return 0;
      }
      return left.id < right.id ? -1 : 1;
    })
    .map((node) => node.id);
}

/** Deterministic Merkle root over a whole project graph's nodes (one graph per project). */
export function graphMerkleRoot(graph: EvidenceGraph, hasher: Hasher): string {
  return merkleRoot(orderedGraphNodeIds(graph), hasher);
}
