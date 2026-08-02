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
/**
 * The one line on the card that tells a guide what to DO, so it is written for the person doing it.
 *
 * It used to be written for us. "Offer the cell again unprompted and watch for a voluntary return"
 * puts the engine's internal word for a domain-by-mode pair -- `cell` -- in front of a teacher, and
 * "re-sample", "disconfirming skips", "perseverance artifact", "autonomy sign-off" and "≥14-day"
 * are all the same mistake: our vocabulary, our notation, our register, on the most-read and most
 * actionable line in the console. A guide who has to decode an instruction will not follow it.
 *
 * Meaning is unchanged. "Without suggesting it" is what unprompted means and is the whole point of
 * the measurement, so it stays explicit rather than being simplified away.
 */
function nextProbe(state: InterestHypothesis["state"], gate: GateStatus | undefined): string {
  switch (state) {
    case "PARKED":
      return "Parked. Reopen it whenever you want to try again.";
    case "CONTESTED":
      return "Offer it again without suggesting it. Coming back on their own tells you the interest is real rather than a dip.";
    case "EXPLORING":
      return "Offer this again without suggesting it, and see whether they come back on their own.";
    case "ACTIVE":
      return "Keep it going, and watch for them starting to skip it.";
    default:
      break; // EMERGING / CANDIDATE — gate-driven below.
  }
  if (gate) {
    if (!gate.gapSurvived) return "Leave it alone for two weeks, then see if they come back to it.";
    if (!gate.durable) return "Needs a couple more returns, spread over a month or two.";
    if (!gate.hasArtifact)
      return "Nothing made yet. Look for something they finished after it went wrong.";
    return "All three are met. You can promote this, as long as they want it.";
  }
  return state === "CANDIDATE"
    ? "Keep watching for them coming back this term before making it active."
    : "Leave it alone for two weeks, then see if they come back to it.";
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
