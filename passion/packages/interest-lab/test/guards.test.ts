import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_PURPOSES,
  PurposeGuardDeniedError,
  TeamArtifactProofRequiredError,
  acceptArtifactSignal,
  guardRead,
  promoteTeamArtifact,
} from "../src/index";
import type { SoloProof, TeamArtifactEvidence } from "../src/index";

describe("purpose guard", () => {
  it.each(FORBIDDEN_PURPOSES)("denies and exposes an audit record for %s (SC-008)", (purpose) => {
    let denial: unknown;

    try {
      guardRead(purpose);
    } catch (error) {
      denial = error;
    }

    expect(denial).toBeInstanceOf(PurposeGuardDeniedError);
    expect(denial).toMatchObject({
      code: "PURPOSE_DENIED",
      purpose,
      audit: {
        decision: "DENY",
        purpose,
        reasonCode: "FORBIDDEN_PURPOSE",
      },
    });
    expect((denial as Error).message).toContain(purpose);
  });
});

describe("team artifact guard", () => {
  const evidence: TeamArtifactEvidence = {
    artifactRef: "synthetic-team-artifact-001",
    learnerRef: "synthetic-learner-001",
    source: "TEAM",
  };

  it("refuses individual credit without solo proof (SC-012)", () => {
    expect(() => promoteTeamArtifact(evidence)).toThrow(TeamArtifactProofRequiredError);
  });

  it.each<SoloProof>([
    { kind: "EXPLANATION", evidenceRef: "synthetic-explanation-001" },
    { kind: "EXTENSION", evidenceRef: "synthetic-extension-001" },
    { kind: "TRACEABLE_CONTRIBUTION", evidenceRef: "synthetic-contribution-001" },
  ])("returns individual credit with $kind proof (SC-012)", (soloProof) => {
    expect(promoteTeamArtifact(evidence, soloProof)).toEqual({
      ...evidence,
      credit: "INDIVIDUAL",
      soloProof,
    });
    expect(evidence).toEqual({
      artifactRef: "synthetic-team-artifact-001",
      learnerRef: "synthetic-learner-001",
      source: "TEAM",
    });
  });
});

describe("artifact signal guard", () => {
  const coarseTransition = {
    artifactRef: "synthetic-artifact-001",
    learnerRef: "synthetic-learner-001",
    transition: "REVISED",
    dayOffset: 7,
  } as const;

  it.each([
    { screenRecording: "synthetic-screen-buffer" },
    { rawKeystrokes: ["synthetic-key"] },
    { fileContents: "synthetic-unrelated-content" },
  ])("rejects raw or unrelated content (PASS-007)", (rawField) => {
    expect(() => acceptArtifactSignal({ ...coarseTransition, ...rawField })).toThrow(
      "raw or unrelated artifact content is prohibited",
    );
  });

  it("accepts an exact coarse semantic transition (PASS-007)", () => {
    expect(acceptArtifactSignal(coarseTransition)).toEqual(coarseTransition);
  });
});
