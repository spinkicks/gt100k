import { describe, expect, it } from "vitest";
import {
  type ArtifactSignalSource,
  type ArtifactTransition,
  type AssentRecordPort,
  DEFAULT_LAB_CONFIG,
  type EngagementEvent,
  type EventType,
  type HypothesisRevision,
  type InterestHypothesis,
  type InterestHypothesisRepository,
  type ProbeFamily,
  buildLab,
  evaluateCandidateGate,
  recordEvent,
  summarizeSignals,
} from "../src/index";
import { EVENTS_GOLDEN_V1 } from "./fixtures/events";

const SYNTHETIC_LEARNER = "synthetic-learner-001";

interface CatalogAdapter {
  CATALOG_GAPPY_V1: ProbeFamily[];
  CATALOG_GOLDEN_V1: ProbeFamily[];
}

interface ArtifactAdapter {
  StubArtifactSignalSource: new (
    payloads?: readonly unknown[],
  ) => ArtifactSignalSource<ArtifactTransition>;
}

interface AssentAdapter {
  StubAssentRecord: new () => AssentRecordPort;
}

interface RepositoryAdapter {
  InMemoryInterestHypothesisRepository: new () => InterestHypothesisRepository<
    InterestHypothesis,
    HypothesisRevision
  >;
}

const loadAdapter = async <Adapter>(relativePath: string): Promise<Adapter> => {
  const moduleUrl = new URL(relativePath, import.meta.url).href;
  return (await import(/* @vite-ignore */ moduleUrl)) as Adapter;
};

const makeEvent = (
  id: string,
  type: EventType,
  occurredAtDayOffset: number,
  overrides: Partial<EngagementEvent> = {},
): EngagementEvent => ({
  id,
  learnerRef: SYNTHETIC_LEARNER,
  probeId: "synthetic-probe-001",
  familyId: "synthetic-family-001",
  domain: "synthetic-domain",
  type,
  occurredAtDayOffset,
  assistive: false,
  reliability: "high",
  optionalReflection: false,
  withdrawn: false,
  ...overrides,
});

const makeRevision = (
  signalSummary: ReturnType<typeof summarizeSignals>,
  evidenceRefs: string[],
): HypothesisRevision => ({
  hypothesisId: "synthetic-hypothesis-001",
  learnerRef: SYNTHETIC_LEARNER,
  version: 1,
  candidateDomains: ["synthetic-domain"],
  workModeProfile: { build: 1 },
  state: "EMERGING",
  evidenceRefs,
  signalSummary,
  competingExplanations: ["sustained interest", "novelty effect"],
  coverageGaps: [],
  uncertainty: { kind: "grade", grade: "moderate" },
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: "retain emerging hypothesis",
    rationale: "record only evidence that remains available for modeling",
    reviewedAtDayOffset: 21,
  },
  proposedBy: "GUIDE",
  operative: true,
  modelVersion: "rules-only-v1",
  policyVersion: "rules-engine-v1",
  validFromDayOffset: 21,
  recordedAtDayOffset: 21,
});

