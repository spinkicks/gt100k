// The guide's decision log: what a human decided, kept so a reload does not undo it.
//
// WHAT IS STORED IS THE LOG, NOT THE STORE, and that is the design rather than an implementation
// detail. Persisting the resulting store would freeze today's synthetic seeds into the browser, so
// a change to the roster would be shadowed by a stale snapshot; and it would let anyone with
// devtools write a hypothesis straight into ACTIVE without a human transition in its history, which
// is the one thing GC4 exists to catch. Replaying decisions through 013's own actions means the
// legality table and the human-actor requirement are enforced coming back in exactly as they were
// going out, and the thing we persist is the history, which the domain model says the record IS.
//
// SCOPE. Browser-local and synthetic. Real persistence is G3 (identity, consent, retention,
// erasure), and until that exists there is no concept of "this guide", so there is nowhere honest
// to put these except the browser that made them. `park, don't delete` is the rule this restores:
// before it, a refresh deleted the park.
import type { GateStatus, HumanActor, HypothesisStore } from "@gt100k/hypothesis-store";
import { contest, park, promote, reopen } from "@gt100k/hypothesis-store";

export const DECISIONS_KEY = "gt100k.guide-console.decisions";

export type DecisionAction = "promote" | "park" | "reopen" | "contest";
const ACTIONS: ReadonlySet<string> = new Set<DecisionAction>([
  "promote",
  "park",
  "reopen",
  "contest",
]);

export interface GuideDecision {
  readonly action: DecisionAction;
  readonly hypothesisId: string;
  /** When the human decided. Replayed as the transition's timestamp, so history stays truthful. */
  readonly at: string;
  readonly reason?: string;
}

export interface SkippedDecision {
  readonly decision: GuideDecision;
  readonly why: string;
}

function isDecision(x: unknown): x is GuideDecision {
  if (typeof x !== "object" || x === null) return false;
  const { action, hypothesisId, at, reason } = x as Partial<Record<keyof GuideDecision, unknown>>;
  return (
    typeof action === "string" &&
    ACTIONS.has(action) &&
    typeof hypothesisId === "string" &&
    hypothesisId !== "" &&
    typeof at === "string" &&
    (reason === undefined || typeof reason === "string")
  );
}

/**
 * Read a stored log. Anything unparseable is no decisions rather than a thrown error, and a
 * half-valid log costs the guide the bad entries rather than all of their work: this is a demo
 * convenience, and losing a session to one malformed record would be a worse failure than dropping
 * the record.
 */
export function parseDecisionLog(raw: string | null): GuideDecision[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isDecision);
}

/**
 * Fold a decision log onto a store through 013's own actions.
 *
 * A decision that the legality table refuses, or that names a hypothesis this store does not have,
 * is skipped and reported rather than throwing: the seeds can change under a saved log, and a guide
 * losing one stale decision is right where losing the whole session would not be.
 */
export function applyDecisions(
  seedStore: HypothesisStore,
  decisions: readonly GuideDecision[],
  gates: ReadonlyMap<string, GateStatus>,
  actor: HumanActor = { id: "guide-synthetic", role: "guide" },
): { store: HypothesisStore; skipped: SkippedDecision[] } {
  let store = seedStore;
  const skipped: SkippedDecision[] = [];

  for (const d of decisions) {
    if (!store.byId[d.hypothesisId]) {
      skipped.push({ decision: d, why: "no such hypothesis in the current roster" });
      continue;
    }
    try {
      switch (d.action) {
        case "promote": {
          const gate: GateStatus = gates.get(d.hypothesisId) ?? {
            gapSurvived: false,
            durable: false,
            hasArtifact: false,
            passed: false,
          };
          store = promote(store, d.hypothesisId, actor, { gate, autonomySignOff: true }, d.at);
          break;
        }
        case "park":
          store = park(store, d.hypothesisId, actor, d.reason ?? "parked from the console", d.at);
          break;
        case "reopen":
          store = reopen(store, d.hypothesisId, actor, d.at);
          break;
        case "contest":
          store = contest(
            store,
            d.hypothesisId,
            actor,
            d.reason ?? "contested from the console",
            d.at,
          );
          break;
      }
    } catch (e) {
      skipped.push({ decision: d, why: e instanceof Error ? e.message : "refused" });
    }
  }

  return { store, skipped };
}
