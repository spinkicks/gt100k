import type { HypothesisRevision, HypothesisState, SignalSummary } from "@gt100k/interest-lab";
import { describe, expect, it } from "vitest";
import { InMemoryInterestHypothesisRepository } from "../src/index";

const EMPTY_SUMMARY: SignalSummary = {
  voluntaryReturn: { day7: 0, day30: 0 },
  unrequiredRevision: 0,
  chosenChallenge: 0,
  failureRecovery: 0,
  scopeAuthorship: 0,
  competenceGrowth: 0,
  noveltyDecay: 0,
  promptDependence: 0,
  contextEffects: [],
  familiesPresent: [],
};

const makeRevision = (
  state: HypothesisState,
  version: number,
  dayOffset: number,
): HypothesisRevision => ({
  hypothesisId: "synthetic-hypothesis-001",
  learnerRef: "synthetic-learner-001",
  version,
  candidateDomains: ["physical systems", "music composition"],
  workModeProfile: { build: 0.9, compose: 0.8 },
  state,
  evidenceRefs: [`synthetic-evidence-${version}`],
  signalSummary: EMPTY_SUMMARY,
  competingExplanations: ["sustained interest", "resource access"],
  coverageGaps: ["no delayed-discretionary signal"],
  uncertainty: { kind: "grade", grade: "moderate" },
  nextProbe: `synthetic-probe-${version}`,
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: `author ${state}`,
    rationale: "retain the complete contestable history",
    reviewedAtDayOffset: dayOffset,
  },
  proposedBy: "GUIDE",
  operative: true,
  modelVersion: "rules-only-v1",
  policyVersion: "rules-engine-v1",
  validFromDayOffset: dayOffset,
  recordedAtDayOffset: dayOffset,
});

describe("InMemoryInterestHypothesisRepository", () => {
  it("returns null for unknown hypotheses and learners", async () => {
    const repository = new InMemoryInterestHypothesisRepository();

    await expect(repository.load("missing-hypothesis")).resolves.toBeNull();
    await expect(repository.currentFor("missing-learner")).resolves.toBeNull();
    await expect(repository.revisions("missing-hypothesis")).resolves.toEqual([]);
  });

  it("replays every CONTESTED to PARKED to REOPENED revision without overwrite (SC-016)", async () => {
    const repository = new InMemoryInterestHypothesisRepository();
    const contested = makeRevision("CONTESTED", 1, 4);
    const parked = makeRevision("PARKED", 2, 5);
    const reopened = makeRevision("REOPENED", 3, 8);

    await repository.appendRevision(contested.hypothesisId, contested);
    await repository.appendRevision(parked.hypothesisId, parked);
    await repository.appendRevision(reopened.hypothesisId, reopened);

    const replay = await repository.revisions(contested.hypothesisId);
    expect(replay.map(({ version, state }) => ({ version, state }))).toEqual([
      { version: 1, state: "CONTESTED" },
      { version: 2, state: "PARKED" },
      { version: 3, state: "REOPENED" },
    ]);
    expect(await repository.load(contested.hypothesisId)).toEqual({
      hypothesisId: contested.hypothesisId,
      learnerRef: contested.learnerRef,
      revisions: [contested, parked, reopened],
    });
  });

  it("deep-copies writes and every read boundary", async () => {
    const repository = new InMemoryInterestHypothesisRepository();
    const revision = makeRevision("CONTESTED", 1, 4);
    const expected = structuredClone(revision);

    await repository.appendRevision(revision.hypothesisId, revision);
    revision.candidateDomains[0] = "mutated caller domain";
    revision.signalSummary.familiesPresent.push("chosen_challenge");
    revision.guideReview!.rationale = "mutated caller rationale";

    const loaded = await repository.load(expected.hypothesisId);
    const current = await repository.currentFor(expected.learnerRef);
    const replay = await repository.revisions(expected.hypothesisId);

    expect(loaded?.revisions).toEqual([expected]);
    expect(current?.revisions).toEqual([expected]);
    expect(replay).toEqual([expected]);

    loaded!.revisions[0]!.candidateDomains[0] = "mutated loaded domain";
    current!.revisions[0]!.evidenceRefs.push("mutated-current-evidence");
    replay[0]!.coverageGaps.length = 0;

    await expect(repository.load(expected.hypothesisId)).resolves.toEqual({
      hypothesisId: expected.hypothesisId,
      learnerRef: expected.learnerRef,
      revisions: [expected],
    });
    await expect(repository.currentFor(expected.learnerRef)).resolves.toEqual({
      hypothesisId: expected.hypothesisId,
      learnerRef: expected.learnerRef,
      revisions: [expected],
    });
    await expect(repository.revisions(expected.hypothesisId)).resolves.toEqual([expected]);
  });
});
