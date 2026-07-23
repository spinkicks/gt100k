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
    expect(p.terminalNote.toLowerCase()).toContain("ready-to-invest");
  });

  it("the stub brief head carries the stable §6 golden strings for S3", async () => {
    const p = await plan(INPUTS_S3);
    expect(p.nextProject.title).toBe("A Production project for a real community");
    expect(p.nextProject.audience).toBe("REAL_COMMUNITY");
  });

  it("planSpecializationWithStub (sync) equals the async engine with the stub generator", async () => {
    const resources = curatedForCell(CURATED_LIBRARY, ["music-sound", "production"], "12-14");
    const sync = planSpecializationWithStub(INPUTS_S3, resources, NOW);
    const async_ = await planSpecialization(INPUTS_S3, { generator: stubBriefGenerator, resources }, NOW);
    expect(sync).toEqual(async_);
    // and the grounded craft scaffold cites the vetted resources
    expect(sync.nextProject.craftScaffold).toContain("https://");
  });
});
