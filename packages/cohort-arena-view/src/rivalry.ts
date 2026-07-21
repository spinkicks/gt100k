import type { TurnAnalysis } from "../../cohort-compiler/src/index.js";
import type { Vec2, Vec3 } from "./layout.js";
import { layoutArenaRing } from "./layout.js";

export interface SeatView {
  readonly speaker: string;
  readonly pos: Vec3;
  readonly pos2d: Vec2;
  readonly turnShare: number;
  readonly interruptions: number;
  readonly holdingFloor: boolean;
}

export interface TurnPatternView {
  readonly kind: "dominance" | "repeated_interruption";
  readonly subjects: string[];
  readonly evidence: string;
}

export interface ArenaRoomView {
  readonly seats: SeatView[];
  readonly patterns: TurnPatternView[];
  readonly confidence: number;
  readonly suppressed: boolean;
}

/** Projects observable turn-analysis output into the deterministic arena-room view. */
export function buildArenaRoomView(analysis: TurnAnalysis): ArenaRoomView {
  const seats = layoutArenaRing(Object.keys(analysis.perSpeaker)).map(
    ({ speaker, pos, pos2d }): SeatView => {
      const descriptor = analysis.perSpeaker[speaker]!;
      return {
        speaker,
        pos,
        pos2d,
        turnShare: descriptor.turnShare,
        interruptions: descriptor.interruptions,
        holdingFloor: false,
      };
    },
  );
  const patterns = analysis.suppressed
    ? []
    : analysis.patterns.map(({ kind, subjects, evidence }) => ({
        kind,
        subjects: [...subjects],
        evidence,
      }));

  return {
    seats,
    patterns,
    confidence: analysis.confidence,
    suppressed: analysis.suppressed,
  };
}
