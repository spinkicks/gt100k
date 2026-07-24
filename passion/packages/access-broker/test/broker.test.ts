import { describe, it, expect } from "vitest";
import { brokerAccess, CRAFT_FLOOR_REASON, HELD_NOTE, type BrokerInputs } from "../src/broker.js";
import { stubCatalog } from "../src/catalog.js";
import type { AgeBand, Brokerage, SpecializationPlan } from "../src/model.js";
import {
  PLAN_S1,
  PLAN_S2,
  PLAN_S3,
  PLAN_S4,
  PLAN_S3_NO_SCAFFOLD,
  PLAN_S3_CHESS,
} from "../src/__fixtures__/plans.js";
import { okWellbeing, restWellbeing } from "../src/__fixtures__/wellbeing.js";

const NOW = "2026-07-24T00:00:00.000Z";
const deps = { catalog: stubCatalog };

function inputs(plan: SpecializationPlan, ageBand: AgeBand, over: Partial<BrokerInputs> = {}): BrokerInputs {
  return {
    plan,
    wellbeing: okWellbeing(plan.kidId, plan.cellKey),
    ageBand,
    existing: [],
    ...over,
  };
}

const ids = (ms: readonly { opportunity: { id: string } }[]): string[] => ms.map((m) => m.opportunity.id);
const scores = (ms: readonly { score: number }[]): number[] => ms.map((m) => m.score);

describe("brokerAccess — golden matching table (SC-1)", () => {
  it("S1: warm mentors only; no real audience (SELF); age/stage-gated entries hidden", () => {
    const bp = brokerAccess(inputs(PLAN_S1, "6-8"), deps, NOW);
    expect(ids(bp.mentorMatches)).toEqual(["gd-ai-warm", "gd-fam-warm"]);
    expect(scores(bp.mentorMatches)).toEqual([0.89, 0.87]);
    // gd-ai-warm-teen (age 12-14) and gd-master (S4/MASTER) are absent.
    expect(ids(bp.mentorMatches)).not.toContain("gd-ai-warm-teen");
    expect(ids(bp.mentorMatches)).not.toContain("gd-master");
    expect(bp.audienceMatches).toEqual([]);
    expect(bp.held).toBe(false);
    expect(bp.escalateToHuman).toBe(true);
    expect(bp.mentorMatches[0]!.fit).toEqual([
      "domain code-computers/game-dev|build",
      "mode build",
      "fills WARM role",
      "AI source",
      "reputation 0.7",
    ]);
  });

  it("S2: technical mentor + mentor-peer audience (pending mentor filtered)", () => {
    const bp = brokerAccess(inputs(PLAN_S2, "9-11"), deps, NOW);
    expect(ids(bp.mentorMatches)).toEqual(["mn-peer-tech"]);
    expect(ids(bp.mentorMatches)).not.toContain("mn-pending-tech"); // vetting gate
    expect(ids(bp.audienceMatches)).toEqual(["au-peers-community"]);
  });

  it("S3: domain-expert mentor + real-community audience (competition ranks first via deadline)", () => {
    const bp = brokerAccess(inputs(PLAN_S3, "9-11"), deps, NOW);
    expect(ids(bp.mentorMatches)).toEqual(["mn-thin-expert"]);
    expect(scores(bp.mentorMatches)).toEqual([0.92]);
    expect(ids(bp.audienceMatches)).toEqual(["au-competition", "au-community-showcase"]);
    expect(scores(bp.audienceMatches)).toEqual([0.96, 0.9]);
    // au-community-early (S4, same level) is stage-gated out; au-rejected-community is vetting-gated.
    expect(ids(bp.audienceMatches)).not.toContain("au-community-early");
    expect(ids(bp.audienceMatches)).not.toContain("au-rejected-community");
    expect(bp.audienceMatches[0]!.fit).toContain("why now: deadline 2026-09-01");
  });

  it("S4: master mentor + field audience (publishing + marketplace)", () => {
    const bp = brokerAccess(inputs(PLAN_S4, "12-14"), deps, NOW);
    expect(ids(bp.mentorMatches)).toEqual(["mn-master"]);
    expect(scores(bp.mentorMatches)).toEqual([0.94]);
    expect(ids(bp.audienceMatches)).toEqual(["au-publishing-field", "au-marketplace-field"]);
    expect(scores(bp.audienceMatches)).toEqual([0.93, 0.89]);
  });

  it("plurality: a second cell (chess) brokers independently", () => {
    const bp = brokerAccess(inputs(PLAN_S3_CHESS, "9-11"), deps, NOW);
    expect(ids(bp.mentorMatches)).toEqual(["ch-thin-expert"]);
    expect(ids(bp.audienceMatches)).toEqual(["ch-competition"]);
    expect(bp.kidId).toBe(PLAN_S3_CHESS.kidId);
  });
});

