// The `window.__qa` contract (spec §9) for the LOOP_QA usability gate.
//
// A DOM surface (no canvas), so `state()` + DOM diffing is the operable surface. The page installs
// this once, backed by a ref, so `state()` / `primaryAction()` always read the CURRENT store — never
// a stale render closure.
import type { FamilyQaState } from "./family-state.js";

export interface QaContract {
  readonly ready: boolean;
  readonly error: string | null;
  state(): FamilyQaState;
  primaryAction(): void;
}

declare global {
  interface Window {
    __qa?: QaContract;
  }
}

// Install the contract on `window` if not already present. `getState`/`runPrimary` read the latest
// values via the caller's ref, so the harness's before/after `state()` diff sees live state.
export function installQa(getState: () => FamilyQaState, runPrimary: () => void): void {
  if (typeof window === "undefined") return;
  window.__qa = {
    ready: true,
    error: null,
    state: getState,
    primaryAction: runPrimary,
  };
}
