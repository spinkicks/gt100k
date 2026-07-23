// Pure console state helpers shared by the page and the CI test.
//
// `buildQaState` is the small `window.__qa.state()` payload the LOOP_QA harness reads. The primary
// action promotes the top gate-passed EMERGING candidate — the same thing `window.__qa.primaryAction`
// invokes — kept pure here so it is testable headless.
import type { GateStatus, HypothesisStore } from "@gt100k/hypothesis-store";
import { consoleViewModel, getForKid, promote } from "@gt100k/hypothesis-store";

export interface QaState {
  readonly selectedId: string | null;
  readonly count: number;
  readonly states: readonly string[];
  /** 016-wellbeing: how many of the child's spikes the wellbeing engine flagged for a human. */
  readonly escalations: number;
}

// Small, stable snapshot for the usability gate — ranked states so a promote is observable. The
// wellbeing `escalations` count (016) is additive: it defaults to 0 so existing callers are unchanged.
export function buildQaState(
  store: HypothesisStore,
  kidId: string,
  selectedId: string | null,
  escalations = 0,
): QaState {
  const cards = getForKid(store, kidId);
  return { selectedId, count: cards.length, states: cards.map((h) => h.state), escalations };
}

// The top gate-passed EMERGING candidate (cards are ranked by lowerBound desc), or null if none.
export function topPromotableId(
  store: HypothesisStore,
  kidId: string,
  gates: ReadonlyMap<string, GateStatus>,
): string | null {
  const { cards } = consoleViewModel(store, kidId, gates);
  const top = cards.find((c) => c.state === "EMERGING" && c.gate?.passed === true);
  return top ? top.id : null;
}

// The guide's primary action: promote the top gate-passed candidate with a synthetic guide actor +
// the passed gate + the required autonomy sign-off. Returns the new store, or null when the action is
// dead (no gate-passed candidate) — so the harness can hard-fail a dead primary action.
export function applyGuidePrimaryAction(
  store: HypothesisStore,
  kidId: string,
  gates: ReadonlyMap<string, GateStatus>,
  now: string,
): HypothesisStore | null {
  const id = topPromotableId(store, kidId, gates);
  if (id === null) return null;
  const gate = gates.get(id);
  if (!gate?.passed) return null;
  return promote(
    store,
    id,
    { id: "guide-synthetic", role: "guide" },
    { gate, autonomySignOff: true },
    now,
  );
}
