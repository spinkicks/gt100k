import { describe, it, expect } from "vitest";
import { planSpecialization } from "../src/plan.js";
import { stubBriefGenerator } from "../src/stub-generator.js";
import {
  INVESTMENT_LOAD,
  type ProjectBrief,
  type ProjectBriefGenerator,
  type SpecializationPlan,
} from "../src/model.js";
import {
  INPUTS_S1,
  INPUTS_S2,
  INPUTS_S3,
  INPUTS_S4,
  INPUTS_S3_STRAINED,
  INPUTS_SECOND_CELL_S1,
} from "../src/__fixtures__/inputs.js";

const NOW = "2026-07-23T00:00:00.000Z";
const deps = { generator: stubBriefGenerator };
const plan = (i: Parameters<typeof planSpecialization>[0]) => planSpecialization(i, deps, NOW);

// ── SC-6: type-level guarantee — no gamification / no child-facing score field ────────────────
type Forbidden =
  | "score"
  | "grade"
  | "reward"
  | "rewards"
  | "points"
  | "streak"
  | "streaks"
  | "rank"
  | "ranking"
  | "leaderboard"
  | "badge"
  | "prize"
  | "trophy"
  | "childScore"
  | "childFacing";
type AssertNoForbidden<T> = Extract<keyof T, Forbidden> extends never ? true : false;
// These fail to compile if any forbidden key is ever added to the types.
const _planNoForbidden: AssertNoForbidden<SpecializationPlan> = true;
const _briefNoForbidden: AssertNoForbidden<ProjectBrief> = true;
void _planNoForbidden;
void _briefNoForbidden;

const FORBIDDEN_SUBSTRINGS = [
  "score",
  "grade",
  "reward",
  "point",
  "streak",
  "rank",
  "leaderboard",
  "badge",
  "prize",
  "trophy",
];

function assertNoForbiddenKeys(obj: unknown, path = "root"): void {
  if (obj === null || typeof obj !== "object") return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const lower = k.toLowerCase();
    for (const bad of FORBIDDEN_SUBSTRINGS) {
      expect(lower.includes(bad), `${path}.${k} contains forbidden token "${bad}"`).toBe(false);
    }
    assertNoForbiddenKeys(v, `${path}.${k}`);
  }
}

