// The `window.__qa` contract (spec §9) for the LOOP_QA usability gate.
//
// A DOM chat surface (no canvas), so `state()` + DOM diffing is the operable surface. `state()` is a
// small, stable snapshot — the last response KIND + how many citations it carried — so a seeded gap
// answer (kind "answer", ≥1 citation) is observable in the before/after diff. The page installs this
// once, backed by a ref, so `state()` / `primaryAction()` always read the CURRENT response — never a
// stale render closure. `primaryAction()` asks the seeded gap question (async fetch → grounded answer
// with citations); the harness polls `state()` until it settles.
import type { ConciergeResponse } from "@gt100k/concierge";

export interface QaState {
  /** The last response kind served ("answer" | "refused" | "escalated"), or null before any ask. */
  readonly lastKind: string | null;
  /** How many citations the last response carried (0 when none / not an answer). */
  readonly citationCount: number;
}

export interface QaContract {
  readonly ready: boolean;
  readonly error: string | null;
  state(): QaState;
  primaryAction(): void;
}

declare global {
  interface Window {
    __qa?: QaContract;
  }
}

/** Pure snapshot of a served response — kept pure so the CI smoke test drives it headless. */
export function buildQaState(response: ConciergeResponse | null): QaState {
  return {
    lastKind: response?.kind ?? null,
    citationCount: response?.citations?.length ?? 0,
  };
}

/** Install the contract on `window` if not already present; `getState`/`runPrimary` read live refs. */
export function installQa(getState: () => QaState, runPrimary: () => void): void {
  if (typeof window === "undefined") return;
  window.__qa = {
    ready: true,
    error: null,
    state: getState,
    primaryAction: runPrimary,
  };
}
