// SC-3 + SC-4 golden test: `toEvidence` maps EVERY work-event onto a VALID CLOSED EvidenceGraph
// NodeType with the §4.3 edges, the graph passes the package verifier, and an identical project
// yields an identical graph (deterministic stub hasher, no network). This is the loop's proof that
// the mapping is real — it runs the evidence-graph verifier over the built graph.
import {
  EDGE_TYPES,
  NODE_TYPES,
  assertHumanAuthority,
} from "@gt100k/evidence-graph";
import type {
  EdgeType,
  EvidenceGraph,
  EvidenceNode,
  NodeType,
} from "@gt100k/evidence-graph";
import { describe, expect, it } from "vitest";

import { makeFixtureProject } from "../src/__fixtures__/project.js";
import { hasPerseverance } from "../src/project.js";
import { stubEvidenceSink, stubHasher } from "../src/sink.js";
import { toEvidence } from "../src/to-evidence.js";

const NODE_TYPE_SET = new Set<string>(NODE_TYPES);
const EDGE_TYPE_SET = new Set<string>(EDGE_TYPES);

/** Mirror of `@gt100k/evidence-graph` `addEdge` target resolution: node id | actor.ref | tool.name. */
function edgeTargetResolves(graph: EvidenceGraph, to: string, type: EdgeType): boolean {
  if (graph.nodes[to] !== undefined) {
    return true;
  }
  const nodes = Object.values(graph.nodes);
  if (type === "authored_by") {
    return nodes.some((node) => node.actor.ref === to);
  }
  if (type === "used_tool") {
    return nodes.some((node) => node.tool?.name === to);
  }
  return false;
}

/** Find the single node built from a given source work-event kind. */
function nodesOfKind(graph: EvidenceGraph, kind: string): EvidenceNode[] {
  return Object.values(graph.nodes).filter((node) => node.payload.kind === kind);
}

