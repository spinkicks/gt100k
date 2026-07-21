import {
  type CelebrationEvent,
  type InitialArenaView,
  type LearningMomentSignal,
  type SoundCue,
  classifyCelebration,
  resolveSoundCue,
} from "@gt100k/arena-world";

export interface SequencedArenaFeedback {
  sequence: number;
  signal: LearningMomentSignal;
}

export type ResolvedArenaFeedback =
  | {
      kind: "celebration";
      event: CelebrationEvent;
      soundCue: SoundCue;
    }
  | {
      kind: "not-yet";
      event: null;
      soundCue: SoundCue;
    };

export function resolveArenaFeedback(signal: LearningMomentSignal): ResolvedArenaFeedback {
  const event = classifyCelebration(signal);
  if (!event) {
    return {
      kind: "not-yet",
      event: null,
      soundCue: resolveSoundCue("notYet"),
    };
  }

  const soundEvent =
    event.type === "productive-struggle"
      ? "productiveStruggle"
      : event.intensity === "high"
        ? "unlockHigh"
        : "unlockMedium";

  return {
    kind: "celebration",
    event,
    soundCue: resolveSoundCue(soundEvent),
  };
}

export function resolveFeedbackAnnouncement(
  view: InitialArenaView,
  feedback: ResolvedArenaFeedback,
): string {
  if (feedback.kind === "not-yet") return view.representation.failureCopy;
  if (feedback.event.type === "productive-struggle") {
    return "You kept going after a tricky one — that's the work.";
  }

  const node = view.world.nodes.find(({ id }) => id === feedback.event.nodeId);
  const landmark = node?.landmark ?? "a new beacon";
  return `You lit ${landmark} — you did it yourself.`;
}