describe("guardrail invariants (spec §3.5)", () => {
  it("SC-3: DP is non-decreasing S1→S4 and every dose is strictly < INVESTMENT_LOAD", async () => {
    const doses = [
      (await plan(INPUTS_S1)).dpDose,
      (await plan(INPUTS_S2)).dpDose,
      (await plan(INPUTS_S3)).dpDose,
      (await plan(INPUTS_S4)).dpDose,
    ];
    for (let i = 1; i < doses.length; i++) expect(doses[i]! >= doses[i - 1]!).toBe(true);
    for (const d of doses) expect(d).toBeLessThan(INVESTMENT_LOAD);
  });

  it("SC-4: audience != SELF ⇒ non-empty craftScaffold; childOwnsChoice always true", async () => {
    for (const inputs of [INPUTS_S1, INPUTS_S2, INPUTS_S3, INPUTS_S4]) {
      const p = await plan(inputs);
      expect(p.nextProject.childOwnsChoice).toBe(true);
      if (p.audience !== "SELF") {
        expect(p.nextProject.craftScaffold.length).toBeGreaterThan(0);
      }
    }
  });

  it("SC-4: nextProject always carries a non-empty craftScaffold (no drill-only plan)", async () => {
    for (const inputs of [INPUTS_S1, INPUTS_S2, INPUTS_S3, INPUTS_S4]) {
      const p = await plan(inputs);
      expect(p.nextProject.craftScaffold.trim().length).toBeGreaterThan(0);
    }
  });

  it("SC-5: rest is mandatory — daysOffPerWeek ≥ 1 and monthsOffPerYear ≥ 1 in every plan", async () => {
    for (const inputs of [INPUTS_S1, INPUTS_S2, INPUTS_S3, INPUTS_S4, INPUTS_S3_STRAINED]) {
      const p = await plan(inputs);
      expect(p.restCadence.daysOffPerWeek).toBeGreaterThanOrEqual(1);
      expect(p.restCadence.monthsOffPerYear).toBeGreaterThanOrEqual(1);
    }
  });

  it("SC-6: no reward/points/streak/rank/score/grade key anywhere in the plan or brief", async () => {
    const p = await plan(INPUTS_S4);
    assertNoForbiddenKeys(p);
  });

  it("SC-7: strain HOLDS the stage — an S3-ready + rest/back-off read is not advanced to S3", async () => {
    const p = await plan(INPUTS_S3_STRAINED);
    expect(p.stage).not.toBe("S3_AUTHORSHIP"); // held below the readiness stage
    expect(p.stage).toBe("S2_FOUNDATIONS");
    expect(p.replan.holdStage).toBe(true);
    expect(p.replan.deload).toBe(true);
    expect(p.replan.autonomyUp).toBe(true);
    expect(p.escalateToHuman).toBe(true);
    // and the DP dose falls with the held stage (never an investment load under strain)
    expect(p.dpDose).toBeLessThan((await plan(INPUTS_S3)).dpDose);
  });

  it("SC-8: system proposes — restWindow/deload OR a proposed advance ⇒ escalateToHuman", async () => {
    // strain path (rest/deload)
    expect((await plan(INPUTS_S3_STRAINED)).escalateToHuman).toBe(true);
    // proposed-advance path (calm S3 is above the entry stage ⇒ guide ratifies)
    const s3 = await plan(INPUTS_S3);
    expect(s3.replan.restWindow || s3.replan.deload).toBe(false);
    expect(s3.escalateToHuman).toBe(true);
    // the default entry (calm S1) is not an advance and has no strain ⇒ no escalation
    const s1 = await plan(INPUTS_S1);
    expect(s1.escalateToHuman).toBe(false);
  });

  it("SC-9: plurality — a second spike is planned independently (its own stage/dose)", async () => {
    const first = await plan(INPUTS_S4); // music-sound/production, S4
    const second = await plan(INPUTS_SECOND_CELL_S1); // games-strategy/chess, S1
    expect(first.cellKey).not.toBe(second.cellKey);
    expect(first.stage).toBe("S4_SIGNATURE");
    expect(second.stage).toBe("S1_IGNITION");
    expect(second.dpDose).toBeLessThan(first.dpDose);
    // the second's stage is unaffected by the first's high readiness (no transfer discount)
    expect(second.mentorRole).toBe("WARM");
  });

  it("SC-10: determinism — identical inputs ⇒ identical plan", async () => {
    const a = await plan(INPUTS_S3);
    const b = await plan(INPUTS_S3);
    expect(a).toEqual(b);
  });

  it("SC-10: fail-safe — a throwing generator falls back to a valid stub nextProject", async () => {
    const throwing: ProjectBriefGenerator = {
      generate: () => Promise.reject(new Error("boom")),
    };
    const p = await planSpecialization(INPUTS_S3, { generator: throwing }, NOW);
    expect(p.nextProject.title.length).toBeGreaterThan(0);
    expect(p.nextProject.craftScaffold.length).toBeGreaterThan(0);
    expect(p.nextProject.childOwnsChoice).toBe(true);
    expect(p.nextProject.source).toBe("stub");
  });

  it("SC-10: fail-safe — an invalid brief (empty fields) also falls back to the stub", async () => {
    const bogus: ProjectBriefGenerator = {
      generate: () =>
        Promise.resolve({
          title: "",
          drivingQuestion: "",
          authenticMethod: "",
          audience: "SELF",
          childOwnsChoice: true,
          craftScaffold: "",
          successLooksLike: "",
          source: "llm",
        }),
    };
    const p = await planSpecialization(INPUTS_S3, { generator: bogus }, NOW);
    expect(p.nextProject.source).toBe("stub");
    expect(p.nextProject.title.length).toBeGreaterThan(0);
  });
});
