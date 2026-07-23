/**
 * Server-side synthetic view builder. Builds the committed "speaker-v1" `ExplorerView` through the
 * real domain API + Node SHA-256 hasher, then hands the plain (serializable) view to the client.
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
  buildFixtureGraph,
  buildVerificationView,
  explorerFixture,
} from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";

/** Build the deterministic Provenance Observatory view for the synthetic milestone. */
export function buildSyntheticExplorerView(opts: BuildExplorerViewOptions = {}): ExplorerView {
  const bundle = buildFixtureGraph(new NodeCryptoHasher());
  return buildExplorerView(bundle.graph, bundle, opts);
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

/** Derive the untampered + tampered verification views for the synthetic milestone (server-only). */
export async function buildSyntheticVerification(): Promise<SyntheticVerification> {
  const hasher = new NodeCryptoHasher();
  const fixture = await explorerFixture(hasher);
  const verified = buildVerificationView(fixture.graph, fixture.verifierResult, hasher, {
    subjectDigest: fixture.subjectDigest,
  });
  const tamperedBundle = applyTamper(fixture);
  const tampered = buildVerificationView(tamperedBundle.graph, fixture.verifierResult, hasher, {
    subjectDigest: tamperedBundle.subjectDigest,
  });
  return { verified, tampered, tamperNodeId: fixture.ids["released-artifact"] };
}
