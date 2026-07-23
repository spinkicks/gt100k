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
  it("excludes novelty + prompted; adds returns/depth to alpha; skips to beta", () => {
    const priors: DomainPrior[] = [
      { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
    ];
    const evts: CellEvent[] = [
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "unrequired_revision", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "skip", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: true, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "prompted_return", magnitude: 1, novelty: false, timestamp: TS },
    ];
    const cell = foldEvents(evts, priors, NOW).get("music-sound/audio-systems::build")!;
    expect(cell.alpha).toBeCloseTo(5.5, 6);
    expect(cell.beta).toBeCloseTo(1.5, 6);
    expect(cell.skips).toBe(1);
    expect(cell.prompted).toBe(1);
  });
});
