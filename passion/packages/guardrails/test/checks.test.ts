// SC-2..SC-8: checkCompliance runs GC1–GC6 over the roster. The clean 014 pilot roster is compliant
// (ok:true, zero violations); each injected-violation roster trips EXACTLY its own check.
// SYNTHETIC ONLY — bad rosters are built by cloning + mutating a real pilot hypothesis.
import { describe, expect, it } from "vitest";
import { buildPilotRoster, PILOT_NOW, emptyProfile, type Roster } from "@gt100k/student-profile";
import { getForKid, type InterestHypothesis, type Lifecycle } from "@gt100k/hypothesis-store";
import { checkCompliance } from "../src/index.js";

/** First hypothesis in the given lifecycle state across the whole roster. */
function firstHypInState(roster: Roster, state: Lifecycle): InterestHypothesis {
  for (const [kidId, profile] of roster)
    for (const h of getForKid(profile.store, kidId)) if (h.state === state) return h;
  throw new Error(`no hypothesis in ${state}`);
}

/** JSON round-trip deep clone (hypotheses are JSON-safe). */
function clone(h: InterestHypothesis): InterestHypothesis {
  return JSON.parse(JSON.stringify(h)) as InterestHypothesis;
}

/** A one-kid roster holding exactly the given (mutated) hypothesis — isolates one check. */
function singleHypRoster(h: InterestHypothesis): Roster {
  const profile = { ...emptyProfile(h.kidId, "test"), store: { byId: { [h.id]: h } } };
  return new Map([[h.kidId, profile]]);
}

const cleanRoster = buildPilotRoster(PILOT_NOW);
const base = clone(firstHypInState(cleanRoster, "EXPLORING")); // clean base to mutate

/** Look up a check result by id. */
function check(report: ReturnType<typeof checkCompliance>, id: string) {
  const c = report.checks.find((x) => x.id === id);
  if (!c) throw new Error(`no check ${id}`);
  return c;
}

describe("checkCompliance — clean pilot roster is compliant (SC-2)", () => {
  const report = checkCompliance(cleanRoster);

  it("has ok:true and zero violations", () => {
    expect(report.ok).toBe(true);
    expect(report.violations).toEqual([]);
  });

  it("runs all six checks GC1–GC6, all passing", () => {
    expect(report.checks.map((c) => c.id)).toEqual(["GC1", "GC2", "GC3", "GC4", "GC5", "GC6"]);
    expect(report.checks.every((c) => c.ok)).toBe(true);
  });
});

describe("checkCompliance — injected violations, one per check (SC-3..SC-7)", () => {
  it("GC4 fails when a CANDIDATE lacks a human transition into its state (SC-3)", () => {
    const bad: InterestHypothesis = {
      ...clone(base),
      state: "CANDIDATE",
      history: [{ at: PILOT_NOW, from: "EXPLORING", to: "EXPLORING", actor: "SYSTEM", reason: "created" }],
    };
    const report = checkCompliance(singleHypRoster(bad));
    expect(report.ok).toBe(false);
    expect(check(report, "GC4").ok).toBe(false);
    // exactly GC4 trips
    expect(report.checks.filter((c) => !c.ok).map((c) => c.id)).toEqual(["GC4"]);
    expect(report.violations).toHaveLength(1);
    expect(report.violations[0]).toMatchObject({ checkId: "GC4", kidId: bad.kidId, cellKey: bad.cellKey });
  });

  it("GC1 fails when an object carries a scalar `score`/`label` field (SC-4)", () => {
    const bad = { ...clone(base), score: 0.9, label: "loves it" } as unknown as InterestHypothesis;
    const report = checkCompliance(singleHypRoster(bad));
    expect(report.ok).toBe(false);
    expect(check(report, "GC1").ok).toBe(false);
    expect(report.checks.filter((c) => !c.ok).map((c) => c.id)).toEqual(["GC1"]);
  });

  it("GC2 fails when `prompted_return` appears in evidence.supporting (SC-5)", () => {
    const bad: InterestHypothesis = {
      ...clone(base),
      evidence: { ...base.evidence, supporting: ["voluntary_return", "prompted_return"] },
    };
    const report = checkCompliance(singleHypRoster(bad));
    expect(report.ok).toBe(false);
    expect(check(report, "GC2").ok).toBe(false);
    expect(report.checks.filter((c) => !c.ok).map((c) => c.id)).toEqual(["GC2"]);
  });

  it("GC5 fails on an EMERGING→EXPLORING history entry (SC-6)", () => {
    const bad: InterestHypothesis = {
      ...clone(base),
      history: [
        ...base.history,
        { at: PILOT_NOW, from: "EMERGING", to: "EXPLORING", actor: "SYSTEM", reason: "demote on silence" },
      ],
    };
    const report = checkCompliance(singleHypRoster(bad));
    expect(report.ok).toBe(false);
    expect(check(report, "GC5").ok).toBe(false);
    expect(report.checks.filter((c) => !c.ok).map((c) => c.id)).toEqual(["GC5"]);
  });

  it("GC6 fails when an artifact carries a `streak`/`points` field (SC-7)", () => {
    const bad = { ...clone(base), streak: 7, points: 100 } as unknown as InterestHypothesis;
    const report = checkCompliance(singleHypRoster(bad));
    expect(report.ok).toBe(false);
    expect(check(report, "GC6").ok).toBe(false);
    expect(report.checks.filter((c) => !c.ok).map((c) => c.id)).toEqual(["GC6"]);
  });
});

describe("checkCompliance — determinism (SC-8)", () => {
  it("same roster yields a deeply-equal ComplianceReport", () => {
    expect(checkCompliance(cleanRoster)).toEqual(checkCompliance(cleanRoster));
  });
});
