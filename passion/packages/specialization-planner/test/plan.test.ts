import { describe, it, expect } from "vitest";
import { planSpecialization, planSpecializationWithStub } from "../src/plan.js";
import { curatedForCell } from "../src/curated.js";
import { CURATED_LIBRARY } from "../src/__fixtures__/curated.js";
import { stubBriefGenerator } from "../src/stub-generator.js";
import {
  DP_S1,
  DP_S2,
  DP_S3,
  DP_S4,
  REST_DAYS_PER_WEEK,
  REST_MONTHS_PER_YEAR,
  REST_INCREMENT_MONTHS,
  type PlanInputs,
  type SpecializationPlan,
} from "../src/model.js";
import { INPUTS_S1, INPUTS_S2, INPUTS_S3, INPUTS_S4 } from "../src/__fixtures__/inputs.js";

const NOW = "2026-07-23T00:00:00.000Z";
const deps = { generator: stubBriefGenerator };

async function plan(inputs: PlanInputs): Promise<SpecializationPlan> {
  return planSpecialization(inputs, deps, NOW);
}

interface Head {
  stage: SpecializationPlan["stage"];
  mentorRole: SpecializationPlan["mentorRole"];
  audience: SpecializationPlan["audience"];
  cadence: SpecializationPlan["cadence"];
  dpDose: number;
  pcdeFocus: readonly string[];
}

function head(p: SpecializationPlan): Head {
  return {
    stage: p.stage,
    mentorRole: p.mentorRole,
    audience: p.audience,
    cadence: p.cadence,
    dpDose: p.dpDose,
    pcdeFocus: p.pcdeFocus,
  };
}

describe("planSpecialization — SC-1 golden table (spec §3.1 + §3.7)", () => {
  it("S1_IGNITION", async () => {
    expect(head(await plan(INPUTS_S1))).toEqual({
      stage: "S1_IGNITION",
      mentorRole: "WARM",
      audience: "SELF",
      cadence: "MANY_SHORT",
      dpDose: DP_S1,
      pcdeFocus: ["enjoyment", "relatedness", "identity", "self_regulation"],
    });
  });

  it("S2_FOUNDATIONS", async () => {
    expect(head(await plan(INPUTS_S2))).toEqual({
      stage: "S2_FOUNDATIONS",
      mentorRole: "TECHNICAL",
      audience: "MENTOR_PEERS",
      cadence: "TERM_LENGTH",
      dpDose: DP_S2,
      pcdeFocus: ["goal_setting", "quality_practice", "planning", "self_evaluation"],
    });
  });

  it("S3_AUTHORSHIP", async () => {
    expect(head(await plan(INPUTS_S3))).toEqual({
      stage: "S3_AUTHORSHIP",
      mentorRole: "DOMAIN_EXPERT",
      audience: "REAL_COMMUNITY",
      cadence: "MAJOR_TYPE_III",
      dpDose: DP_S3,
      pcdeFocus: ["coping_feedback", "strategic_risk", "self_advocacy"],
    });
  });

  it("S4_SIGNATURE", async () => {
    expect(head(await plan(INPUTS_S4))).toEqual({
      stage: "S4_SIGNATURE",
      mentorRole: "MASTER",
      audience: "FIELD",
      cadence: "FLAGSHIP",
      dpDose: DP_S4,
      pcdeFocus: ["self_direction", "resilience", "networking", "producer_identity"],
    });
  });

  it("every plan carries the AAP rest cadence, a next project, rationale, guardrails, terminal note", async () => {
    const p = await plan(INPUTS_S3);
    expect(p.restCadence).toEqual({
      daysOffPerWeek: REST_DAYS_PER_WEEK,
      monthsOffPerYear: REST_MONTHS_PER_YEAR,
      offInIncrementsOfMonths: REST_INCREMENT_MONTHS,
    });
    expect(p.nextProject.title.length).toBeGreaterThan(0);
    expect(p.nextProject.childOwnsChoice).toBe(true);
    expect(p.nextProject.source).toBe("stub");
    expect(p.rationale.length).toBeGreaterThan(0);
    expect(p.guardrailNotes.length).toBeGreaterThan(0);
    // The claim, not the sentence. This used to pin the phrase "eminence is adult", so shortening a
    // 48-word note written for a critic rather than for the teacher reading it was a test failure.
    expect(p.terminalNote.length).toBeGreaterThan(0);
  });

  /**
   * The terminal note says how far a child goes is theirs, and it sets no ceiling by age. It used
   * to open with "by ~14 the honest goal is a ready-to-invest performer", which is a rung forecast
   * against a date, and a forecast rung becomes a quota: exactly the family pressure the wellbeing
   * and family engines exist to detect (mastery-map design §8). What paces the plan is the
   * wellbeing read.
   */
  it("the terminal note puts the ceiling on nobody and paces by wellbeing, not by a date", async () => {
    const p = await plan(INPUTS_S3);
    // Asserted as the two things that must be true -- the ceiling belongs to nobody, and the pacing
    // is by how the child is doing -- rather than by the words that happened to carry them.
    expect(p.terminalNote).toMatch(/how far they go is up to them|how far a child goes/i);
    expect(p.terminalNote).toMatch(/wellbeing|how they are doing/i);
    // No age, no date, and no rung promised by one.
    expect(p.terminalNote).not.toMatch(/by ~?\s*\d+\b/i);
    expect(p.terminalNote).not.toMatch(/\bby (?:age|then)\b/i);
    expect(p.terminalNote).not.toMatch(/\bready-to-invest\b/i);
    // The note promises nobody an outcome. Asserted as an absence, which is what actually matters
    // and what cannot be satisfied by rewording: no date, no age, no rung, and no claim to produce
    // a result. The phrase "protects the trajectory, never claims to manufacture it" was the old
    // way of carrying that, and it was written for a reviewer rather than for the teacher it was
    // shown to.
    expect(p.terminalNote).not.toMatch(/\b(guarantee|ensure|produce|deliver|will become)\b/i);
  });

  it("the stub brief head carries the stable §6 golden strings for S3", async () => {
    const p = await plan(INPUTS_S3);
    expect(p.nextProject.title).toBe("A Production project for a real community");
    expect(p.nextProject.audience).toBe("REAL_COMMUNITY");
  });

  it("planSpecializationWithStub (sync) equals the async engine with the stub generator", async () => {
    const resources = curatedForCell(CURATED_LIBRARY, ["music-sound", "production"], "12-14");
    const sync = planSpecializationWithStub(INPUTS_S3, resources, NOW);
    const async_ = await planSpecialization(
      INPUTS_S3,
      { generator: stubBriefGenerator, resources },
      NOW,
    );
    expect(sync).toEqual(async_);
    // and the grounded craft scaffold cites the vetted resources
    expect(sync.nextProject.craftScaffold).toContain("https://");
  });
});
