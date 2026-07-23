/**
 * Verification view + light-wave order (§U8.8, User Story UX3).
 *
 * Reads the `@gt100k/evidence-graph` domain and produces a deterministic `VerificationView`: an
 * ordered `steps[]` whose pass/fail is derived from the domain (re-derived Merkle root,
 * subject-digest binding, `assertHumanAuthority`, and the clearly-labeled non-production
 * transparency-log stub), a `sealState`, and the deterministic `verifyWaveOrder` the light-wave
 * animates. **This module computes no grade and no crypto of its own** — it re-uses the domain's
 * content-addressing (`addNode`) and RFC-6962 `merkleRoot` to re-derive hashes from the *current*
 * graph content, so a byte-level tamper surfaces as a Merkle mismatch even though the committed
 * packet is unchanged.
 */
import {
  type EvidenceGraph,
  type VerificationResult,
  addNode,
  assertHumanAuthority,
  buildGraphAttestation,
  graphMerkleRoot,
  merkleRoot,
  orderedGraphNodeIds,
} from "@gt100k/evidence-graph";
// `Hasher` is a port, not re-exported from the domain index — import it directly (repo convention).
import type { Hasher } from "../../evidence-graph/src/ports.js";
import type { FixtureBundle } from "./fixtures/explorer.fixture.js";
import type { SealState, VerificationView, VerifyStep } from "./model.js";
import { provenanceRanks } from "./ranks.js";

const EMPTY_GRAPH: EvidenceGraph = { nodes: {}, edges: [] };

/** Re-derives a node's content-addressed hash from its *current* payload (via the domain). */
function recomputeNodeHash(graph: EvidenceGraph, id: string, hasher: Hasher): string {
  const node = graph.nodes[id];
  if (node === undefined) {
    return ""; // missing node → invalid digest → merkle mismatch below.
  }
  const { id: _committed, ...content } = node;
  return addNode(EMPTY_GRAPH, content, hasher).id;
}

/**
 * Deterministic edge order the verify light-wave animates: node→node edges sorted by
 * `(min(depthRank(from), depthRank(to)) asc, from insertion, to insertion)` — a stable
 * source→outcome propagation (§U8.8). Actor/tool-ref edges are excluded (they touch no body).
 */
export function verifyWaveOrder(
  graph: EvidenceGraph,
): ReadonlyArray<{ readonly from: string; readonly to: string }> {
  const insertion = new Map<string, number>();
  Object.keys(graph.nodes).forEach((id, index) => insertion.set(id, index));

  const rankOf = new Map<string, number>();
  for (const rank of provenanceRanks(graph)) {
    rankOf.set(rank.node.id, rank.depthRank);
  }

  const nodeEdges = graph.edges.filter(
    (edge) => graph.nodes[edge.from] !== undefined && graph.nodes[edge.to] !== undefined,
  );

  const minRank = (from: string, to: string): number =>
    Math.min(rankOf.get(from) ?? 0, rankOf.get(to) ?? 0);
  const order = (id: string): number => insertion.get(id) ?? 0;

  return [...nodeEdges]
    .sort((a, b) => {
      const byRank = minRank(a.from, a.to) - minRank(b.from, b.to);
      if (byRank !== 0) {
        return byRank;
      }
      const byFrom = order(a.from) - order(b.from);
      if (byFrom !== 0) {
        return byFrom;
      }
      return order(a.to) - order(b.to);
    })
    .map((edge) => ({ from: edge.from, to: edge.to }));
}

export interface BuildVerificationViewOptions {
  /** Content id of the released-artifact node the graph attests to. */
  readonly subjectDigest: string;
}

/**
 * Builds the verification view for a whole project graph (one graph per project) against its
 * *current* content and a (pre-awaited) verifier result. Ordered steps (§U8.8): `merkle-root` →
 * `subject-digest` → `human-authority` → `transparency-log-stub`. `sealState` = `"verified"` iff
 * all non-stub steps pass, else `"mismatch"` (the only place red appears). `"unverified"` is the
 * app's pre-Verify state and is never produced here.
 *
 * The committed root is the whole-graph `graphMerkleRoot` over the stored ids; the recomputed root
 * is the same timestamp-ordered leaves re-derived from each node's *current* content, so a
 * byte-level tamper flips one leaf and the two roots diverge.
 */
export function buildVerificationView(
  graph: EvidenceGraph,
  verifierResult: VerificationResult,
  hasher: Hasher,
  opts: BuildVerificationViewOptions,
): VerificationView {
  let committedRoot = "";
  let recomputedRoot = "";
  try {
    committedRoot = graphMerkleRoot(graph, hasher); // leaves = stored ids, timestamp-ordered.
    const orderedIds = orderedGraphNodeIds(graph);
    recomputedRoot = merkleRoot(
      orderedIds.map((id) => recomputeNodeHash(graph, id, hasher)),
      hasher,
    );
  } catch {
    recomputedRoot = ""; // invalid digest (missing/tampered) → mismatch.
  }
  const merkleStep: VerifyStep = {
    id: "merkle-root",
    label: "Merkle root re-derivation",
    status: recomputedRoot !== "" && recomputedRoot === committedRoot ? "pass" : "fail",
    detail: { committed: committedRoot, recomputed: recomputedRoot },
  };

  const attestation = buildGraphAttestation(
    graph,
    { projectRef: "speaker-v1", subjectDigest: opts.subjectDigest },
    hasher,
  );
  const attested = attestation.subject[0]?.digest.sha256 ?? null;
  const subjectStep: VerifyStep = {
    id: "subject-digest",
    label: "Subject digest binding",
    status:
      attested === opts.subjectDigest && graph.nodes[opts.subjectDigest] !== undefined
        ? "pass"
        : "fail",
    detail: { committed: opts.subjectDigest, attested },
  };

  const authority = assertHumanAuthority(graph);
  const authorityStep: VerifyStep = {
    id: "human-authority",
    label: "Human-owned final grade",
    status: authority.ok ? "pass" : "fail",
    detail: { ok: authority.ok, reasons: authority.reasons },
  };

  const stubStep: VerifyStep = {
    id: "transparency-log-stub",
    label: "Transparency-log inclusion (pre-live gate, stub)",
    status: "stub",
    nonProduction: true,
    detail: {
      note: "Deferred D1 seam — deterministic placeholder; never blocks the seal.",
      verifierOk: verifierResult.ok,
    },
  };

  const steps: readonly VerifyStep[] = [merkleStep, subjectStep, authorityStep, stubStep];
  const nonStubPass = [merkleStep, subjectStep, authorityStep].every((s) => s.status === "pass");
  const sealState: SealState = nonStubPass ? "verified" : "mismatch";

  return { steps, sealState, verifyWaveOrder: verifyWaveOrder(graph) };
}

/**
 * Deterministically tamper the released byte-body's payload. The stored node id (the committed
 * commitment) is unchanged, so the mismatch surfaces only at verify time when node hashes are
 * re-derived from content (§U8.8). The tamper touches a byte-level Artifact — never a person,
 * Outcome, or Assistance (SC-E09).
 */
export function applyTamper(bundle: FixtureBundle): FixtureBundle {
  const targetId = bundle.ids["released-artifact"];
  const target = bundle.graph.nodes[targetId];
  const tamperedNodes = { ...bundle.graph.nodes };
  if (target !== undefined) {
    tamperedNodes[targetId] = {
      ...target,
      payload: { ...target.payload, title: "Tampered released artifact", tampered: true },
    };
  }
  return {
    ...bundle,
    graph: { nodes: tamperedNodes, edges: bundle.graph.edges },
  };
}
