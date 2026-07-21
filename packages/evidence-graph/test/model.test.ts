import { describe, expect, expectTypeOf, it } from "vitest";

import {
  ACTOR_KINDS,
  type ActorKind,
  type ActorRef,
  type Attestation,
  type ConsentScope,
  EDGE_TYPES,
  EDGE_TYPE_PROV_RELATION,
  type EdgeType,
  type EvidenceEdge,
  type EvidenceGraph,
  type EvidenceNode,
  type EvidencePacket,
  NODE_TYPES,
  NODE_TYPE_PROV_BASE,
  type NodeType,
  type ToolRef,
  type VerificationResult,
} from "../src/model.js";

describe("EvidenceGraph domain model", () => {
  it("defines the complete node taxonomy and its PROV bases", () => {
    expect(NODE_TYPES).toEqual([
      "Artifact",
      "Attempt",
      "Transformation",
      "Claim",
      "Assistance",
      "Review",
      "Contribution",
      "Outcome",
    ]);
    expect(NODE_TYPE_PROV_BASE).toEqual({
      Artifact: "Entity",
      Attempt: "Activity",
      Transformation: "Activity",
      Claim: "Entity",
      Assistance: "Activity",
      Review: "Activity",
      Contribution: "Activity (Association)",
      Outcome: "Entity",
    });
    expectTypeOf<NodeType>().toEqualTypeOf<(typeof NODE_TYPES)[number]>();
  });

  it("defines the complete edge taxonomy and its PROV relations", () => {
    expect(EDGE_TYPES).toEqual([
      "derived_from",
      "authored_by",
      "used_tool",
      "validates",
      "contradicts",
      "released_as",
    ]);
    expect(EDGE_TYPE_PROV_RELATION).toEqual({
      derived_from: "wasDerivedFrom",
      authored_by: "wasAttributedTo / wasAssociatedWith",
      used_tool: "used",
      validates: "wasInfluencedBy (+)",
      contradicts: "wasInfluencedBy (−)",
      released_as: "wasDerivedFrom / specializationOf",
    });
    expectTypeOf<EdgeType>().toEqualTypeOf<(typeof EDGE_TYPES)[number]>();
  });

  it("defines all actor kinds", () => {
    expect(ACTOR_KINDS).toEqual(["human", "model", "tool", "system"]);
    expectTypeOf<ActorKind>().toEqualTypeOf<(typeof ACTOR_KINDS)[number]>();
  });

  it("types nodes, edges, graphs, packets, attestations, and verification results", () => {
    const actor = {
      kind: "human",
      ref: "actor-reviewer-1",
      displayName: "Synthetic Reviewer",
    } satisfies ActorRef;
    const tool = { name: "synthetic-runner", version: "1.0.0" } satisfies ToolRef;
    const consentScope = {
      scope: "synthetic-evaluation",
      purpose: "contract-test",
    } satisfies ConsentScope;
    const node = {
      id: "node-1",
      type: "Artifact",
      actor,
      tool,
      inputs: [],
      timestamp: "2026-07-20T00:00:00.000Z",
      consentScope,
      payload: { format: "text/plain" },
    } satisfies EvidenceNode;
    const edge = {
      type: "derived_from",
      from: "node-1",
      to: "node-0",
      label: "synthetic lineage",
    } satisfies EvidenceEdge;
    const graph = {
      nodes: { [node.id]: node },
      edges: [edge],
    } satisfies EvidenceGraph;
    const attestation = {
      _type: "https://in-toto.io/Statement/v1",
      predicateType: "https://gt100k.dev/attestations/evidence/v1",
      subject: [{ name: "artifact-1", digest: { sha256: "subject-digest" } }],
      predicate: {
        builder: { id: "gt100k-evidence-graph" },
        materials: [{ uri: "node:node-1", digest: { sha256: "node-1" } }],
        merkleRoot: "merkle-root",
        milestoneRef: "milestone-1",
      },
    } satisfies Attestation;
    const packet = {
      milestoneRef: "milestone-1",
      subjectDigest: "subject-digest",
      nodeIds: [node.id],
      merkleRoot: "merkle-root",
      artifactHashes: [node.id],
      failedBranches: [],
      assistanceLedger: [],
      contributionMap: { [actor.ref]: [] },
      reviewAnchors: [],
      outcomes: [],
      attestation,
    } satisfies EvidencePacket;
    const result = { ok: true, reasons: [] } satisfies VerificationResult;

    expect(graph.nodes[node.id]).toBe(node);
    expect(packet.attestation).toBe(attestation);
    expect(result).toEqual({ ok: true, reasons: [] });
    expectTypeOf(node).toMatchTypeOf<EvidenceNode>();
    expectTypeOf(edge).toMatchTypeOf<EvidenceEdge>();
    expectTypeOf(graph).toMatchTypeOf<EvidenceGraph>();
    expectTypeOf(packet).toMatchTypeOf<EvidencePacket>();
  });
});
