/**
 * Exposes the latest InterestHypothesis on `window.__cabinInterest` for inspection / future harness
 * eval (kept separate from `window.__cabin` so the render-harness contract stays untouched).
 */
import type { InterestHypothesis } from "./signals";

declare global {
  interface Window {
    __cabinInterest?: InterestHypothesis;
  }
}

export function exposeInterest(h: InterestHypothesis): void {
  if (typeof window !== "undefined") window.__cabinInterest = h;
}
