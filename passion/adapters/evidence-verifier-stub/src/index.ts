import { addNode } from "../../../packages/evidence-graph/src/graph.js";
import { assertHumanAuthority } from "../../../packages/evidence-graph/src/invariants.js";
import type {
  EvidenceGraph,
  EvidenceNode,
  VerificationResult,
} from "../../../packages/evidence-graph/src/model.js";
import type { Hasher, Verifier } from "../../../packages/evidence-graph/src/ports.js";

const EMPTY_GRAPH: EvidenceGraph = { nodes: {}, edges: [] };
const CONTENT_HASH_MISMATCH = "CONTENT_HASH_MISMATCH";

function addReason(reasons: string[], reason: string): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

/** Re-derives a node's content-addressed id from its *current* content (via the domain). */
function recomputeId(node: EvidenceNode, hasher: Hasher): string {
  const { id: _committed, ...content } = node;
  return addNode(EMPTY_GRAPH, content, hasher).id;
}

/**
 * Deterministic unsigned verifier stub for the one-graph-per-project model. Integrity is
 * self-contained: each node's stored id *is* its content commitment, so re-deriving the id from the
 * node's current content and comparing to the stored key surfaces any byte-level tamper — no
 * committed packet/root is needed. Then the constitutional human-authority invariant is checked.
 * Real WASI sandboxing and signature checks remain deferred (§19.2 D1/D6).
 */
export class DeterministicStubVerifier implements Verifier {
  async verify(graph: EvidenceGraph, hasher: Hasher): Promise<VerificationResult> {
    const reasons: string[] = [];

    for (const [storedId, node] of Object.entries(graph.nodes)) {
      if (recomputeId(node, hasher) !== storedId) {
        addReason(reasons, CONTENT_HASH_MISMATCH);
      }
    }

    const authority = assertHumanAuthority(graph);
    for (const reason of authority.reasons) {
      addReason(reasons, reason);
    }

    return { ok: reasons.length === 0, reasons };
  }
}
