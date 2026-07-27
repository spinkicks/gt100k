// @gt100k/project-evidence-sink — THE seam between PassionLab and the EvidenceGraph.
//
// ─── Why this package exists, and why it is the ONLY one of its kind ───────────────────────────────
//
// The `@gt100k/evidence-*` packages are a SEPARATE PRODUCT, developed in this repo and intended for
// extraction as a mechanical copy (`docs/decisions/evidencegraph-v1-design.md` §11/§13a). Two rules
// keep that extraction mechanical:
//
//   A. Nothing outside `@gt100k/evidence-*` imports a VALUE from inside it — EXCEPT this file.
//   B. Nothing inside `@gt100k/evidence-*` imports anything from outside it, ever.
//
// An adapter cannot obey both: bridging two sides means importing from one of them. So this package is
// a single, named, deliberate exemption to rule A, and the boundary check hard-codes it as such. If a
// second package ever needs the exemption, that is the signal the seam is in the wrong place — not the
// signal to widen the list.
//
// It lives OUTSIDE the namespace (it used to be `@gt100k/evidence-sink-graph`, inside it) because of
// what happens on extraction day. An adapter inside the namespace would be lifted out WITH the graph,
// still depending on `@gt100k/project-workspace`, which stays behind — a dangling dependency created by
// the very move it was supposed to survive. Sitting outside, it stays behind with PassionLab and
// consumes the extracted graph as a published package. Which is precisely its job.
//
// ─── What it does ─────────────────────────────────────────────────────────────────────────────────
//
// It MATERIALIZES the plan that `@gt100k/project-workspace` produces. The division is deliberate:
// the §4.3 MAPPING (which entry kind becomes which node type, which edges it earns) is passion-domain
// knowledge and lives in `toEvidencePlan`; content-addressing and DAG validation are graph knowledge
// and live here. This is now the only code in the repo outside the namespace that touches
// `addNode`/`addEdge`, which is what the old adapter's header always claimed and had stopped being
// true once `to-evidence.ts` began calling them directly.
//
// FAIL-SAFE (a NON-NEGOTIABLE invariant): a malformed event must be SKIPPED, never thrown through
// `record`. A bad `kind` is dropped before materialization; anything else that would throw (a dangling
// ref, a cycle, a structurally-toxic field) is caught per-event and skipped, leaving the well-formed
// events intact. Deterministic + offline: no clock, no randomness, no network.
import { addEdge, addNode } from "@gt100k/evidence-graph";
import type { EvidenceGraph, EvidenceNode } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { WORK_EVENT_KINDS, toEvidencePlan } from "@gt100k/project-workspace";
import type { EvidencePlan, PlanRef, Project, WorkEvent } from "@gt100k/project-workspace";

/**
 * Synchronous content hasher. Declared here rather than imported from `@gt100k/evidence-graph`'s
 * `ports.ts`, which its barrel does not re-export. Structurally identical, so it is assignable to
 * `addNode`'s hasher parameter.
 */
export interface Hasher {
  hash(input: Uint8Array): string;
}

/** Maps a project's events onto the closed EvidenceGraph taxonomy. Pure over the project. */
export interface EvidenceSink {
  record(project: Project): EvidenceGraph;
}

/** Resolve a plan reference to the string the graph expects on an edge end. */
function resolveRef(ref: PlanRef, nodeIdByEventId: ReadonlyMap<string, string>): string {
  if (ref.kind === "literal") {
    // Already final — an `actor.ref` or a `tool.name`, which the graph resolves without a node.
    return ref.ref;
  }
  const nodeId = nodeIdByEventId.get(ref.eventId);
  if (nodeId === undefined) {
    // Unreachable for a plan from `toEvidencePlan`, which only ever references events it has already
    // emitted a node for. Reachable for a hand-built plan, and the fail-safe below turns it into a
    // skipped event rather than a thrown `record`.
    throw new Error(`DANGLING_REF: plan references unknown event ${ref.eventId}`);
  }
  return nodeId;
}

/**
 * Turn a plan into a graph: hash each node to get its content-addressed id, then add the edges with
 * their references resolved.
 *
 * Nodes are materialized in journey order, so an event's inputs are already in the id map by the time
 * it is hashed. Edges follow in plan order, which reproduces exactly the `addEdge` sequence the old
 * in-place fold performed — so the cycle and dangling-ref checks fire on the same edges as before, and
 * the resulting node ids are byte-identical.
 */
