/**
 * Server-side synthetic view builder. Builds the committed "tiny-runner-v1" `ExplorerView` — a
 * student's "build a one-button endless runner" journey — through the real domain API + Node
 * SHA-256 hasher, then hands the plain (serializable) view to the client.
 *
 * IMPORTANT: this module reaches `@gt100k/evidence-hash-node` (`node:crypto`) and MUST only be
 * imported from a Server Component / test — never from a `"use client"` module.
 */
import {
  type BuildExplorerViewOptions,
  type ExplorerView,
  type VerificationView,
  applyTamper,
  buildExplorerView,
  buildVerificationView,
} from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { buildTinyGameGraph } from "@gt100k/evidence-tiny-game";
import { DeterministicStubVerifier } from "@gt100k/evidence-verifier-stub";

/** Build the deterministic Provenance Observatory view for the tiny-runner-v1 journey. */
export function buildSyntheticExplorerView(opts: BuildExplorerViewOptions = {}): ExplorerView {
  const hasher = new NodeCryptoHasher();
  const g = buildTinyGameGraph(hasher);
  const milestoneNodeIds = Object.keys(g.graph.nodes);
  return buildExplorerView(g.graph, { milestoneNodeIds, projectRef: g.projectId }, opts);
}

/**
 * The pre-computed, serializable verification for U3 (§U8.8). Both the honest and the tampered
 * `VerificationView` are derived **server-side** (Node SHA-256 hasher) so the client replays the
 * deterministic truth — no client-side crypto and no grade computed in the app. `tamperNodeId` is the
 * byte-level released Artifact that fractures (never a person, learner, `Outcome`, or `Assistance`).
 */
export interface SyntheticVerification {
  readonly verified: VerificationView;
  readonly tampered: VerificationView;
  readonly tamperNodeId: string;
}

/** Derive the untampered + tampered verification views for the tiny-runner-v1 journey (server-only). */
export async function buildSyntheticVerification(): Promise<SyntheticVerification> {
  const hasher = new NodeCryptoHasher();
  const g = buildTinyGameGraph(hasher);
  const bundle = {
    graph: g.graph,
    ids: g.ids,
    milestoneNodeIds: Object.keys(g.graph.nodes),
    subjectDigest: g.subjectDigest,
    projectRef: g.projectId,
  };
  const verifierResult = await new DeterministicStubVerifier().verify(g.graph, hasher);
  const verified = buildVerificationView(g.graph, verifierResult, hasher, {
    subjectDigest: g.subjectDigest,
  });
  const tamperedBundle = applyTamper(bundle);
  const tampered = buildVerificationView(tamperedBundle.graph, verifierResult, hasher, {
    subjectDigest: tamperedBundle.subjectDigest,
  });
  // `subjectDigest` is exactly `ids["released-artifact"]` (typed `string`, no unchecked index access).
  return { verified, tampered, tamperNodeId: g.subjectDigest };
}
