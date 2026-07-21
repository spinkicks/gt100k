import { describe, expect, it } from "vitest";
import type { SignalFamily, SignalSummary } from "../src/events";
import { summarizeSignals } from "../src/signals";
import { evaluateCandidateGate } from "../src/state-machine";
import { EVENTS_GOLDEN_V1 } from "./fixtures/events";

const summaryWithFamilies = (familiesPresent: SignalFamily[]): SignalSummary => ({
  voluntaryReturn: { day7: 0, day30: 0 },
  unrequiredRevision: 0,
  chosenChallenge: 0,
  failureRecovery: 0,
  scopeAuthorship: 0,
  competenceGrowth: 0,
  noveltyDecay: 0,
  promptDependence: 0,
  contextEffects: [],
  familiesPresent,
});

describe("evaluateCandidateGate", () => {
  it.each([
    {
      name: "the G4 summary",
      summary: summarizeSignals(EVENTS_GOLDEN_V1),
      expected: { eligible: true, missing: [] },
    },
    {
      name: "novelty from easy clicks only",
      summary: summaryWithFamilies([]),
      expected: {
        eligible: false,
        missing: [
          "<3 signal families (have 0, need 3)",
          "no delayed-discretionary signal",
          "no artifact/competence signal",
        ],
      },
    },
    {
      name: "competence without delayed discretion",
      summary: summaryWithFamilies([
        "artifact_competence",
        "chosen_challenge",
        "unrequired_revision",
      ]),
      expected: {
        eligible: false,
        missing: ["no delayed-discretionary signal"],
      },
    },
    {
      name: "delayed discretion without artifact competence",
      summary: summaryWithFamilies(["voluntary_return", "chosen_challenge", "unrequired_revision"]),
      expected: {
        eligible: false,
        missing: ["no artifact/competence signal"],
      },
    },
    {
      name: "the minimal passing family set",
      summary: summaryWithFamilies(["voluntary_return", "artifact_competence", "chosen_challenge"]),
      expected: { eligible: true, missing: [] },
    },
  ])("returns the exact G5 outcome for $name", ({ summary, expected }) => {
    expect(evaluateCandidateGate(summary)).toEqual(expected);
  });
});
