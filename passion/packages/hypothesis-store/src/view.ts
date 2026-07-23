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
}

export interface ConsoleViewModel {
  readonly kidId: string;
  readonly cards: HypothesisCard[];
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

export function consoleViewModel(
  store: HypothesisStore,
  kidId: string,
  gates: ReadonlyMap<string, GateStatus> = new Map(),
): ConsoleViewModel {
  const cards = getForKid(store, kidId).map(
    (h): HypothesisCard => ({
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
      gate: gates.get(h.id),
      allowedActions: actionsFor(h.state),
    }),
  );
  return { kidId, cards };
}
