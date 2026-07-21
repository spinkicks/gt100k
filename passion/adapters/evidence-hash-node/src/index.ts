import { createHash } from "node:crypto";

/** Node.js SHA-256 implementation of the synchronous EvidenceGraph Hasher port. */
export class NodeCryptoHasher {
  hash(input: Uint8Array): string {
    return createHash("sha256").update(input).digest("hex");
  }
}