describe("toEvidence (§4.3 closed-taxonomy mapping)", () => {
  it("maps every event to a valid closed NodeType and resolvable edges (SC-3)", () => {
    const project = makeFixtureProject();
    const graph = toEvidence(project, stubHasher);

    // One node per event — no accidental content-address collisions.
    expect(Object.keys(graph.nodes)).toHaveLength(project.events.length);

    for (const node of Object.values(graph.nodes)) {
      expect(NODE_TYPE_SET.has(node.type)).toBe(true);
    }
    for (const edge of graph.edges) {
      expect(EDGE_TYPE_SET.has(edge.type)).toBe(true);
      expect(graph.nodes[edge.from]).toBeDefined();
      expect(edgeTargetResolves(graph, edge.to, edge.type)).toBe(true);
    }
  });

  it("passes the evidence-graph human-authority verifier (SC-3)", () => {
    const graph = toEvidence(makeFixtureProject(), stubHasher);
    const result = assertHumanAuthority(graph);
    expect(result.reasons).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("assigns each kid entry its §4.3 NodeType and actor.kind", () => {
    const graph = toEvidence(makeFixtureProject(), stubHasher);
    const expected: Record<string, { type: NodeType; actorKind: string }> = {
      session: { type: "Contribution", actorKind: "human" },
      attempt: { type: "Attempt", actorKind: "human" },
      outcome: { type: "Outcome", actorKind: "human" },
      revision: { type: "Transformation", actorKind: "human" },
      artifact: { type: "Artifact", actorKind: "human" },
      decision: { type: "Claim", actorKind: "human" },
      reflection: { type: "Claim", actorKind: "human" },
      ai_help: { type: "Assistance", actorKind: "model" },
      milestone: { type: "Outcome", actorKind: "human" },
      showcase: { type: "Review", actorKind: "system" },
    };
    for (const [kind, want] of Object.entries(expected)) {
      const matches = nodesOfKind(graph, kind);
      expect(matches).toHaveLength(1);
      const node = matches[0];
      expect(node).toBeDefined();
      if (node === undefined) {
        continue;
      }
      expect(node.type).toBe(want.type);
      expect(node.actor.kind).toBe(want.actorKind);
    }
  });

  it("records declared AI help as a NEUTRAL Assistance node with used_tool (SC-6)", () => {
    const graph = toEvidence(makeFixtureProject(), stubHasher);
    const [assistance] = nodesOfKind(graph, "ai_help");
    expect(assistance).toBeDefined();
    if (assistance === undefined) {
      return;
    }
    expect(assistance.type).toBe("Assistance");
    expect(assistance.actor.kind).toBe("model");
    expect(assistance.tool?.name).toBe("studybot");
    const usedTool = graph.edges.filter(
      (edge) => edge.type === "used_tool" && edge.from === assistance.id,
    );
    expect(usedTool).toHaveLength(1);
    expect(usedTool[0]?.to).toBe("studybot");
    // Neutral: nothing marks the assistance as negative/penalized.
    expect(JSON.stringify(assistance.payload)).not.toMatch(/penal|negativ|deduct|flag/i);
  });

  it("records the perseverance chain as Outcome(contradicts) → Transformation → Artifact (§4.2)", () => {
    const project = makeFixtureProject();
    expect(hasPerseverance(project)).toBe(true);

    const graph = toEvidence(project, stubHasher);
    const [stuckOutcome] = nodesOfKind(graph, "outcome");
    const [revision] = nodesOfKind(graph, "revision");
    const [artifact] = nodesOfKind(graph, "artifact");
    expect(stuckOutcome).toBeDefined();
    expect(revision).toBeDefined();
    expect(artifact).toBeDefined();
    if (stuckOutcome === undefined || revision === undefined || artifact === undefined) {
      return;
    }

    // Stuck outcome CONTRADICTS its attempt.
    expect(stuckOutcome.payload.stuck).toBe(true);
    expect(
      graph.edges.some((edge) => edge.type === "contradicts" && edge.from === stuckOutcome.id),
    ).toBe(true);
    // Revision (Transformation) derived_from the stuck outcome.
    expect(
      graph.edges.some(
        (edge) =>
          edge.type === "derived_from" && edge.from === revision.id && edge.to === stuckOutcome.id,
      ),
    ).toBe(true);
    // Artifact authored_by the child + derived_from the revision.
    expect(graph.edges.some((edge) => edge.type === "authored_by" && edge.from === artifact.id)).toBe(
      true,
    );
    expect(
      graph.edges.some(
        (edge) => edge.type === "derived_from" && edge.from === artifact.id && edge.to === revision.id,
      ),
    ).toBe(true);
  });

  it("releases the showcase from its artifact (released_as + validates)", () => {
    const graph = toEvidence(makeFixtureProject(), stubHasher);
    const [showcase] = nodesOfKind(graph, "showcase");
    const [artifact] = nodesOfKind(graph, "artifact");
    expect(showcase).toBeDefined();
    expect(artifact).toBeDefined();
    if (showcase === undefined || artifact === undefined) {
      return;
    }
    expect(showcase.type).toBe("Review");
    expect(
      graph.edges.some(
        (edge) => edge.type === "released_as" && edge.from === artifact.id && edge.to === showcase.id,
      ),
    ).toBe(true);
    expect(
      graph.edges.some(
        (edge) => edge.type === "validates" && edge.from === artifact.id && edge.to === showcase.id,
      ),
    ).toBe(true);
  });

  it("is deterministic: identical project → identical graph (SC-4)", () => {
    const first = toEvidence(makeFixtureProject(), stubHasher);
    const second = toEvidence(makeFixtureProject(), stubHasher);
    expect(second).toEqual(first);
    // The stub sink is the same fold through the deterministic hasher.
    expect(stubEvidenceSink.record(makeFixtureProject())).toEqual(first);
    // Content-only ids: stable hex, no clock/random leakage.
    expect(stubHasher.hash(new TextEncoder().encode("abc"))).toBe(
      stubHasher.hash(new TextEncoder().encode("abc")),
    );
  });
});
