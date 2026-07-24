import {
  type ExplorerView,
  type VerificationView,
  buildExplorerView,
  buildVerificationView,
} from "@gt100k/evidence-explorer-view";
/**
 * Manual add-node / add-edge core (Phase 4) — pure, framework-free, **server-safe** glue over the
 * `@gt100k/evidence-graph` domain. It builds a node `content` from a small manual input, appends it
 * content-addressed via `addNode`, appends resolved edges via `addEdge` (which enforces the DAG +
 * no-dangling invariants), and re-derives the whole render bundle (explorer view + verification view)
 * so the caller can lift a fresh, deterministic `{ graph, view, verification }` into React state.
 *
 * There is **no crypto here**: the `Hasher` is injected (the app news up the Node SHA-256 hasher in
 * the server action, so it never reaches the client). This module never mutates its inputs — every
 * add returns a new graph, exactly like the domain functions it wraps. Adds are append-only: no
 * node/edge is ever removed or rewritten.
 */
import type {
  ActorKind,
  EdgeType,
  EvidenceGraph,
  EvidenceNode,
  NodeType,
} from "@gt100k/evidence-graph";
import { addEdge, addNode } from "@gt100k/evidence-graph";
import { DeterministicStubVerifier } from "@gt100k/evidence-verifier-stub";

/** Synchronous content hasher (the domain `Hasher` port; typed structurally to avoid a deep import). */
export interface Hasher {
  hash(input: Uint8Array): string;
}

/** The minimal manual node input the side panel collects. */
export interface AddNodeInput {
  readonly type: NodeType;
  readonly title: string;
  readonly actorKind: ActorKind;
  readonly actorRef: string;
  /** Monotonic ISO timestamp supplied by the caller (never `Date.now()` — see the panel). */
  readonly timestamp: string;
}

/** The minimal manual edge input the side panel collects. */
export interface AddEdgeInput {
  readonly type: EdgeType;
  readonly from: string;
  readonly to: string;
}

/** Default consent scope carried by a manually-entered node (metadata only; no consent decision). */
const MANUAL_CONSENT = { scope: "manual", purpose: "manual-entry" } as const;

/**
 * Append a manually-entered node, content-addressed via the domain `addNode` (idempotent: identical
 * input yields the same id and leaves the graph unchanged). Throws `INVALID_NODE_INPUT` when the
 * title or actor ref is blank — everything else is the domain's job.
 */
export function applyAddNode(
  graph: EvidenceGraph,
  input: AddNodeInput,
  hasher: Hasher,
): { graph: EvidenceGraph; id: string } {
  const title = input.title.trim();
  const actorRef = input.actorRef.trim();
  if (title === "" || actorRef === "") {
    throw new Error("INVALID_NODE_INPUT");
  }

  const content: Omit<EvidenceNode, "id"> = {
    type: input.type,
    actor: { kind: input.actorKind, ref: actorRef },
    inputs: [],
    timestamp: input.timestamp,
    consentScope: { ...MANUAL_CONSENT },
    payload: { title },
  };

  return addNode(graph, content, hasher);
}

/**
 * Append a resolved edge via the domain `addEdge`. Lets the domain's `DANGLING_REF` (missing
 * from/to) and `CYCLE` (self-edge or back-edge) errors propagate — the caller surfaces them. The
 * `hasher` is accepted for signature symmetry with {@link applyAddNode} but is unused (edges carry
 * no content address).
 */
export function applyAddEdge(
  graph: EvidenceGraph,
  input: AddEdgeInput,
  _hasher?: Hasher,
): { graph: EvidenceGraph } {
  return { graph: addEdge(graph, { type: input.type, from: input.from, to: input.to }) };
}

/**
 * Deterministically tamper the released-subject node's payload (mirrors the fixture's `applyTamper`,
 * but keyed on the subject digest so it also works after manual adds). The stored id is unchanged, so
 * the mismatch surfaces only at verify time when node hashes are re-derived from content. Returns a
 * new graph; the input is untouched. If the subject node is absent the graph is returned as-is.
 */
export function tamperSubject(graph: EvidenceGraph, subjectDigest: string): EvidenceGraph {
  const target = graph.nodes[subjectDigest];
  if (target === undefined) {
    return graph;
  }
  return {
    nodes: {
      ...graph.nodes,
      [subjectDigest]: {
        ...target,
        payload: { ...target.payload, title: "Tampered released artifact", tampered: true },
      },
    },
    edges: graph.edges,
  };
}

/** Everything the client needs to re-render after an add: the explorer view + honest verification. */
export interface RebuiltBundle {
  readonly view: ExplorerView;
  readonly verification: VerificationView;
  readonly graph: EvidenceGraph;
}

/**
 * Re-derive the render bundle for the current working graph: the deterministic `ExplorerView` (every
 * node in-milestone) plus the honest `VerificationView` (verifier result + re-derived Merkle root /
 * subject binding / human-authority). Pure w.r.t. its inputs; all hashing goes through the injected
 * hasher.
 */
export async function rebuildBundle(
  graph: EvidenceGraph,
  projectRef: string,
  subjectDigest: string,
  hasher: Hasher,
): Promise<RebuiltBundle> {
  const milestoneNodeIds = Object.keys(graph.nodes);
  const view = buildExplorerView(graph, { milestoneNodeIds, projectRef }, { tier: "calm2d" });
  const verifierResult = await new DeterministicStubVerifier().verify(graph, hasher);
  const verification = buildVerificationView(graph, verifierResult, hasher, { subjectDigest });
  return { view, verification, graph };
}
