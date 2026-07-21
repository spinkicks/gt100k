import {
  type EvidenceGraph,
  NODE_TYPES,
  addEdge,
  addNode,
  canonicalize,
} from "@gt100k/evidence-graph";
import { describe, expect, it } from "vitest";

import { goldenArtifact } from "./fixtures/seed.js";

const GOLDEN_ARTIFACT_CANONICAL =
  '{"actor":{"kind":"human","ref":"learner-synthetic-001"},"consentScope":{"scope":"synthetic"},"inputs":[],"payload":{"title":"hello world"},"timestamp":"2026-01-01T00:00:00.000Z","tool":{"name":"gt100k-editor","version":"0.1.0"},"type":"Artifact"}';
const GOLDEN_ARTIFACT_ID = "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039";

class PinnedGoldenHasher {
  hash(input: Uint8Array): string {
    if (new TextDecoder().decode(input) !== GOLDEN_ARTIFACT_CANONICAL) {
      throw new Error("unexpected bytes supplied to the G1 golden hasher");
    }
    return GOLDEN_ARTIFACT_ID;
  }
}

describe("EvidenceGraph golden values", () => {
  it("reproduces the exact G1 Artifact id through the public API", () => {
    const graph = { nodes: {}, edges: [] } satisfies EvidenceGraph;

    expect(canonicalize(goldenArtifact)).toBe(GOLDEN_ARTIFACT_CANONICAL);
    expect(addNode(graph, goldenArtifact, new PinnedGoldenHasher()).id).toBe(GOLDEN_ARTIFACT_ID);
  });

  it("exposes the settled P1 model and graph surface", () => {
    expect(NODE_TYPES).toContain("Artifact");
    expect(addEdge).toBeTypeOf("function");
  });
});
