import { describe, expect, expectTypeOf, it } from "vitest";

import type { EvidenceNode } from "../src/model.js";
import {
  type EvidenceNodeContent,
  goldenArtifact,
  goldenAttempt,
  goldenLeaves,
  syntheticMilestone,
} from "./fixtures/seed.js";

describe("evidence-graph synthetic seed fixtures", () => {
  it("pins the G1 and G3 node content exactly", () => {
    expect(goldenArtifact).toEqual({
      type: "Artifact",
      actor: { kind: "human", ref: "learner-synthetic-001" },
      tool: { name: "gt100k-editor", version: "0.1.0" },
      inputs: [],
      timestamp: "2026-01-01T00:00:00.000Z",
      consentScope: { scope: "synthetic" },
      payload: { title: "hello world" },
    });
    expect(goldenAttempt).toEqual({
      type: "Attempt",
      actor: { kind: "system", ref: "runner-synthetic-001" },
      tool: { name: "gt100k-runner", version: "0.1.0" },
      inputs: [],
      timestamp: "2026-01-01T00:05:00.000Z",
      consentScope: { scope: "synthetic" },
      payload: { success: "true" },
    });
    expectTypeOf(goldenArtifact).toMatchTypeOf<Omit<EvidenceNode, "id">>();
    expectTypeOf(goldenAttempt).toMatchTypeOf<EvidenceNodeContent>();
  });

  it("pins the G2 SHA-256 leaf sources exactly", () => {
    expect(goldenLeaves).toEqual({
      ha: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      hb: "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
      hc: "2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6",
    });
  });

  it("defines a coherent milestone and one unrelated island using only synthetic actors", () => {
    expect(syntheticMilestone.nodes.map(({ content }) => content.type)).toEqual([
      "Artifact",
      "Transformation",
      "Attempt",
      "Assistance",
      "Review",
      "Contribution",
      "Outcome",
      "Claim",
    ]);
    expect(syntheticMilestone.milestoneNodeKeys).toEqual([
      "artifact",
      "transformation-plan",
      "attempt-run",
      "assistance-declared",
      "review-human",
      "contribution-learner",
      "outcome-grade",
    ]);
    expect(syntheticMilestone.outcomeKey).toBe("outcome-grade");
    expect(syntheticMilestone.islandKey).toBe("claim-unrelated-island");

    const nodeRelations = syntheticMilestone.edges
      .filter(({ to }) => syntheticMilestone.nodes.some(({ key }) => key === to))
      .map(({ type, from, to }) => [type, from, to]);
    expect(nodeRelations).toEqual([
      ["derived_from", "transformation-plan", "artifact"],
      ["derived_from", "attempt-run", "transformation-plan"],
      ["derived_from", "assistance-declared", "attempt-run"],
      ["validates", "review-human", "assistance-declared"],
      ["derived_from", "contribution-learner", "review-human"],
      ["released_as", "contribution-learner", "outcome-grade"],
    ]);
    expect(new Set(syntheticMilestone.edges.map(({ type }) => type))).toEqual(
      new Set(["derived_from", "authored_by", "used_tool", "validates", "released_as"]),
    );
    expect(
      syntheticMilestone.edges.some(
        ({ from, to }) =>
          from === syntheticMilestone.islandKey || to === syntheticMilestone.islandKey,
      ),
    ).toBe(false);

    const actorRefs = syntheticMilestone.nodes.map(({ content }) => content.actor.ref);
    expect(new Set(actorRefs)).toEqual(
      new Set([
        "learner-synthetic-001",
        "runner-synthetic-001",
        "reviewer-synthetic-001",
        "assistant-model-synthetic",
      ]),
    );
    expect(
      syntheticMilestone.nodes.every(({ content }) => content.consentScope.scope === "synthetic"),
    ).toBe(true);
    expect(syntheticMilestone.nodes.every(({ content }) => !("displayName" in content.actor))).toBe(
      true,
    );
  });
});
