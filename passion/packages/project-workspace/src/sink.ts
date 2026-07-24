// The `EvidenceSink` port (§4.4) + a deterministic in-package stub. A sink turns a `Project`'s
// honest journey into an `@gt100k/evidence-graph` `EvidenceGraph`. The STUB uses a content-only,
// non-crypto hasher (FNV-1a → hex) so ids are stable across runs with NO clock, NO randomness and
// NO network — CI + LOOP_QA depend on that determinism (SC-4). The REAL adapter
// (`@gt100k/evidence-sink-graph`) reuses the same `toEvidence` mapping and swaps in a SHA-256 hasher.
import type { EvidenceGraph } from "@gt100k/evidence-graph";

import type { Project } from "./model.js";
import { toEvidence } from "./to-evidence.js";

// Structurally identical to the `@gt100k/evidence-graph` `Hasher` port (which its barrel does not
// re-export), so the stub and the real `@gt100k/evidence-sink-graph` adapter share ONE type that is
// assignable to `addNode`'s hasher parameter.
export interface Hasher {
  hash(input: Uint8Array): string;
}

/** Maps a project's events onto the closed EvidenceGraph taxonomy. Pure over the project. */
export interface EvidenceSink {
  record(project: Project): EvidenceGraph;
}

/** Deterministic 32-bit FNV-1a over raw bytes with a supplied offset basis → 8 hex chars. */
function fnv1aBytes(bytes: Uint8Array, offsetBasis: number): string {
  let hash = offsetBasis >>> 0;
  for (const byte of bytes) {
    hash ^= byte;
    // FNV prime 16777619, kept in 32-bit unsigned space via Math.imul + >>> 0.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * A deterministic, non-crypto content hasher for CI + LOOP_QA. Two FNV-1a passes with distinct
 * offset bases are concatenated for a 16-hex digest (ample collision headroom for demo-sized
 * graphs). Content-only ⇒ identical input bytes always yield the identical id (no clock/random).
 */
export const stubHasher = {
  hash(input: Uint8Array): string {
    return fnv1aBytes(input, 0x811c9dc5) + fnv1aBytes(input, 0x9e3779b1);
  },
};

/** The in-package stub sink: `toEvidence` folded through the deterministic `stubHasher`. */
export const stubEvidenceSink: EvidenceSink = {
  record: (project) => toEvidence(project, stubHasher),
};