export function materialize(plan: EvidencePlan, hasher: Hasher): EvidenceGraph {
  let graph: EvidenceGraph = { nodes: {}, edges: [] };
  const nodeIdByEventId = new Map<string, string>();

  for (const planned of plan.nodes) {
    const inputs = planned.inputEventIds
      .map((eventId) => nodeIdByEventId.get(eventId))
      .filter((nodeId): nodeId is string => nodeId !== undefined);

    const content: Omit<EvidenceNode, "id"> = {
      type: planned.type,
      actor: { ...planned.actor },
      ...(planned.tool !== undefined ? { tool: { ...planned.tool } } : {}),
      inputs,
      timestamp: planned.timestamp,
      consentScope: { ...planned.consentScope },
      payload: { ...planned.payload },
    };

    const added = addNode(graph, content, hasher);
    graph = added.graph;
    nodeIdByEventId.set(planned.eventId, added.id);
  }

  for (const planned of plan.edges) {
    graph = addEdge(graph, {
      type: planned.type,
      from: resolveRef(planned.from, nodeIdByEventId),
      to: resolveRef(planned.to, nodeIdByEventId),
    });
  }

  return graph;
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
 * A deterministic, non-crypto content hasher for CI + LOOP_QA. Two FNV-1a passes with distinct offset
 * bases are concatenated for a 16-hex digest (ample collision headroom for demo-sized graphs).
 * Content-only ⇒ identical input bytes always yield the identical id (no clock/random).
 */
export const stubHasher: Hasher = {
  hash(input: Uint8Array): string {
    return fnv1aBytes(input, 0x811c9dc5) + fnv1aBytes(input, 0x9e3779b1);
  },
};

/** The ten valid quest-entry kinds, as a set for O(1) pre-materialization validation. */
const VALID_KINDS: ReadonlySet<string> = new Set<string>(WORK_EVENT_KINDS);

/** Cheap structural gate: a real kind and the string fields the mapping reads. */
function hasKnownKind(workEvent: WorkEvent): boolean {
  return typeof workEvent.kind === "string" && VALID_KINDS.has(workEvent.kind);
}

/**
 * The graph-backed `EvidenceSink`. Defaults to the SHA-256 `NodeCryptoHasher`; a caller may inject any
 * `Hasher` (e.g. `stubHasher`) to reproduce the mapping byte-for-byte in CI.
 *
 * Events are proved one at a time so a single malformed event can be isolated and skipped without
 * discarding the rest of the journey: each candidate is materialized against the accumulated-safe
 * prefix, and dropped if that throws.
 */
export function graphEvidenceSink(hasher: Hasher = new NodeCryptoHasher()): EvidenceSink {
  return {
    record(project: Project): EvidenceGraph {
      const safe: WorkEvent[] = [];

      for (const workEvent of project.events) {
        // Drop events the closed taxonomy has no mapping for BEFORE they can reach materialization.
        if (!hasKnownKind(workEvent)) {
          continue;
        }
        try {
          // Re-materialize the safe prefix plus this candidate; if it does not throw it is sound.
          materialize(toEvidencePlan({ ...project, events: [...safe, workEvent] }), hasher);
          safe.push(workEvent);
        } catch {
          // Fail-safe: a dangling ref / cycle / toxic field can never throw through `record`.
        }
      }

      return materialize(toEvidencePlan({ ...project, events: safe }), hasher);
    },
  };
}

/**
 * The deterministic stub sink for CI + LOOP_QA: the real mapping, the non-crypto hasher.
 *
 * Deliberately NOT `graphEvidenceSink(stubHasher)`. The stub materializes in one pass with no
 * per-event probe, so a malformed project THROWS here rather than being silently trimmed. That is the
 * behaviour it has always had, and it is the more useful one for a test double: a fixture that is
 * quietly wrong should fail loudly in CI, not get repaired on the way through. `graphEvidenceSink` is
 * where the fail-safe belongs, because that is the one facing real child data.
 */
export const stubEvidenceSink: EvidenceSink = {
  record: (project) => materialize(toEvidencePlan(project), stubHasher),
};
