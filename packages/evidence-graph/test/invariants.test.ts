import { describe, expect, it } from "vitest";

import {
  type ActorKind,
  type EvidenceEdge,
  type EvidenceGraph,
  type EvidenceNode,
  type NodeType,
  assertHumanAuthority,
} from "../src/index.js";

function node(
  id: string,
  type: NodeType,
  actorKind: ActorKind,
  payload: Record<string, unknown>,
): EvidenceNode {
  return {
    id,
    type,
    actor: { kind: actorKind, ref: `${actorKind}-${id}` },
    inputs: [],
    timestamp: "2026-01-01T00:00:00.000Z",
    consentScope: { scope: "synthetic" },
    payload,
  };
}

function graph(nodes: EvidenceNode[], edges: EvidenceEdge[] = []): EvidenceGraph {
  return {
    nodes: Object.fromEntries(nodes.map((item) => [item.id, item])),
    edges,
  };
}

function authoredBy(item: EvidenceNode): EvidenceEdge {
  return { type: "authored_by", from: item.id, to: item.actor.ref };
}

describe("assertHumanAuthority", () => {
  it.each(["grade", "judgment"])("accepts a human-owned %s Outcome", (kind) => {
    const outcome = node("outcome", "Outcome", "human", { kind, value: "meets" });

    expect(assertHumanAuthority(graph([outcome], [authoredBy(outcome)]))).toEqual({
      ok: true,
      reasons: [],
    });
  });

  it("rejects a grade without a resolvable human owner", () => {
    const outcome = node("outcome", "Outcome", "human", { kind: "grade", value: "meets" });

    expect(assertHumanAuthority(graph([outcome]))).toEqual({
      ok: false,
      reasons: ["HUMAN_OWNER_REQUIRED"],
    });
  });

  it("rejects a model-owned grade with stable machine-readable reasons", () => {
    const outcome = node("outcome", "Outcome", "model", { kind: "grade", value: "meets" });

    const result = assertHumanAuthority(graph([outcome], [authoredBy(outcome)]));

    expect(result).toEqual({
      ok: false,
      reasons: ["MODEL_OWNED_GRADE", "MODEL_AUTHORED_PROHIBITED_TYPE"],
    });
    expect(result.reasons.every((reason) => /^[A-Z]+(?:_[A-Z]+)*$/.test(reason))).toBe(true);
  });

  it.each(["Assistance", "Review"] as const)("accepts a model-authored %s node", (type) => {
    const supportingEvidence = node(`model-${type}`, type, "model", {
      kind: type === "Assistance" ? "declared-assistance" : "review",
    });

    expect(
      assertHumanAuthority(graph([supportingEvidence], [authoredBy(supportingEvidence)])),
    ).toEqual({ ok: true, reasons: [] });
  });

  it("rejects model attribution on every node type except Assistance and Review", () => {
    const claim = node("claim", "Claim", "human", { kind: "claim" });
    const modelEvidence = node("assistance", "Assistance", "model", {
      kind: "declared-assistance",
    });

    const result = assertHumanAuthority(
      graph(
        [claim, modelEvidence],
        [{ type: "authored_by", from: claim.id, to: modelEvidence.actor.ref }],
      ),
    );

    expect(result).toEqual({ ok: false, reasons: ["MODEL_AUTHORED_PROHIBITED_TYPE"] });
  });

  it("rejects an explicit authorship-accusation claim kind anywhere in a payload", () => {
    const claim = node("claim", "Claim", "system", {
      claim: { kind: "authorshipAccusation", subjectRef: "learner-synthetic-001" },
    });

    expect(assertHumanAuthority(graph([claim]))).toEqual({
      ok: false,
      reasons: ["AUTHORSHIP_ACCUSATION"],
    });
  });

  it("rejects an edge explicitly labelled as an authorship accusation", () => {
    const claim = node("claim", "Claim", "human", { kind: "claim" });
    const artifact = node("artifact", "Artifact", "human", { title: "synthetic" });

    expect(
      assertHumanAuthority(
        graph(
          [claim, artifact],
          [
            {
              type: "contradicts",
              from: claim.id,
              to: artifact.id,
              label: "authorshipAccusation",
            },
          ],
        ),
      ),
    ).toEqual({ ok: false, reasons: ["AUTHORSHIP_ACCUSATION"] });
  });
});
