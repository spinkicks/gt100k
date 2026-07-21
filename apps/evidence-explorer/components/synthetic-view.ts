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
  buildExplorerView,
  buildFixtureGraph,
} from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";

/** Build the deterministic Provenance Observatory view for the synthetic milestone. */
export function buildSyntheticExplorerView(opts: BuildExplorerViewOptions = {}): ExplorerView {
  const { graph, packet } = buildFixtureGraph(new NodeCryptoHasher());
  return buildExplorerView(graph, packet, opts);
}
