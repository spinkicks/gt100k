// Gates + read, derived from the interaction log (spec §3.3). `deriveGates` recomputes each
// hypothesis's graduation gate from the voluntary-return timeline in the log — replacing the
// console's hand-built gates. `currentRead` recomputes the InterestRead for any consumer.
// Pure/sync; never mutates inputs. Needs `ctx` (the catalog) to re-derive the timeline — the store
// keeps no timelines (spec §3.3 note; recorded as a `minor` decision).
import type { InterestRead } from "@gt100k/interest-inference";
import { runInference, serializeCellKey } from "@gt100k/interest-inference";
import { deriveSignals } from "@gt100k/signal-pipeline";
import type { GateStatus } from "@gt100k/hypothesis-store";
import { evaluateGate, getForKid } from "@gt100k/hypothesis-store";
import type { StudentProfile, OrchestratorContext } from "./model.js";

/** Recompute the InterestRead over the full log — the same derivation `runCycle` applies. */
export function currentRead(
  profile: StudentProfile,
  ctx: OrchestratorContext,
  now: string,
): InterestRead {
  const { cellEvents } = deriveSignals({
    interactions: profile.interactions,
    surfaced: ctx.surfaced,
    catalog: ctx.catalog,
    config: ctx.config,
  });
  return runInference(cellEvents, profile.priors, Date.parse(now));
}

/**
 * Compute each hypothesis's graduation gate from the log. For every hypothesis of `profile.kidId`
 * in the store, its return timeline = the timestamps of the log-derived voluntary, non-novel
 * CellEvents whose cellKey matches, sorted ascending; then `evaluateGate` (013). The `hasArtifact`
 * check is satisfied by the synthetic perseverance artifact attached in `runCycle`.
 */
export function deriveGates(
  profile: StudentProfile,
  ctx: OrchestratorContext,
  now: string,
): ReadonlyMap<string /*hypId*/, GateStatus> {
  const { cellEvents } = deriveSignals({
    interactions: profile.interactions,
    surfaced: ctx.surfaced,
    catalog: ctx.catalog,
    config: ctx.config,
  });

  // Return timeline per cellKey: voluntary, non-novel returns are the durability signal.
  const timelines = new Map<string, string[]>();
  for (const e of cellEvents) {
    if (e.kind !== "voluntary_return" || e.novelty !== false) continue;
    const key = serializeCellKey(e.domainPath, e.mode);
    const arr = timelines.get(key);
    if (arr) arr.push(e.timestamp);
    else timelines.set(key, [e.timestamp]);
  }

  const nowMs = Date.parse(now);
  const gates = new Map<string, GateStatus>();
  for (const hyp of getForKid(profile.store, profile.kidId)) {
    const timeline = (timelines.get(hyp.cellKey) ?? [])
      .slice()
      .sort((a, b) => Date.parse(a) - Date.parse(b));
    gates.set(hyp.id, evaluateGate(hyp, timeline, nowMs));
  }
  return gates;
}
