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
  readonly gatePassed: boolean;
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
  const ready = input.cards.find((c) => c.gatePassed);
  if (ready) {
    return {
      level: "READY",
      reason: "GATE_READY",
      specId: ready.id,
      headline: `Ready to promote ${specPath(ready.domainPath)}`,
    };
  }
  return { level: "STEADY", reason: "STEADY", specId: null, headline: "Steady. Nothing needs you." };
}
