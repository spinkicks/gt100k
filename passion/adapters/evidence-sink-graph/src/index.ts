// @gt100k/evidence-sink-graph — the REAL `EvidenceSink` (spec §4.4 / plan Task 5).
//
// It folds a child's honest journey onto the CLOSED `@gt100k/evidence-graph` taxonomy using a real
// SHA-256 `Hasher` (`@gt100k/evidence-hash-node`, the default). It adds NO mapping of its own: the
// §4.3 mapping lives once in the domain `toEvidence`, and this adapter only substitutes the hasher —
// so an E1 API change is a one-file change. It is the ONLY code that touches the teammate's evolving
// `addNode`/`addEdge` API, and is NEVER imported by a domain test.
//
// FAIL-SAFE (a NON-NEGOTIABLE invariant): a malformed event must be SKIPPED, never thrown through
// `record`. A bad `kind` is dropped before the fold; anything else that would make the fold throw
// (a dangling ref, a cycle, a structurally-toxic field) is caught per-event and skipped, leaving the
// well-formed events intact. Deterministic + offline: no clock, no randomness, no network.
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { WORK_EVENT_KINDS, toEvidence } from "@gt100k/project-workspace";
import type { EvidenceSink, Hasher, Project, WorkEvent } from "@gt100k/project-workspace";

/** The ten valid quest-entry kinds, as a set for O(1) pre-fold validation. */
const VALID_KINDS: ReadonlySet<string> = new Set<string>(WORK_EVENT_KINDS);

/** Cheap structural gate: a real kind and the string fields the fold reads. */
function hasKnownKind(event: WorkEvent): boolean {
  return typeof event.kind === "string" && VALID_KINDS.has(event.kind);
}

/**
 * The real graph-backed `EvidenceSink`. Defaults to the SHA-256 `NodeCryptoHasher`; a caller may
 * inject any `Hasher` (e.g. the deterministic stub) to reproduce the domain mapping byte-for-byte.
 *
 * The fold is built one event at a time so a single malformed event can be isolated and skipped
 * without discarding the rest of the journey. Each candidate is proved to fold cleanly against the
 * accumulated-safe prefix before it is kept; if it throws, it is dropped and the prefix is preserved.
 */
export function graphEvidenceSink(hasher: Hasher = new NodeCryptoHasher()): EvidenceSink {
  return {
    record(project: Project): EvidenceGraph {
      const safe: WorkEvent[] = [];

      for (const event of project.events) {
        // Drop events the closed taxonomy has no mapping for BEFORE they can reach the fold.
        if (!hasKnownKind(event)) {
          continue;
        }
        try {
          // Re-fold the safe prefix plus this candidate; if it folds without throwing it is sound.
          toEvidence({ ...project, events: [...safe, event] }, hasher);
          safe.push(event);
        } catch {
          // Fail-safe: a dangling ref / cycle / toxic field can never throw through `record`.
        }
      }

      return toEvidence({ ...project, events: safe }, hasher);
    },
  };
}
