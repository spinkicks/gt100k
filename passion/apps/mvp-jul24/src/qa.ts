// The `window.__qa` contract for this app.
//
// The interest counters are NOT deleted — PRD §11's refusal is specifically about a *child-facing*
// quantified display, and it says operator/guide-facing readouts are fine. So they move here: an
// operator can read them, and a child has no path to them. `ReadoutScreen` stays mounted for this
// entry point and for its own tests.
import { useGame } from "./game/store";
import { useInterest } from "./interest/store";

export interface QaContract {
  readonly ready: boolean;
  showReadout(): void;
  interest(): Record<string, { activeMs: number; opens: number; solves: number }>;
}

declare global {
  interface Window {
    __qa?: QaContract;
  }
}

export function installQa(): void {
  if (typeof window === "undefined") return;
  window.__qa = {
    ready: true,
    showReadout: () => useGame.getState().goToReadout(),
    interest: () => useInterest.getState().byGadget,
  };
}
