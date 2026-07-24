// The `window.__qa` contract (spec §6) for the LOOP_QA usability gate. Installed once, backed by a
// ref, so `state()` / `primaryAction()` always read the CURRENT open project (never a stale closure).
import type { QaState } from "./studio-state.js";

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

export function installQa(getState: () => QaState, runPrimary: () => void): void {
  if (typeof window === "undefined") return;
  window.__qa = {
    ready: true,
    error: null,
    state: getState,
    primaryAction: runPrimary,
  };
}
