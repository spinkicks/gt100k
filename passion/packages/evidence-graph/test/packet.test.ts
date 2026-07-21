import { describe, expect, it } from "vitest";

import type { EvidenceEdge, EvidenceGraph, EvidenceNode } from "../src/model.js";
import { assembleEvidencePacket, traceEvidence } from "../src/packet.js";
import type { Hasher } from "../src/ports.js";
import { goldenArtifact, goldenAttempt, syntheticMilestone } from "./fixtures/seed.js";

const GOLDEN_ARTIFACT_ID = "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039";
const GOLDEN_ATTEMPT_ID = "41168c66e8c868b8cf6e8eed82b49c17e32572143cbfdfe526e0f8a166a23f34";
const GOLDEN_PACKET_ROOT = "3c7f4d3c2a824ad9df7bbf211d8ebd3f1e2086ce2f5b0aea27f8bc994dea441c";
const ARTIFACT_LEAF = "e0ad5aecf4511137ca043fecd742e1bda2a2b4c206785f9ebd386a3bc45e41fc";
const ATTEMPT_LEAF = "eb267550c2e8fd1a6c80b36fbb02cc88f5caa06102728adb602bb01a3db54ba0";

function encodedHex(input: Uint8Array): string {
  return Array.from(input, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

class GoldenPacketHasher implements Hasher {
  readonly #digests: Readonly<Record<string, string>> = {
    [`00${GOLDEN_ARTIFACT_ID}`]: ARTIFACT_LEAF,
    [`00${GOLDEN_ATTEMPT_ID}`]: ATTEMPT_LEAF,
    [`01${ATTEMPT_LEAF}${ARTIFACT_LEAF}`]: GOLDEN_PACKET_ROOT,
  };

  hash(input: Uint8Array): string {
    const digest = this.#digests[encodedHex(input)];
    if (digest === undefined) {
      throw new Error(`unexpected G3 Merkle input: ${encodedHex(input)}`);
    }
    return digest;
  }
}

class ConstantHasher implements Hasher {
  hash(): string {
    return "0".repeat(64);
  }
}

function graph(nodes: EvidenceNode[], edges: EvidenceEdge[] = []): EvidenceGraph {
  return {
    nodes: Object.fromEntries(nodes.map((node) => [node.id, node])),
    edges,
  };
}

function node(idDigit: string, content: Omit<EvidenceNode, "id">): EvidenceNode {
  return { ...content, id: idDigit.repeat(64) };
}

function fixtureGraph(): { graph: EvidenceGraph; idsByKey: ReadonlyMap<string, string> } {
  const idsByKey = new Map(
    syntheticMilestone.nodes.map((item, index) => [
      item.key,
      (index + 1).toString(16).padStart(64, "0"),
    ]),
  );
  const nodes = syntheticMilestone.nodes.map((item) => ({
    ...item.content,
    id: idsByKey.get(item.key) as string,
  }));
  const edges = syntheticMilestone.edges.map((edge) => ({
    ...edge,
    from: idsByKey.get(edge.from) ?? edge.from,
    to: idsByKey.get(edge.to) ?? edge.to,
  }));

  return { graph: graph(nodes, edges), idsByKey };
}

describe("assembleEvidencePacket", () => {
  it("reproduces the exact G3 root and a deterministic packet for a fixed node set", () => {
    const artifact = { ...goldenArtifact, id: GOLDEN_ARTIFACT_ID };
    const attempt = { ...goldenAttempt, id: GOLDEN_ATTEMPT_ID };
    const evidence = graph([artifact, attempt]);
    const selection = {
      milestoneRef: syntheticMilestone.milestoneRef,
      subjectDigest: syntheticMilestone.subjectDigest,
      nodeIds: [GOLDEN_ARTIFACT_ID, GOLDEN_ATTEMPT_ID],
    };

    const first = assembleEvidencePacket(evidence, selection, new GoldenPacketHasher());
    const second = assembleEvidencePacket(
      evidence,
      { ...selection, nodeIds: [...selection.nodeIds].reverse() },
      new GoldenPacketHasher(),
    );

    expect(second).toEqual(first);
    expect(first).toEqual({
      milestoneRef: syntheticMilestone.milestoneRef,
      subjectDigest: syntheticMilestone.subjectDigest,
      nodeIds: [GOLDEN_ATTEMPT_ID, GOLDEN_ARTIFACT_ID],
      merkleRoot: GOLDEN_PACKET_ROOT,
      artifactHashes: [GOLDEN_ARTIFACT_ID],
      failedBranches: [],
      assistanceLedger: [],
      contributionMap: {},
      reviewAnchors: [],
      outcomes: [],
      attestation: {
        _type: "https://in-toto.io/Statement/v1",
        predicateType: "https://gt100k.dev/attestations/evidence/v1",
        subject: [{ name: "artifact", digest: { sha256: syntheticMilestone.subjectDigest } }],
        predicate: {
          builder: { id: "gt100k-evidence-graph" },
          materials: [
            {
              uri: `urn:gt100k:evidence:node:${GOLDEN_ARTIFACT_ID}`,
              digest: { sha256: GOLDEN_ARTIFACT_ID },
            },
          ],
          merkleRoot: GOLDEN_PACKET_ROOT,
          milestoneRef: syntheticMilestone.milestoneRef,
        },
      },
    });
  });

  it("derives each packet ledger from the selected nodes", () => {
    const artifact = node("1", goldenArtifact);
    const failedAttempt = node("2", {
      ...goldenAttempt,
      payload: { success: "false" },
    });
    const assistance = node("3", {
      ...goldenAttempt,
      type: "Assistance",
      actor: { kind: "model", ref: "assistant-model-synthetic" },
    });
    const contribution = node("4", {
      ...goldenAttempt,
      type: "Contribution",
      actor: { kind: "human", ref: "learner-synthetic-001" },
    });
    const review = node("5", {
      ...goldenAttempt,
      type: "Review",
      actor: { kind: "human", ref: "reviewer-synthetic-001" },
    });
    const outcome = node("6", {
      ...goldenAttempt,
      type: "Outcome",
      actor: { kind: "human", ref: "reviewer-synthetic-001" },
      payload: { kind: "grade", value: "meets" },
    });
    const evidence = graph(
      [outcome, review, contribution, assistance, failedAttempt, artifact],
      [{ type: "authored_by", from: outcome.id, to: outcome.actor.ref }],
    );

    const packet = assembleEvidencePacket(
      evidence,
      {
        milestoneRef: "milestone-ledgers",
        subjectDigest: syntheticMilestone.subjectDigest,
        nodeIds: Object.keys(evidence.nodes).reverse(),
      },
      new ConstantHasher(),
    );

    expect(packet.artifactHashes).toEqual([artifact.id]);
    expect(packet.failedBranches).toEqual([failedAttempt.id]);
    expect(packet.assistanceLedger).toEqual([assistance.id]);
    expect(packet.contributionMap).toEqual({ "learner-synthetic-001": [contribution.id] });
    expect(packet.reviewAnchors).toEqual([review.id]);
    expect(packet.outcomes).toEqual([outcome.id]);
  });

  it("rejects an empty or unresolved node selection", () => {
    expect(() =>
      assembleEvidencePacket(
        graph([]),
        {
          milestoneRef: "milestone-empty",
          subjectDigest: syntheticMilestone.subjectDigest,
          nodeIds: [],
        },
        new ConstantHasher(),
      ),
    ).toThrow("EMPTY_PACKET");

    expect(() =>
      assembleEvidencePacket(
        graph([]),
        {
          milestoneRef: "milestone-missing",
          subjectDigest: syntheticMilestone.subjectDigest,
          nodeIds: ["f".repeat(64)],
        },
        new ConstantHasher(),
      ),
    ).toThrow(`MISSING_NODE:${"f".repeat(64)}`);
  });

  it("refuses an invariant-invalid selected subgraph before hashing", () => {
    const modelOutcome = node("f", {
      ...goldenAttempt,
      type: "Outcome",
      actor: { kind: "model", ref: "assistant-model-synthetic" },
      payload: { kind: "grade", value: "meets" },
    });

    expect(() =>
      assembleEvidencePacket(
        graph(
          [modelOutcome],
          [{ type: "authored_by", from: modelOutcome.id, to: modelOutcome.actor.ref }],
        ),
        {
          milestoneRef: "milestone-invalid",
          subjectDigest: syntheticMilestone.subjectDigest,
          nodeIds: [modelOutcome.id],
        },
        {
          hash(): string {
            throw new Error("hashing must not run for an invalid subgraph");
          },
        },
      ),
    ).toThrow("INVARIANT_VIOLATION:MODEL_OWNED_GRADE,MODEL_AUTHORED_PROHIBITED_TYPE");
  });
});

describe("traceEvidence", () => {
  it("returns exactly the synthetic Outcome's connected support and excludes the island", () => {
    const fixture = fixtureGraph();
    const outcomeId = fixture.idsByKey.get(syntheticMilestone.outcomeKey) as string;
    const islandId = fixture.idsByKey.get(syntheticMilestone.islandKey) as string;
    const expected = syntheticMilestone.milestoneNodeKeys
      .filter((key) => key !== syntheticMilestone.outcomeKey)
      .map((key) => fixture.idsByKey.get(key) as string)
      .sort();

    const traced = traceEvidence(fixture.graph, outcomeId);

    expect(traced).toEqual(expected);
    expect(traced).not.toContain(outcomeId);
    expect(traced).not.toContain(islandId);
  });

  it("rejects an unresolved trace origin", () => {
    expect(() => traceEvidence(graph([]), "missing-node")).toThrow("MISSING_NODE:missing-node");
  });
});
