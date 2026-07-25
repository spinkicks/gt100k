import { describe, it, expect } from "vitest";
import { buildPrior, foldEvents } from "../src/fold.js";
import type { CellEvent, DomainPrior } from "../src/model.js";

const NOW = Date.parse("2026-01-01T00:00:00.000Z");
const TS = "2026-01-01T00:00:00.000Z"; // age 0 → recency 1

describe("buildPrior", () => {
  it("adds env + tilt bonuses", () => {
    const p: DomainPrior = {
      domain: "music-sound",
      inEnvironment: true,
      aptitudeTilt: 0,
      discretionaryTilt: 0,
    };
    expect(buildPrior(p)).toEqual({ alphaPrior: 1.5, betaPrior: 1 });
    expect(buildPrior(undefined)).toEqual({ alphaPrior: 1, betaPrior: 1 });
    expect(
      buildPrior({ domain: "x", inEnvironment: false, aptitudeTilt: 1, discretionaryTilt: 1 }),
    ).toEqual({ alphaPrior: 2, betaPrior: 1 });
  });
});

describe("foldEvents", () => {
  it("excludes novelty, prompted and artifact_competence; adds returns/depth to alpha; skips to beta", () => {
    const priors: DomainPrior[] = [
      { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
    ];
    const evts: CellEvent[] = [
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "unrequired_revision", novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "skip", novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: true, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "prompted_return", novelty: false, timestamp: TS },
    ];
    const cell = foldEvents(evts, priors, NOW).get("music-sound/audio-systems::build")!;
    // 1.5 prior + 3 voluntary returns + 0.5 for the one scoring depth family.
    // artifact_competence contributes nothing (E11): it is a work-quality judgement, not
    // evidence about what the child is drawn to.
    expect(cell.alpha).toBeCloseTo(5.0, 6);
    expect(cell.beta).toBeCloseTo(1.5, 6);
    expect(cell.skips).toBe(1);
    expect(cell.prompted).toBe(1);
    // It must not surface as a supporting reason either, since it moved no belief.
    expect(cell.positiveByKind["artifact_competence"]).toBeUndefined();
    expect(cell.positiveByKind["unrequired_revision"]).toBeCloseTo(0.5, 6);
  });

  it("same_day_engagement is counted but moves nothing (E2)", () => {
    const priors: DomainPrior[] = [
      { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
    ];
    const sameDayOnly: CellEvent[] = [
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "same_day_engagement", novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "same_day_engagement", novelty: false, timestamp: TS },
    ];
    const cell = foldEvents(sameDayOnly, priors, NOW).get("music-sound/audio-systems::build")!;
    expect(cell.alpha).toBeCloseTo(1.5, 6); // prior only
    expect(cell.beta).toBeCloseTo(1.0, 6); // prior only
    expect(cell.sameDay).toBe(2);
    // It moved no belief, so it must not read as a reason to believe.
    expect(cell.positiveByKind).toEqual({});

    // And adding same-day engagements to a scoring cell changes neither alpha nor beta.
    const withReturn: CellEvent[] = [
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: false, timestamp: TS },
    ];
    const scored = foldEvents(withReturn, priors, NOW).get("music-sound/audio-systems::build")!;
    const mixed = foldEvents([...withReturn, ...sameDayOnly], priors, NOW).get("music-sound/audio-systems::build")!;
    expect(mixed.alpha).toBeCloseTo(scored.alpha, 12);
    expect(mixed.beta).toBeCloseTo(scored.beta, 12);
    expect(mixed.positiveByKind).toEqual(scored.positiveByKind);
  });
});
