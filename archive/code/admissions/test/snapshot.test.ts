import { describe, expect, expectTypeOf, it } from "vitest";

import { SYNTHETIC_ROUTING_POLICY_V1 } from "../../admissions-contracts/src/routing.js";
import {
  SYNTHETIC_ARTIFACT_FIXTURES,
  SYNTHETIC_NARRATIVE_FIXTURES,
} from "../../admissions-contracts/src/snapshot.js";
import { createCogatAssessmentVersion, routeCogatAssessment } from "../src/routing.js";
import {
  type SubmitArtifactTalentSnapshotInput,
  type SubmitTalentSnapshotInput,
  type TalentSnapshotVersion,
  chooseTalentSnapshotRoute,
  submitTalentSnapshot,
} from "../src/snapshot.js";

function invitedRoutingDecision() {
  return routeCogatAssessment({
    assessment: createCogatAssessmentVersion({
      versionId: "assessment-syn-snapshot:v1",
      version: 1,
      supersedes: null,
      validity: "valid",
      locked: true,
      scores: { composite: 85, verbal: 70, quantitative: 79, nonverbal: 75 },
    }),
    policy: SYNTHETIC_ROUTING_POLICY_V1,
    trackBEnabled: true,
  });
}

function outsideRoutingDecision() {
  return routeCogatAssessment({
    assessment: createCogatAssessmentVersion({
      versionId: "assessment-syn-outside-snapshot:v1",
      version: 1,
      supersedes: null,
      validity: "valid",
      locked: true,
      scores: { composite: 70, verbal: 70, quantitative: 70, nonverbal: 70 },
    }),
    policy: SYNTHETIC_ROUTING_POLICY_V1,
    trackBEnabled: true,
  });
}

describe("Track B Talent Snapshot route choice", () => {
  it("routes a family without an existing artifact to narrative with no penalty", () => {
    expect(chooseTalentSnapshotRoute(false)).toEqual({
      route: "narrative",
      automaticScoreAdjustment: 0,
    });
  });
});

