/**
 * Behavioral-signal capture for the discovery GADGETS (companion to signals.ts, which owns the
 * code×debug taste session). Where signals.ts probes ONE cell deeply, this records BREADTH: which
 * interest families the child voluntarily poked at, and which they kept coming back to.
 *
 * Guardrails carried from the PRD (mirrors signals.ts):
 *  - never a scalar "passion score" — a summary with per-family counts + human-readable reasons.
 *  - the strongest breadth signal is a family the child *returns to* (repeat activations), not a
 *    single first touch. `topDomain` is by interaction count, surfaced only as a soft lean.
 *  - missingness ≠ disinterest: untouched families are simply absent, never scored negative.
 */
import type { GadgetDomain } from "../scene/gadgets/gadgetState";

export interface DiscoveryEvent {
  gadgetId: string;
  domain: GadgetDomain;
  /** the gadget's mode after this activation (0 = returned to rest) */
  mode: number;
  /** true if this was the first time the child discovered this gadget */
  firstTime: boolean;
  at: number;
}

export interface DiscoverySummary {
  /** distinct gadget ids the child has activated */
  discovered: string[];
  /** total activations (incl. repeats) */
  interactions: number;
  /** activations per interest family */
  byDomain: Partial<Record<GadgetDomain, number>>;
  /** the family with the most activations (a soft lean, never a verdict) */
  topDomain: GadgetDomain | null;
  reasons: string[];
  events: DiscoveryEvent[];
}

declare global {
  interface Window {
    __cabinGadgets?: DiscoverySummary;
  }
}

/** Accumulates gadget discoveries and derives a breadth summary. Time is injected for determinism. */
export class GadgetSignalRecorder {
  private readonly events: DiscoveryEvent[] = [];
  private readonly discovered = new Set<string>();

  record(e: DiscoveryEvent): DiscoverySummary {
    this.events.push(e);
    this.discovered.add(e.gadgetId);
    return this.summary();
  }

  summary(): DiscoverySummary {
    const byDomain: Partial<Record<GadgetDomain, number>> = {};
    for (const e of this.events) byDomain[e.domain] = (byDomain[e.domain] ?? 0) + 1;

    let topDomain: GadgetDomain | null = null;
    let topCount = 0;
    for (const [d, c] of Object.entries(byDomain) as Array<[GadgetDomain, number]>) {
      if (c > topCount) {
        topCount = c;
        topDomain = d;
      }
    }

    const familiesTouched = Object.keys(byDomain).length;
    const reasons: string[] = [];
    if (this.discovered.size > 0)
      reasons.push(
        `explored ${this.discovered.size} gadget(s) across ${familiesTouched} family(ies)`,
      );
    if (familiesTouched >= 3) reasons.push("broad curiosity — sampled several interest families");
    const repeats = this.events.length - this.discovered.size;
    if (repeats > 0 && topDomain)
      reasons.push(`kept returning to "${topDomain}" (${topCount} activations)`);

    return {
      discovered: [...this.discovered],
      interactions: this.events.length,
      byDomain,
      topDomain,
      reasons,
      events: [...this.events],
    };
  }
}

/** Expose the latest gadget summary on `window.__cabinGadgets` (kept off the render harness hook). */
export function exposeGadgets(summary: DiscoverySummary): void {
  if (typeof window !== "undefined") window.__cabinGadgets = summary;
}
