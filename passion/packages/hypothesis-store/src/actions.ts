// Human-owned transitions (spec §3.1). Each requires a named HumanActor (role not MODEL/SYSTEM);
// promote past the gate also requires gate.passed && autonomySignOff. Every transition records history.
import type { HypothesisStore, HumanActor, InterestHypothesis } from "./model.js";
import { withState } from "./store.js";
import { canTransition } from "./lifecycle.js";
import type { GateStatus } from "./gate.js";

function assertHuman(actor: HumanActor): void {
  const role = actor.role.toUpperCase();
  if (role === "MODEL" || role === "SYSTEM") {
    throw new Error(`human actor required; got role=${actor.role}`);
  }
}

function mustGet(store: HypothesisStore, id: string): InterestHypothesis {
  const h = store.byId[id];
  if (!h) throw new Error(`no hypothesis ${id}`);
  return h;
}

function put(store: HypothesisStore, h: InterestHypothesis): HypothesisStore {
  return { byId: { ...store.byId, [h.id]: h } };
}

export function promote(
  store: HypothesisStore,
  id: string,
  actor: HumanActor,
  opts: { gate: GateStatus; autonomySignOff: boolean },
  now: string,
): HypothesisStore {
  assertHuman(actor);
  const h = mustGet(store, id);
  const to = h.state === "CANDIDATE" ? "ACTIVE" : "CANDIDATE";
  if (to === "CANDIDATE") {
    // The Phase 2→3 gate: deterministic checks AND the human's harmonious-not-pressured sign-off.
    if (!opts.gate.passed) throw new Error("gate not passed");
    if (!opts.autonomySignOff) throw new Error("autonomy sign-off required");
  }
  if (!canTransition(h.state, to, "human")) throw new Error(`illegal transition ${h.state}→${to}`);
  return put(
    store,
    withState(
      h,
      to,
      actor.id,
      to === "CANDIDATE" ? "promoted (gate+signoff)" : "activated",
      now,
    ),
  );
}

export function park(
  store: HypothesisStore,
  id: string,
  actor: HumanActor,
  reason: string,
  now: string,
): HypothesisStore {
  assertHuman(actor);
  const h = mustGet(store, id);
  if (!canTransition(h.state, "PARKED", "human")) throw new Error(`cannot park from ${h.state}`);
  return put(store, withState(h, "PARKED", actor.id, reason, now));
}

export function reopen(
  store: HypothesisStore,
  id: string,
  actor: HumanActor,
  now: string,
): HypothesisStore {
  assertHuman(actor);
  const h = mustGet(store, id);
  if (h.state !== "PARKED") throw new Error(`can only reopen a PARKED hypothesis`);
  const reopened = withState(h, "REOPENED", actor.id, "reopened", now);
  return put(store, withState(reopened, "EMERGING", actor.id, "resume exploring", now));
}

export function contest(
  store: HypothesisStore,
  id: string,
  actor: HumanActor,
  reason: string,
  now: string,
): HypothesisStore {
  assertHuman(actor);
  const h = mustGet(store, id);
  if (!canTransition(h.state, "CONTESTED", "human")) {
    throw new Error(`cannot contest from ${h.state}`);
  }
  return put(store, withState(h, "CONTESTED", actor.id, reason, now));
}
