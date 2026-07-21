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

const SAFE_SPEAKER_REFERENCE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const PROHIBITED_TRAIT_TEXT = /honesty|emotion|personality|motivation/i;

function speakerLabel(speaker: string, index: number): string {
  if (SAFE_SPEAKER_REFERENCE.test(speaker) && !PROHIBITED_TRAIT_TEXT.test(speaker)) {
    return speaker;
  }
  return `Speaker ${index + 1}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function observableEvidence(
  kind: TurnPatternView["kind"],
  subjects: readonly string[],
  evidence: string,
  labels: ReadonlyMap<string, string>,
): string {
  let normalized = evidence;
  for (const [source, label] of labels) {
    if (source && source !== label) normalized = normalized.split(source).join(label);
  }

  const subject = subjects.length === 1 ? subjects[0]! : null;
  if (subject) {
    const escapedSubject = escapeRegExp(subject);
    const allowed =
      kind === "dominance"
        ? new RegExp(
            `^${escapedSubject} holds \\d+\\/\\d+ turns \\(\\d+(?:\\.\\d+)?%\\) > \\d+(?:\\.\\d+)?%$`,
          )
        : new RegExp(`^${escapedSubject} initiated \\d+ overlapping turns ≥ \\d+$`);
    if (allowed.test(normalized)) return normalized;
  }

  const subjectText = subjects.length > 0 ? subjects.join(", ") : "Observed speaker";
  return kind === "dominance"
    ? `${subjectText} met the observable turn-share threshold.`
    : `${subjectText} met the observable overlapping-turn threshold.`;
}

/** Keeps arbitrary input strings inside the observable-only RivalryMix vocabulary. */
export function sanitizeArenaRoomView(view: ArenaRoomView): ArenaRoomView {
  const labels = new Map(
    view.seats.map(({ speaker }, index) => [speaker, speakerLabel(speaker, index)] as const),
  );
  const seats = view.seats.map((seat) => ({
    ...seat,
    speaker: labels.get(seat.speaker)!,
  }));
  const patterns: TurnPatternView[] = [];

  for (const pattern of view.patterns) {
    if (pattern.kind !== "dominance" && pattern.kind !== "repeated_interruption") continue;

    const subjects = pattern.subjects.map(
      (subject, index) => labels.get(subject) ?? speakerLabel(subject, view.seats.length + index),
    );
    patterns.push({
      kind: pattern.kind,
      subjects,
      evidence: observableEvidence(pattern.kind, subjects, pattern.evidence, labels),
    });
  }

  return {
    seats,
    patterns,
    confidence: view.confidence,
    suppressed: view.suppressed,
  };
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

  return sanitizeArenaRoomView({
    seats,
    patterns,
    confidence: analysis.confidence,
    suppressed: analysis.suppressed,
  });
}
