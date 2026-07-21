import { describe, expect, it } from "vitest";

import { canonicalize } from "../src/canonicalize.js";
import { addNode } from "../src/graph.js";
import type { EvidenceGraph, EvidenceNode } from "../src/model.js";
import type { Hasher } from "../src/ports.js";
import { goldenArtifact } from "./fixtures/seed.js";

type EvidenceNodeContent = Omit<EvidenceNode, "id">;

class RecordingHasher implements Hasher {
  readonly inputs: Uint8Array[] = [];

  hash(input: Uint8Array): string {
    this.inputs.push(input.slice());
    return `fake:${new TextDecoder().decode(input)}`;
  }
}

function emptyGraph(): EvidenceGraph {
  return { nodes: {}, edges: [] };
}

describe("addNode", () => {
  it("uses the injected hasher over UTF-8 canonical content and stores the node by its digest", () => {
    const graph = emptyGraph();
    const hasher = new RecordingHasher();

    const result = addNode(graph, goldenArtifact, hasher);
    const canonicalContent = canonicalize(goldenArtifact);

    expect(hasher.inputs).toHaveLength(1);
    expect(hasher.inputs[0]).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(hasher.inputs[0])).toBe(canonicalContent);
    expect(result.id).toBe(`fake:${canonicalContent}`);
    expect(result.graph.nodes[result.id]).toEqual({ id: result.id, ...goldenArtifact });
    expect(result.graph).not.toBe(graph);
    expect(graph).toEqual(emptyGraph());
  });

  it("returns the existing id and graph unchanged when content is re-added", () => {
    const hasher = new RecordingHasher();
    const first = addNode(emptyGraph(), goldenArtifact, hasher);
    const before = structuredClone(first.graph);

    const second = addNode(first.graph, goldenArtifact, hasher);

    expect(second.id).toBe(first.id);
    expect(second.graph).toBe(first.graph);
    expect(second.graph).toEqual(before);
    expect(Object.keys(second.graph.nodes)).toHaveLength(1);
  });

  const changedFields = [
    ["type", { ...goldenArtifact, type: "Claim" }],
    ["actor", { ...goldenArtifact, actor: { kind: "human", ref: "learner-synthetic-002" } }],
    ["tool", { ...goldenArtifact, tool: { name: "gt100k-editor", version: "0.2.0" } }],
    ["inputs", { ...goldenArtifact, inputs: ["synthetic-input"] }],
    ["timestamp", { ...goldenArtifact, timestamp: "2026-01-01T00:00:00.001Z" }],
    ["consentScope", { ...goldenArtifact, consentScope: { scope: "synthetic-other" } }],
    ["payload", { ...goldenArtifact, payload: { title: "hello world changed" } }],
  ] as const satisfies ReadonlyArray<readonly [string, EvidenceNodeContent]>;

  it.each(changedFields)("returns a new id when the %s field changes", (_field, changedContent) => {
    const hasher = new RecordingHasher();
    const first = addNode(emptyGraph(), goldenArtifact, hasher);

    const changed = addNode(first.graph, changedContent, hasher);

    expect(changed.id).not.toBe(first.id);
    expect(Object.keys(changed.graph.nodes)).toHaveLength(2);
    expect(Object.keys(first.graph.nodes)).toHaveLength(1);
  });
});
