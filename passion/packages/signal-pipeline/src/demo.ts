import { runInference } from "@gt100k/interest-inference";
import type { InterestRead } from "@gt100k/interest-inference";
import { deriveSignals } from "./pipeline.js";
import { CATALOG, INTERACTIONS, SURFACED, NOW } from "./__fixtures__/pipeline.fixtures.js";

export function runDemo(): { cellEventCount: number; read: InterestRead } {
  const { cellEvents } = deriveSignals({ interactions: INTERACTIONS, surfaced: SURFACED, catalog: CATALOG });
  const read = runInference(cellEvents, [{ domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 }], NOW);
  return { cellEventCount: cellEvents.length, read };
}
