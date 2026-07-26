// HERMETIC: no network, no env. Exercises the opt-in live catalog adapter's shape only. It imports
// the adapter + the shared engine types (never a domain fixture/test), and feeds the fake catalog
// straight into `brokerAccess` to prove it is a drop-in `OpportunityCatalog`. Mirrors planner-live.
import { describe, it, expect } from "vitest";
import { liveCatalog, LIVE_CELL_AUDIO, LIVE_CELL_CHESS } from "../src/index.js";
import {
  brokerAccess,
  type BrokerInputs,
  type Opportunity,
  type SpecializationPlan,
  type WellbeingRead,
} from "@gt100k/access-broker";

const NOW = "2026-07-24T00:00:00.000Z";

function assertOpportunityShape(o: Opportunity): void {
  expect(typeof o.id).toBe("string");
  expect(["mentor", "audience"]).toContain(o.kind);
  expect(typeof o.title).toBe("string");
  expect(typeof o.cellKey).toBe("string");
  expect(["S1_IGNITION", "S2_FOUNDATIONS", "S3_AUTHORSHIP", "S4_SIGNATURE"]).toContain(o.minStage);
  expect(["6-8", "9-11", "12-14"]).toContain(o.ageTier);
  expect(o.vetting).toBe("vetted");
  expect(o.reputation).toBeGreaterThanOrEqual(0);
  expect(o.reputation).toBeLessThanOrEqual(1);
}

// A minimal S3 plan naming a domain-expert mentor + real-community audience on the live audio cell.
const plan: SpecializationPlan = {
  kidId: "kid-live-001",
  cellKey: LIVE_CELL_AUDIO,
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  stage: "S3_AUTHORSHIP",
  mentorRole: "DOMAIN_EXPERT",
  audience: "REAL_COMMUNITY",
  cadence: "MAJOR_TYPE_III",
  dpDose: 0.3,
  restCadence: { daysOffPerWeek: 2, monthsOffPerYear: 3, offInIncrementsOfMonths: 1 },
  pcdeFocus: ["quality_practice"],
  nextProject: {
    title: "Signature build",
    drivingQuestion: "What can I make that is mine?",
    authenticMethod: "real field method",
    audience: "REAL_COMMUNITY",
    childOwnsChoice: true,
    craftScaffold: "measure and correct one enclosure",
    successLooksLike: "I iterated past the first failure.",
    source: "stub",
  },
  replan: { deload: false, restWindow: false, autonomyUp: false, holdStage: false },
  escalateToHuman: false,
  rationale: "live-adapter hermetic fixture",
  guardrailNotes: [],
  terminalNote: "ready-to-invest performer",
};

const okWellbeing: WellbeingRead = {
  kidId: "kid-live-001",
  cellKey: LIVE_CELL_AUDIO,
  state: "IN_ZONE",
  challenge: "HOLD",
  pressure: "STEADY",
  backOff: false,
  rest: false,
  reduceEvaluativeSurfacing: false,
  escalateToHuman: false,
  rationale: "steady",
  guardrailNotes: [],
};

describe("@gt100k/access-broker-live — opt-in fake catalog (SC-9, hermetic)", () => {
  it("returns valid Opportunity shapes for known cells", () => {
    const mentors = liveCatalog().search({ cellKey: LIVE_CELL_AUDIO, kind: "mentor" });
    expect(mentors.length).toBeGreaterThan(0);
    for (const o of mentors) assertOpportunityShape(o);
    const chessAud = liveCatalog().search({ cellKey: LIVE_CELL_CHESS, kind: "audience" });
    expect(chessAud.length).toBeGreaterThan(0);
    for (const o of chessAud) assertOpportunityShape(o);
  });

  it("returns [] for an unknown cell (no throwing, no network)", () => {
    expect(liveCatalog().search({ cellKey: "nope/none|build", kind: "mentor" })).toEqual([]);
  });

  it("is deterministic across calls", () => {
    const a = liveCatalog().search({ cellKey: LIVE_CELL_AUDIO, kind: "audience" });
    const b = liveCatalog().search({ cellKey: LIVE_CELL_AUDIO, kind: "audience" });
    expect(a).toEqual(b);
  });

  it("is a drop-in OpportunityCatalog for brokerAccess", () => {
    const inputs: BrokerInputs = { plan, wellbeing: okWellbeing, ageBand: "9-11", existing: [] };
    const bp = brokerAccess(inputs, { catalog: liveCatalog() }, NOW);
    expect(bp.mentorMatches.map((m) => m.opportunity.id)).toEqual(["live-mn-expert-audio"]);
    expect(bp.audienceMatches.map((m) => m.opportunity.id)).toEqual(["live-au-competition-audio"]);
    expect(bp.held).toBe(false);
  });
});
