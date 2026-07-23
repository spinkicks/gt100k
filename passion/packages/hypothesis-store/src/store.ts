// Immutable store value + applyInterestRead (create + auto EXPLORING↔EMERGING + CONTESTED).
import type { InterestRead } from "@gt100k/interest-inference";
import type { HypothesisStore, InterestHypothesis, HistoryEntry } from "./model.js";
import { SPIKE_THRESHOLD, canTransition, type Lifecycle } from "./lifecycle.js";

export function emptyStore(): HypothesisStore {
  return { byId: {} };
}

export function getForKid(store: HypothesisStore, kidId: string): InterestHypothesis[] {
  return Object.values(store.byId)
    .filter((h) => h.kidId === kidId)
    .sort(
      (a, b) =>
        b.evidence.lowerBound - a.evidence.lowerBound || a.cellKey.localeCompare(b.cellKey),
    );
}

const hid = (kidId: string, cellKey: string): string => `${kidId}::${cellKey}`;

export function applyInterestRead(
  store: HypothesisStore,
  kidId: string,
  read: InterestRead,
  now: string,
): HypothesisStore {
  const byId: Record<string, InterestHypothesis> = { ...store.byId };
  for (const cell of read.cells) {
    const id = hid(kidId, cell.cellKey);
    const prev = byId[id];
    const wasAbove =
      (prev?.evidence.wasAboveThreshold ?? false) || cell.lowerBound >= SPIKE_THRESHOLD;
    const evidence = {
      mean: cell.mean,
      lowerBound: cell.lowerBound,
      confident: cell.confident,
      attribution: cell.attribution,
      supporting: cell.supporting,
      disconfirming: cell.disconfirming,
      wasAboveThreshold: wasAbove,
    };
    if (!prev) {
      const created: InterestHypothesis = {
        id,
        kidId,
        cellKey: cell.cellKey,
        domainPath: cell.domainPath,
        mode: cell.mode,
        state: "EXPLORING",
        version: 1,
        evidence,
        history: [
          { at: now, from: "EXPLORING", to: "EXPLORING", actor: "SYSTEM", reason: "created" },
        ],
        createdAt: now,
        updatedAt: now,
      };
      // MUST advance on creation too — a first read that is already `confident` auto-advances
      // EXPLORING→EMERGING (spec §6 note).
      byId[id] = advance(created, now);
    } else {
      const next = advance({ ...prev, evidence, version: prev.version + 1, updatedAt: now }, now);
      // No-op idempotency (014 SC-2): if re-applying the read changes nothing but version/updatedAt,
      // keep `prev` verbatim so a full-replay cycle is a true no-op on state (no version churn).
      byId[id] = sameExceptVersion(next, prev) ? prev : next;
    }
  }
  return { byId };
}

// True when `a` equals `b` ignoring only `version`/`updatedAt` (the fields a re-apply always bumps).
// Compares structurally over the JSON-safe hypothesis shape; key order is preserved via the spread
// in `applyInterestRead`, so a stable stringify is a faithful deep-equal here.
function sameExceptVersion(a: InterestHypothesis, b: InterestHypothesis): boolean {
  const normalized = { ...a, version: b.version, updatedAt: b.updatedAt };
  return JSON.stringify(normalized) === JSON.stringify(b);
}

// Auto transitions only (system): EXPLORING→EMERGING on confident;
// →CONTESTED when lowerBound fell below threshold after having been above.
function advance(h: InterestHypothesis, now: string): InterestHypothesis {
  const below = h.evidence.lowerBound < SPIKE_THRESHOLD && h.evidence.wasAboveThreshold;
  if (
    (h.state === "EMERGING" || h.state === "CANDIDATE") &&
    below &&
    canTransition(h.state, "CONTESTED", "auto")
  ) {
    return withState(h, "CONTESTED", "SYSTEM", "lowerBound fell below threshold", now);
  }
  if (
    h.state === "EXPLORING" &&
    h.evidence.confident &&
    canTransition("EXPLORING", "EMERGING", "auto")
  ) {
    return withState(h, "EMERGING", "SYSTEM", "confident", now);
  }
  return h;
}

export function withState(
  h: InterestHypothesis,
  to: Lifecycle,
  actor: string,
  reason: string,
  now: string,
): InterestHypothesis {
  const entry: HistoryEntry = { at: now, from: h.state, to, actor, reason };
  return { ...h, state: to, updatedAt: now, history: [...h.history, entry] };
}
