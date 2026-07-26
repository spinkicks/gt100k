import type { CellEvent, DomainPrior, InterestRead } from "./model.js";
import { runInference } from "./inference.js";

/**
 * A synthetic child who came back to one cell on each of eight consecutive days.
 *
 * It used to be three returns on a single timestamp, which read `confident` under the old gates.
 * Under E6 that is exactly the shape the engine now refuses to call durable — one sitting's worth
 * of enthusiasm — so the demo would have printed "not sure yet" and shown nothing of what the
 * package does. Eight days of returns is what a real hooked child leaves behind, and it clears
 * both the mass floor and the day gate on its own merits.
 */
export function runDemo(): InterestRead {
  const now = Date.parse("2026-01-12T00:00:00.000Z");
  const day = (d: number): string => `2026-01-${String(d).padStart(2, "0")}T00:00:00.000Z`;
  const priors: DomainPrior[] = [
    { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
  ];
  const events: CellEvent[] = [
    ...[5, 6, 7, 8, 9, 10, 11, 12].map(
      (d): CellEvent => ({
        domainPath: ["music-sound", "audio-systems"],
        mode: "build",
        kind: "cross_day_return",
        novelty: false,
        timestamp: day(d),
      }),
    ),
    // Still here to show it is carried and still unscored for interest (E11).
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", novelty: false, timestamp: day(12) },
  ];
  return runInference(events, priors, now);
}