describe("Track B Talent Snapshot submission", () => {
  it("submits one or two allowlisted artifacts for an invited applicant", () => {
    const routingDecision = invitedRoutingDecision();
    const snapshot = submitTalentSnapshot({
      snapshotId: "snapshot-synthetic-artifact-001",
      version: 1,
      supersedes: null,
      routingDecision,
      domains: ["engineering"],
      route: "artifact",
      artifactFixtureIds: ["artifact-syn-robotics-001"],
    });

    expect(snapshot).toMatchObject({
      snapshotId: "snapshot-synthetic-artifact-001",
      versionId: "snapshot-synthetic-artifact-001:v1",
      version: 1,
      supersedes: null,
      contractVersion: "TS-SYN-01",
      locked: true,
      workflowStatus: "snapshot_under_review",
      routingResultHash: routingDecision.resultHash,
      route: "artifact",
      automaticScoreAdjustment: 0,
      domains: ["engineering"],
      evidence: {
        artifactFixtures: [SYNTHETIC_ARTIFACT_FIXTURES[0]],
      },
      contentHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
  });

  it("submits the bounded narrative fallback on the same zero-adjustment basis", () => {
    const routingDecision = invitedRoutingDecision();
    const snapshot = submitTalentSnapshot({
      snapshotId: "snapshot-synthetic-narrative-001",
      version: 1,
      supersedes: null,
      routingDecision,
      domains: ["mathematics"],
      route: "narrative",
      narrativeFixtureId: "narrative-syn-patterns-001",
    });

    expect(snapshot).toMatchObject({
      route: "narrative",
      automaticScoreAdjustment: 0,
      domains: ["mathematics"],
      evidence: {
        narrativeFixture: SYNTHETIC_NARRATIVE_FIXTURES[0],
      },
      workflowStatus: "snapshot_under_review",
      routingResultHash: routingDecision.resultHash,
      contentHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
  });

  it("rejects a Snapshot when the retained routing decision did not invite Track B", () => {
    expect(() =>
      submitTalentSnapshot({
        snapshotId: "snapshot-synthetic-not-invited-001",
        version: 1,
        supersedes: null,
        routingDecision: outsideRoutingDecision(),
        domains: ["engineering"],
        route: "artifact",
        artifactFixtureIds: ["artifact-syn-robotics-001"],
      }),
    ).toThrowError(
      expect.objectContaining({
        name: "TalentSnapshotSubmissionError",
        code: "NOT_INVITED",
      }),
    );
  });

  it.each([
    {
      label: "no domains",
      domains: [],
      fixtureIds: ["artifact-syn-robotics-001"],
      code: "VALIDATION_FAILED",
    },
    {
      label: "more than two domains",
      domains: ["engineering", "writing", "music"],
      fixtureIds: ["artifact-syn-robotics-001"],
      code: "VALIDATION_FAILED",
    },
    {
      label: "duplicate domains",
      domains: ["engineering", "engineering"],
      fixtureIds: ["artifact-syn-robotics-001"],
      code: "VALIDATION_FAILED",
    },
    { label: "no artifacts", domains: ["engineering"], fixtureIds: [], code: "VALIDATION_FAILED" },
    {
      label: "more than two artifacts",
      domains: ["engineering", "writing"],
      fixtureIds: [
        "artifact-syn-robotics-001",
        "artifact-syn-writing-001",
        "artifact-syn-robotics-001",
      ],
      code: "VALIDATION_FAILED",
    },
    {
      label: "an artifact outside the selected domains",
      domains: ["writing"],
      fixtureIds: ["artifact-syn-robotics-001"],
      code: "VALIDATION_FAILED",
    },
    {
      label: "a non-allowlisted artifact",
      domains: ["engineering"],
      fixtureIds: ["artifact-not-allowlisted"],
      code: "FIXTURE_NOT_ALLOWLISTED",
    },
  ])("rejects bounded Snapshot input with $label", ({ domains, fixtureIds, code }) => {
    const input = {
      snapshotId: "snapshot-synthetic-invalid-001",
      version: 1,
      supersedes: null,
      routingDecision: invitedRoutingDecision(),
      domains,
      route: "artifact",
      artifactFixtureIds: fixtureIds,
    } as SubmitTalentSnapshotInput;

    expect(() => submitTalentSnapshot(input)).toThrowError(
      expect.objectContaining({ name: "TalentSnapshotSubmissionError", code }),
    );
  });

  it("snapshots only allowlisted capability fields into deeply immutable content", () => {
    type ProhibitedSnapshotKey = Extract<
      keyof SubmitTalentSnapshotInput | keyof TalentSnapshotVersion,
      | "upload"
      | "file"
      | "childName"
      | "dateOfBirth"
      | "householdIncome"
      | "householdSize"
      | "address"
      | "accommodationUsed"
      | "researchConsent"
    >;
    expectTypeOf<ProhibitedSnapshotKey>().toEqualTypeOf<never>();

    const domains: Array<"engineering"> = ["engineering"];
    const input: SubmitArtifactTalentSnapshotInput = {
      snapshotId: "snapshot-synthetic-firewall-001",
      version: 1,
      supersedes: null,
      routingDecision: invitedRoutingDecision(),
      domains,
      route: "artifact",
      artifactFixtureIds: ["artifact-syn-robotics-001"],
    };
    const enriched = {
      ...input,
      householdIncome: 12_345,
      householdSize: 9,
      accommodationUsed: true,
      researchConsent: false,
      upload: "synthetic-upload-must-not-enter-snapshot",
    } as SubmitArtifactTalentSnapshotInput;

    const result = submitTalentSnapshot(input);
    expect(() => submitTalentSnapshot(enriched)).toThrowError(
      expect.objectContaining({
        name: "TalentSnapshotSubmissionError",
        code: "NON_SYNTHETIC_INPUT",
      }),
    );
    domains[0] = "engineering";
    domains.push("engineering");

    expect(result.domains).toEqual(["engineering"]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.domains)).toBe(true);
    expect(Object.isFrozen(result.evidence)).toBe(true);
    if (result.route === "artifact") {
      expect(Object.isFrozen(result.evidence.artifactFixtures)).toBe(true);
      expect(Object.isFrozen(result.evidence.artifactFixtures[0]?.provenance)).toBe(true);
    }
  });
});