describe("brokerAccess — stage gate (SC-3)", () => {
  it("an Opportunity{minStage:S4} never appears for an S1 plan", () => {
    const bp = brokerAccess(inputs(PLAN_S1, "6-8"), deps, NOW);
    const all = [...bp.mentorMatches, ...bp.audienceMatches];
    for (const m of all) expect(m.opportunity.minStage).not.toBe("S4_SIGNATURE");
  });

  it("isolates the stage gate from the level filter: a same-level S4 audience is excluded at S3", () => {
    // au-community-early is REAL_COMMUNITY (matches the S3 plan's level) but minStage S4 ⇒ gated.
    const raw = stubCatalog.search({ cellKey: PLAN_S3.cellKey, kind: "audience" });
    expect(raw.some((o) => o.id === "au-community-early" && o.level === "REAL_COMMUNITY")).toBe(true);
    const bp = brokerAccess(inputs(PLAN_S3, "9-11"), deps, NOW);
    expect(ids(bp.audienceMatches)).not.toContain("au-community-early");
  });
});

describe("brokerAccess — craft floor (SC-4)", () => {
  it("audience != SELF with an empty craftScaffold ⇒ audience blocked with the craft-floor reason", () => {
    const bp = brokerAccess(inputs(PLAN_S3_NO_SCAFFOLD, "9-11"), deps, NOW);
    expect(bp.audienceMatches).toEqual([]);
    expect(bp.reasons).toContain(CRAFT_FLOOR_REASON);
    // the mentor need is unaffected by the craft floor.
    expect(ids(bp.mentorMatches)).toEqual(["mn-thin-expert"]);
    expect(bp.escalateToHuman).toBe(true);
  });

  it("a non-empty scaffold surfaces the same audience need", () => {
    const bp = brokerAccess(inputs(PLAN_S3, "9-11"), deps, NOW);
    expect(bp.audienceMatches.length).toBeGreaterThan(0);
    expect(bp.reasons).not.toContain(CRAFT_FLOOR_REASON);
  });
});

describe("brokerAccess — wellbeing back-off hold (SC-5)", () => {
  const existing: readonly Brokerage[] = [
    {
      id: "brk-active",
      kidId: PLAN_S3.kidId,
      spikeCell: { cellKey: PLAN_S3.cellKey },
      opportunityId: "mn-thin-expert",
      kind: "mentor",
      state: "introduced",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    {
      id: "brk-done",
      kidId: PLAN_S3.kidId,
      spikeCell: { cellKey: PLAN_S3.cellKey },
      opportunityId: "au-competition",
      kind: "audience",
      state: "transferred",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
  ];

  it("rest|backOff ⇒ held, zero new matches, non-terminal noted, nothing advanced", () => {
    const bp = brokerAccess(
      inputs(PLAN_S3, "9-11", {
        wellbeing: restWellbeing(PLAN_S3.kidId, PLAN_S3.cellKey),
        existing,
      }),
      deps,
      NOW,
    );
    expect(bp.held).toBe(true);
    expect(bp.mentorMatches).toEqual([]);
    expect(bp.audienceMatches).toEqual([]);
    expect(bp.reasons).toContain(HELD_NOTE);
    expect(bp.escalateToHuman).toBe(true);

    const active = bp.brokerages.find((b) => b.id === "brk-active")!;
    expect(active.note).toBe(HELD_NOTE);
    expect(active.state).toBe("introduced"); // never advanced
    expect(active.updatedAt).toBe(NOW);

    const done = bp.brokerages.find((b) => b.id === "brk-done")!;
    expect(done.note).toBeUndefined(); // terminal state left untouched
    expect(done.state).toBe("transferred");
  });
});

describe("brokerAccess — vetting + age-tier gates (SC-6)", () => {
  it("excludes pending/rejected opportunities and age-inappropriate ones", () => {
    const s2 = brokerAccess(inputs(PLAN_S2, "9-11"), deps, NOW);
    expect(ids(s2.mentorMatches)).not.toContain("mn-pending-tech");
    const s3 = brokerAccess(inputs(PLAN_S3, "9-11"), deps, NOW);
    expect(ids(s3.audienceMatches)).not.toContain("au-rejected-community");
    // age gate: the teen-tier warm mentor is hidden from a 6-8 kid on the S1 cell.
    const s1 = brokerAccess(inputs(PLAN_S1, "6-8"), deps, NOW);
    expect(ids(s1.mentorMatches)).not.toContain("gd-ai-warm-teen");
  });
});

describe("brokerAccess — determinism (SC-8)", () => {
  it("identical inputs ⇒ identical BrokerPlan", () => {
    const a = brokerAccess(inputs(PLAN_S3, "9-11"), deps, NOW);
    const b = brokerAccess(inputs(PLAN_S3, "9-11"), deps, NOW);
    expect(a).toEqual(b);
  });

  it("never emits a Brokerage state past `proposed` (system proposes, guide disposes)", () => {
    const bp = brokerAccess(inputs(PLAN_S3, "9-11"), deps, NOW);
    for (const b of bp.brokerages) {
      expect(["matched", "proposed", "held"]).toContain(b.state);
    }
  });
});