describe("PRD §14.4.3 acceptance", () => {
  it("#1 keeps novelty-only easy clicks below the candidate-spine gate", () => {
    const gate = evaluateCandidateGate(summarizeSignals([]));

    expect(gate).toEqual({
      eligible: false,
      missing: [
        "<3 signal families (have 0, need 3)",
        "no delayed-discretionary signal",
        "no artifact/competence signal",
      ],
    });
  });

  it("#2 keeps low-skill recovery and self-authored return eligible", async () => {
    const { StubArtifactSignalSource } = await loadAdapter<ArtifactAdapter>(
      "../../../adapters/interest-artifact-stub/src/index.ts",
    );
    const artifactSource = new StubArtifactSignalSource([
      {
        artifactRef: "synthetic-artifact-001",
        learnerRef: SYNTHETIC_LEARNER,
        transition: "TESTED",
        dayOffset: 25,
      },
    ]);
    const artifact = await artifactSource.next();
    expect(artifact).not.toBeNull();

    const events = [
      makeEvent("instruction-request", "ASSISTIVE", 1, { assistive: true }),
      makeEvent("voluntary-return", "VOLUNTARY_RETURN", 7),
      makeEvent("failure-recovery", "FAILURE_RECOVERY", 14),
      makeEvent("harder-goal", "SELF_AUTHORED_SCOPE", 20),
      makeEvent("coarse-artifact", "ARTIFACT_COMPETENCE", artifact?.dayOffset ?? 25),
    ].reduce(recordEvent, [] as EngagementEvent[]);

    expect(evaluateCandidateGate(summarizeSignals(events))).toEqual({
      eligible: true,
      missing: [],
    });
  });

  it("#3 reports every coverage gap without a score or confidence", async () => {
    const { CATALOG_GAPPY_V1 } = await loadAdapter<CatalogAdapter>(
      "../../../adapters/interest-probe-catalog/src/index.ts",
    );
    const lab = buildLab(SYNTHETIC_LEARNER, CATALOG_GAPPY_V1, {
      metPrereqs: [],
      engagedDomains: [],
    });

    expect(lab.coverage.gaps).toEqual([
      "probe count 8 below minimum 18",
      "only 5 of ≥6 required domains",
      "only 5 of ≥6 required work modes",
      "no collaborative (group) probe",
      "no stretch-band probe",
      "no audience-condition probe",
    ]);
    expect(lab.coverage.complete).toBe(false);
    expect(JSON.stringify(lab.coverage)).not.toMatch(/score|confidence/i);
  });

  it("#4 keeps prompted and discretionary returns distinct", () => {
    const events = [
      makeEvent("voluntary", "VOLUNTARY_RETURN", 7),
      makeEvent("prompted", "PROMPTED_RETURN", 7, {
        interventionContext: { source: "reminder" },
      }),
    ].reduce(recordEvent, [] as EngagementEvent[]);
    const summary = summarizeSignals(events);

    expect(events.map(({ type }) => type)).toEqual(["VOLUNTARY_RETURN", "PROMPTED_RETURN"]);
    expect(summary).toMatchObject({
      voluntaryReturn: { day7: 1, day30: 0 },
      promptDependence: 1,
      contextEffects: ["reminder"],
      familiesPresent: ["voluntary_return"],
    });
  });

  it("#5 builds a complete balanced Lab with adaptive selection disabled", async () => {
    const { CATALOG_GOLDEN_V1 } = await loadAdapter<CatalogAdapter>(
      "../../../adapters/interest-probe-catalog/src/index.ts",
    );
    const lab = buildLab(
      SYNTHETIC_LEARNER,
      CATALOG_GOLDEN_V1,
      { metPrereqs: [], engagedDomains: [] },
      DEFAULT_LAB_CONFIG,
    );

    expect(lab.offers).toHaveLength(20);
    expect(lab.coverage).toMatchObject({
      probeCount: { met: true },
      domains: { met: true },
      workModes: { met: true },
      social: { met: true },
      difficulty: { met: true },
      audience: { met: true },
      complete: true,
      gaps: [],
    });
  });

  it("#6 removes a withdrawn optional reflection from the next build and replay", async () => {
    const [{ StubAssentRecord }, { InMemoryInterestHypothesisRepository }] = await Promise.all([
      loadAdapter<AssentAdapter>("../../../adapters/interest-assent-stub/src/index.ts"),
      loadAdapter<RepositoryAdapter>("../../../adapters/interest-repo-memory/src/index.ts"),
    ]);
    const assent = new StubAssentRecord();
    const repository = new InMemoryInterestHypothesisRepository();
    await assent.recordWithdrawal(SYNTHETIC_LEARNER, "e7");

    const retainedEvents = await Promise.all(
      EVENTS_GOLDEN_V1.map(async (event) => ({
        ...event,
        withdrawn:
          event.optionalReflection && (await assent.isWithdrawn(event.learnerRef, event.id)),
      })),
    );
    const nextSummary = summarizeSignals(retainedEvents);
    const evidenceRefs = retainedEvents.filter(({ withdrawn }) => !withdrawn).map(({ id }) => id);
    await repository.appendRevision(
      "synthetic-hypothesis-001",
      makeRevision(nextSummary, evidenceRefs),
    );

    const replay = await repository.revisions("synthetic-hypothesis-001");
    expect(nextSummary).toMatchObject({ scopeAuthorship: 0 });
    expect(nextSummary.familiesPresent).not.toContain("self_authored_scope");
    expect(replay).toHaveLength(1);
    expect(replay[0]?.evidenceRefs).not.toContain("e7");
    expect(replay[0]?.signalSummary).toEqual(nextSummary);
  });

  it("#7 gives assistive input and safety rescue the unaided interpretation", () => {
    const unaided = summarizeSignals(EVENTS_GOLDEN_V1);
    const supported = summarizeSignals(
      EVENTS_GOLDEN_V1.map((event) =>
        event.id === "e4" || event.id === "e6" ? { ...event, assistive: true } : event,
      ),
    );

    expect(supported).toEqual(unaided);
  });
});
