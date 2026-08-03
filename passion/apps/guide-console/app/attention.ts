// One attention verdict per child: what does this child need from me right now? Priority order
// mirrors the wellbeing engine's own ordering: safety first (a wellbeing escalation, then a flagged
// family-pressure pattern -- both are the child's safety and must outrank opportunity), then a fading
// interest (engagement is cooling even if affect is calm -- a calm read must not stand alone over a
// dying interest), then opportunity (a promote gate has passed), then quiet. Pure and deterministic.
import { specPath } from "./vocab.js";
import { STATE_LABEL } from "./wellbeing-strip.js";

export type AttentionLevel = "NEEDS_YOU" | "READY" | "STEADY";

export interface Attention {
  readonly level: AttentionLevel;
  readonly headline: string;
  readonly reason:
    | "WELLBEING"
    | "FAMILY_PRESSURE"
    | "FAMILY_REVIEWED"
    | "ENGAGEMENT_FADING"
    | "GATE_READY"
    | "STEADY";
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

// The family co-engagement read, folded in so the verdict can see a pressure pattern the guide would
// otherwise meet only by opening the Family tab. The engine (assess.ts) escalates elevated pressure or
// strain to a human; `escalate` carries that decision. It is a whole-child, whole-family read, not a
// per-specialization one, so it names no specId -- it says "look before you act", not "act on this
// card". Optional so callers and tests that predate it still compile; absent reads as no family flag.
export interface FamilyPressureSignal {
  // The engine's raw escalateToHuman, NOT folded with the guide's review. Kept raw so the verdict can
  // tell an unreviewed flag (hold + "review before promoting") from a reviewed one (hold lifted, but
  // the concern is still live so the headline must not become a green "ready to promote").
  readonly escalate: boolean;
  // Whether the guide has reviewed this child's escalated family pressure. A review lifts the hold; it
  // does NOT mean the pressure is gone, so a reviewed child reads "promoting is your call", never the
  // celebratory gate-pass headline. Absent reads as not-yet-reviewed.
  readonly acknowledged?: boolean;
  // "none" | "watch" | "elevated" from the engine's PressureRisk. Only escalation gates the verdict;
  // the risk word rides along for a caller that wants to colour the caution.
  readonly risk: string;
}

export interface AttentionInputs {
  readonly wellbeing: readonly WellbeingSignal[];
  readonly cards: readonly CardSignal[];
  readonly fading: boolean;
  readonly family?: FamilyPressureSignal;
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
  // A flagged family-pressure pattern is a safety read, so it outranks the promote gate: the loudest,
  // lowest-friction action on the roster used to be "Promote" for the very interest the family layer
  // says is under pressure and should be eased, and the guide saw the flag only if they opened the
  // Family tab. Making the verdict NEEDS_YOU replaces that one-tap Promote with Review, routing the
  // guide to look before they escalate. specId is null: the read is about the family, not one card.
  if (input.family?.escalate && !input.family.acknowledged) {
    return {
      level: "NEEDS_YOU",
      reason: "FAMILY_PRESSURE",
      specId: null,
      headline: "Family pressure flagged. Review before promoting.",
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
    // A child whose family pressure the guide has REVIEWED is no longer NEEDS_YOU -- the guide acted --
    // but the concern is still live: escalateToHuman has not changed, only the hold was lifted. So the
    // verdict must not fall through to the celebratory "Ready to promote X", which reads as "the issue
    // is resolved, go ahead" and actively urges promoting the very child the tool warned about a click
    // ago. Keep the promote reachable (specId points at the gate-ready spec, so the release means what
    // it says) but frame it as the guide's judgement, not an automatic green light.
    if (input.family?.escalate && input.family.acknowledged) {
      return {
        level: "READY",
        reason: "FAMILY_REVIEWED",
        specId: ready.id,
        headline: "Family pressure reviewed. Promoting is your call.",
      };
    }
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
