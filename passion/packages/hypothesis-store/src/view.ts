// The pure console view-model (spec §3.5). Exactly what the UI renders:
// separated supporting/disconfirming evidence, calibrated uncertainty, lifecycle, allowed actions.
// NEVER a scalar passion score or fixed label.
import type { HypothesisStore, InterestHypothesis } from "./model.js";
import type { GateStatus } from "./gate.js";
import { getForKid } from "./store.js";

export interface HypothesisCard {
  readonly id: string;
  readonly cellKey: string;
  readonly domainPath: readonly string[];
  readonly mode: string;
  readonly state: InterestHypothesis["state"];
  readonly lowerBound: number;
  readonly confident: boolean;
  readonly attribution: string | null;
  // separate — never summed into a single score.
  readonly supporting: readonly string[];
  readonly disconfirming: readonly string[];
  readonly gate?: GateStatus;
  readonly allowedActions: readonly string[];
  // The smallest distinguishing next test — phrased as "the next test is…", NEVER "you are an X".
  readonly nextProbe: string;
}

export interface ConsoleViewModel {
  readonly kidId: string;
  readonly cards: HypothesisCard[];
  // Domain×mode combinations observed on one axis but not yet sampled on another
  // ("domains/modes not yet sampled" — spec §3.5). Kid-level; `"<domain>::<mode>"`, sorted.
  readonly coverageGaps: readonly string[];
}

// The human transitions currently legal for a state, as the console surfaces them.
function actionsFor(state: InterestHypothesis["state"]): string[] {
  switch (state) {
    case "EMERGING":
      return ["promote", "park", "contest"];
    case "CANDIDATE":
      return ["promote", "park", "contest"];
    case "ACTIVE":
      return ["park"];
    case "CONTESTED":
      return ["park"];
    case "PARKED":
      return ["reopen"];
    default:
      return ["park"];
  }
}

// The smallest distinguishing next test for a hypothesis (spec §3.5). Deterministic; a *next test*,
// never a fixed label. When a gate is supplied, the probe points at the first unmet gate check (or,
// once passed, at the human sign-off decision); otherwise it is derived from the lifecycle state.
function nextProbe(state: InterestHypothesis["state"], gate: GateStatus | undefined): string {
  switch (state) {
    case "PARKED":
      return "Parked. Reopen to resume exploring.";
    case "CONTESTED":
      return "Re-sample unprompted; a voluntary return distinguishes renewed interest from a dip.";
    case "EXPLORING":
      return "Offer the cell again unprompted and watch for a voluntary return.";
    case "ACTIVE":
      return "Sustain the interest; watch for disconfirming skips.";
    default:
      break; // EMERGING / CANDIDATE — gate-driven below.
  }
  if (gate) {
    if (!gate.gapSurvived) return "Watch for a voluntary return after a ≥14-day quiet gap.";
    if (!gate.durable) return "Confirm ≥2 return occasions sustained across ≥8 weeks.";
    if (!gate.hasArtifact) return "Capture a perseverance artifact (iteration past a failure).";
    return "Gate passed. A human may promote with an autonomy sign-off.";
  }
  return state === "CANDIDATE"
    ? "Confirm sustained returns across the term before activating."
    : "Watch for a voluntary return after a ≥14-day quiet gap.";
}

// Domain×mode combinations the child has been observed on one axis but not yet sampled on the other.
// Purely from the store (the durable record of prior reads); `"<domain>::<mode>"`, sorted.
function coverageGaps(hyps: readonly InterestHypothesis[]): string[] {
  const domains = new Set<string>();
  const modes = new Set<string>();
  const sampled = new Set<string>();
  for (const h of hyps) {
    const domain = h.domainPath[0];
    domains.add(domain);
    modes.add(h.mode);
    sampled.add(`${domain}::${h.mode}`);
  }
  const gaps: string[] = [];
  for (const d of domains) {
    for (const m of modes) {
      const key = `${d}::${m}`;
      if (!sampled.has(key)) gaps.push(key);
    }
  }
  return gaps.sort();
}

export function consoleViewModel(
  store: HypothesisStore,
  kidId: string,
  gates: ReadonlyMap<string, GateStatus> = new Map(),
): ConsoleViewModel {
  const hyps = getForKid(store, kidId);
  const cards = hyps.map((h): HypothesisCard => {
    const gate = gates.get(h.id);
    return {
      id: h.id,
      cellKey: h.cellKey,
      domainPath: h.domainPath,
      mode: h.mode,
      state: h.state,
      lowerBound: h.evidence.lowerBound,
      confident: h.evidence.confident,
      attribution: h.evidence.attribution,
      supporting: h.evidence.supporting,
      disconfirming: h.evidence.disconfirming,
      gate,
      allowedActions: actionsFor(h.state),
      nextProbe: nextProbe(h.state, gate),
    };
  });
  return { kidId, cards, coverageGaps: coverageGaps(hyps) };
}
