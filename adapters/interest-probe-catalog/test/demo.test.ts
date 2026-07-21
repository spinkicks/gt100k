import { describe, expect, it } from "vitest";
import { buildInterestLabDemoReport, renderInterestLabDemoReport } from "../src/demo-report";

describe("Interest Lab synthetic demo", () => {
  it("reports the golden Lab, G4 signals, and proposal-versus-authorship boundary", () => {
    const report = buildInterestLabDemoReport();

    expect(report.lab).toEqual({
      learnerRef: "synthetic-learner-001",
      offerCount: 20,
      selectedProbeIds: Array.from(
        { length: 20 },
        (_, index) => `p${String(index + 1).padStart(2, "0")}`,
      ),
    });
    expect(report.coverage).toEqual({
      probeCount: { met: true, count: 20, need: 18 },
      domains: {
        met: true,
        count: 8,
        need: 6,
        have: [
          "making",
          "living_systems",
          "symbols_math",
          "word_craft",
          "sound_music",
          "movement_body",
          "visual_design",
          "social_world",
        ],
        gaps: [],
      },
      workModes: {
        met: true,
        count: 9,
        need: 6,
        have: [
          "build",
          "investigate",
          "compose",
          "explain",
          "perform",
          "debug",
          "collaborate",
          "care",
          "persuade",
        ],
        gaps: [],
      },
      social: { met: true, solo: true, group: true, gaps: [] },
      difficulty: { met: true, foundational: true, stretch: true, gaps: [] },
      audience: { met: true, audience: true, no_audience: true, gaps: [] },
      complete: true,
      gaps: [],
    });
    expect(report.signals).toEqual({
      voluntaryReturn: { day7: 1, day30: 1 },
      unrequiredRevision: 1,
      chosenChallenge: 1,
      failureRecovery: 1,
      scopeAuthorship: 1,
      competenceGrowth: 1,
      noveltyDecay: 0,
      promptDependence: 1,
      contextEffects: ["reminder"],
      familiesPresent: [
        "voluntary_return",
        "unrequired_revision",
        "chosen_challenge",
        "failure_recovery",
        "self_authored_scope",
        "artifact_competence",
      ],
    });
    expect(report.transition).toEqual({
      proposed: {
        state: "CANDIDATE_SPINE",
        version: 1,
        proposedBy: "SHADOW_MODEL",
        operative: false,
        guideReview: null,
      },
      authored: {
        state: "CANDIDATE_SPINE",
        version: 2,
        proposedBy: "SHADOW_MODEL",
        operative: true,
        guideReview: {
          guide: "synthetic-guide-001",
          decision: "author candidate transition",
          rationale: "golden evidence passes the candidate gate",
          reviewedAtDayOffset: 31,
        },
      },
    });
  });

  it("renders the report as stable, printable JSON", () => {
    const report = buildInterestLabDemoReport();

    expect(renderInterestLabDemoReport(report)).toBe(JSON.stringify(report, null, 2));
  });
});
