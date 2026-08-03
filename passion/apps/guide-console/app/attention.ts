// One attention verdict per child: what does this child need from me right now? Priority order
// mirrors the wellbeing engine's own ordering: safety first (a wellbeing escalation), then a fading
// interest (engagement is cooling even if affect is calm -- a calm read must not stand alone over a
// dying interest), then opportunity (a promote gate has passed), then quiet. Pure and deterministic.
import { specPath } from "./vocab.js";
import { STATE_LABEL } from "./wellbeing-strip.js";

export type AttentionLevel = "NEEDS_YOU" | "READY" | "STEADY";

export interface Attention {
  readonly level: AttentionLevel;
  readonly headline: string;
  readonly reason: "WELLBEING" | "ENGAGEMENT_FADING" | "GATE_READY" | "STEADY";
  readonly specId: string | null;
}

export interface WellbeingSignal {
  readonly id: string;
  readonly state: string;
  readonly escalateToHuman: boolean;
  readonly domainPath: readonly string[];
}

export interface CardSignal {
  readonly id: string;
  // The lifecycle state, because "ready to promote" is not "gate passed": a card keeps its passed
  // gate after it is promoted, so the verdict has to see the state to know the act is already done.
  readonly state: string;
  readonly gatePassed: boolean;
  // Whether the estimate behind this card rests on enough evidence to rely on (the card's own
  // `confident` flag). Optional so callers and tests that predate it still compile; absent reads as
  // not-yet-confident. It is what tells a quiet-because-settled child from a quiet-because-unobserved
  // one, which otherwise wear the identical calm verdict.
  readonly confident?: boolean;
  readonly domainPath: readonly string[];
}

export interface AttentionInputs {
  readonly wellbeing: readonly WellbeingSignal[];
  readonly cards: readonly CardSignal[];
  readonly fading: boolean;
}

// Severity for choosing which escalating spike names the headline. Matches assess.ts priority: a
// child close to burning out outranks one merely stretched too far when only one line can be shown.
const SEVERITY: Record<string, number> = {
  BURNOUT_TIP: 6,
  EARLY_BURNOUT: 5,
  GAP: 4,
  DANGER_WINDOW: 3,
  OVER_CHALLENGED: 2,
};

export function attentionRank(level: AttentionLevel): number {
  return level === "NEEDS_YOU" ? 0 : level === "READY" ? 1 : 2;
}

// Sort any list into triage order: whoever needs the guide floats up. Ties keep their input order
// (an explicit index tiebreaker, not a reliance on the engine's sort stability), so a child never
// reshuffles within its level as the store changes underneath. Pure -- the same list the roster and
// the switcher both order, so the two can never disagree about who is first.
export function orderByAttention<T>(
  items: readonly T[],
  levelOf: (item: T) => AttentionLevel,
): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        attentionRank(levelOf(a.item)) - attentionRank(levelOf(b.item)) || a.index - b.index,
    )
    .map((x) => x.item);
}

export function attentionFor(input: AttentionInputs): Attention {
  const escalating = input.wellbeing.filter((w) => w.escalateToHuman);
  if (escalating.length > 0) {
    const worst = [...escalating].sort(
      (a, b) => (SEVERITY[b.state] ?? 0) - (SEVERITY[a.state] ?? 0),
    )[0]!;
    return {
      level: "NEEDS_YOU",
      reason: "WELLBEING",
      specId: worst.id,
      headline: STATE_LABEL[worst.state] ?? worst.state,
    };
  }
  if (input.fading) {
    return {
      level: "NEEDS_YOU",
      reason: "ENGAGEMENT_FADING",
      specId: null,
      headline: "Interest is cooling. Returns are down.",
    };
  }
  // Ready means promotable, not merely gate-passed. A card keeps its passed gate after it becomes a
  // CANDIDATE, so keying off the gate alone left the roster and the action line advertising "Ready to
  // promote X" for a child who had just been promoted and had nothing left to promote -- the button
  // silently became Review while the words stayed put, so the guide could not tell their click had
  // landed. Match `topPromotableId`'s rule (state EMERGING + gate passed) so the verdict clears the
  // instant the promote takes, and the read never asks for something the store now refuses.
  const ready = input.cards.find((c) => c.state === "EMERGING" && c.gatePassed);
  if (ready) {
    return {
      level: "READY",
      reason: "GATE_READY",
      specId: ready.id,
      headline: `Ready to promote ${specPath(ready.domainPath)}`,
    };
  }
  // STEADY, but not all quiet is the same quiet. "Steady. Nothing needs you." on a child we have
  // barely observed reads as "assessed and fine" when it means "we have almost no signal" -- a false
  // reassurance that could let a guide leave a child alone precisely when there is nothing yet to go
  // on. A calm read backed by evidence and a calm read backed by nothing must not share one line, so
  // the headline says which quiet this is. The level stays STEADY either way: there is still nothing
  // to act on, and inventing an alarm from thin evidence would be the opposite mistake.
  if (input.cards.length === 0) {
    return { level: "STEADY", reason: "STEADY", specId: null, headline: "Nothing tracked yet." };
  }
  const anyConfident = input.cards.some((c) => c.confident === true);
  return {
    level: "STEADY",
    reason: "STEADY",
    specId: null,
    headline: anyConfident ? "Steady. Nothing needs you." : "Quiet so far. Still gathering signal.",
  };
}
