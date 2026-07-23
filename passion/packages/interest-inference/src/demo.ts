import type { CellEvent, DomainPrior, InterestRead } from "./model.js";
import { runInference } from "./inference.js";

export function runDemo(): InterestRead {
  const now = Date.parse("2026-01-01T00:00:00.000Z");
  const ts = "2026-01-01T00:00:00.000Z";
  const priors: DomainPrior[] = [
    { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
  ];
  const events: CellEvent[] = [
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: ts },
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: ts },
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: ts },
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", magnitude: 1, novelty: false, timestamp: ts },
  ];
  return runInference(events, priors, now);
}
