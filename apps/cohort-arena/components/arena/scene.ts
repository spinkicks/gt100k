import {
  type CohortArenaView,
  type MotionSpec,
  type SeatView,
  type Vec3,
  resolveMotion,
} from "@gt100k/cohort-arena-view";

export interface DominanceRingScene {
  readonly speaker: string;
  readonly pos: Vec3;
  readonly share: number;
  readonly arcRadians: number;
  readonly evidence: string;
}

export interface InterruptionArcScene {
  readonly speaker: string;
  readonly floorHolder: string;
  readonly from: Vec3;
  readonly control: Vec3;
  readonly to: Vec3;
  readonly count: number;
  readonly evidence: string;
}

export interface ArenaRoomSceneModel {
  readonly seats: SeatView[];
  readonly dominanceRings: DominanceRingScene[];
  readonly interruptionArcs: InterruptionArcScene[];
  readonly confidence: number;
  readonly suppressed: boolean;
}

export interface ArenaEvidenceMotion {
  readonly interruptionArc: MotionSpec;
  readonly dominanceRing: MotionSpec;
}

function round3(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

/** Keeps static or absent rooms idle; only a truthful live holder needs continuous frames. */
export function resolveArenaFrameLoop(scene: ArenaRoomSceneModel | null): "always" | "demand" {
  return scene?.seats.some(({ holdingFloor }) => holdingFloor) ? "always" : "demand";
}

/** Copies the observable arena-room projection for renderers without adding inferred state. */
export function buildArenaRoomScene(view: CohortArenaView): ArenaRoomSceneModel | null {
  if (!view.rivalry) return null;

  const seats = view.rivalry.seats.map((seat) => ({ ...seat }));
  const seatBySpeaker = new Map(seats.map((seat) => [seat.speaker, seat]));
  const floorHolder = seats.find(({ holdingFloor }) => holdingFloor);
  const dominanceRings: DominanceRingScene[] = [];
  const interruptionArcs: InterruptionArcScene[] = [];

  if (!view.rivalry.suppressed) {
    for (const pattern of view.rivalry.patterns) {
      const speaker = pattern.subjects[0];
      if (!speaker) continue;

      const subject = seatBySpeaker.get(speaker);
      if (!subject) continue;

      if (pattern.kind === "dominance") {
        dominanceRings.push({
          speaker,
          pos: { ...subject.pos },
          share: subject.turnShare,
          arcRadians: Math.PI * 2 * subject.turnShare,
          evidence: pattern.evidence,
        });
        continue;
      }

      if (!floorHolder || floorHolder.speaker === speaker) continue;

      const from = { ...subject.pos, y: round3(subject.pos.y + 0.72) };
      const to = { ...floorHolder.pos, y: round3(floorHolder.pos.y + 0.72) };
      interruptionArcs.push({
        speaker,
        floorHolder: floorHolder.speaker,
        from,
        control: {
          x: round3((from.x + to.x) / 2),
          y: round3(Math.max(from.y, to.y) + 4.78),
          z: round3((from.z + to.z) / 2),
        },
        to,
        count: subject.interruptions,
        evidence: pattern.evidence,
      });
    }
  }

  return {
    seats,
    dominanceRings,
    interruptionArcs,
    confidence: view.rivalry.confidence,
    suppressed: view.rivalry.suppressed,
  };
}

/** Resolves the pinned seat-pulse token from the shared motion registry. */
export function resolveArenaRoomMotion(view: CohortArenaView): MotionSpec {
  return resolveMotion("turnPulse", {
    reducedMotion: view.motion.turnPulse.mode === "reduced",
  });
}

/** Resolves both evidence animations from the shared, golden motion registry. */
export function resolveArenaEvidenceMotion(view: CohortArenaView): ArenaEvidenceMotion {
  return {
    interruptionArc: resolveMotion("interruptionArc", {
      reducedMotion: view.motion.interruptionArc.mode === "reduced",
    }),
    dominanceRing: resolveMotion("dominanceRing", {
      reducedMotion: view.motion.dominanceRing.mode === "reduced",
    }),
  };
}
