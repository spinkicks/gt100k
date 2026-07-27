/**
 * The console forgot every decision a guide made.
 *
 * Promoting a spike to ACTIVE is the most consequential act in the product, and it lived in
 * `useState`. A refresh returned the child to the state the seed put them in. 013 calls itself
 * "durable, versioned, revisable" and says of parking "park, don't delete", but a browser reload
 * deleted the park. GC4 audits that every CANDIDATE/ACTIVE has a human transition in its history,
 * and that audit means nothing if the history does not survive the page.
 *
 * What is stored is the DECISION LOG, not the resulting store, and that distinction is the whole
 * design. Replaying decisions onto a freshly derived seed means:
 *   - a change to the synthetic seeds is picked up rather than shadowed by a frozen snapshot;
 *   - every transition goes through 013's own `promote`/`park`/`reopen`/`contest`, so the legality
 *     table and the human-actor requirement are enforced on the way back in, exactly as they were
 *     on the way out. Nothing can be smuggled into the store by editing storage.
 *   - the thing we persist is the history, which is what the domain model says the record IS.
 *
 * Scope, stated because it would otherwise be overclaimed: this is browser-local and synthetic.
 * G3 (identity, consent, retention, erasure) is what a real store needs, and until it exists there
 * is no concept of "this guide", so there is nowhere honest to put these but this browser.
 */
import { getForKid } from "@gt100k/hypothesis-store";
import { describe, expect, it } from "vitest";

import { buildRosterGates, buildRosterStore, ROSTER_NOW } from "../app/console-data.js";
import { applyDecisions, parseDecisionLog, type GuideDecision } from "../app/decisions.js";

const ARI = "kid-synthetic-001";
const seed = () => buildRosterStore();
const gates = buildRosterGates();

/** Ari's one gate-ready EMERGING spike, the only thing on the roster that can be promoted. */
function promotableId(): string {
  const h = getForKid(seed(), ARI).find((x) => x.state === "EMERGING" && gates.get(x.id)?.passed);
  if (!h) throw new Error("fixture: expected a gate-ready EMERGING spike for Ari");
  return h.id;
}

const at = "2026-07-27T00:00:00.000Z";
const promote = (id: string): GuideDecision => ({ action: "promote", hypothesisId: id, at });
const stateOf = (store: ReturnType<typeof seed>, id: string): string | undefined =>
  store.byId[id]?.state;

describe("a guide's decisions survive a reload", () => {
  it("replays a promotion onto the seed", () => {
    const id = promotableId();

    const { store } = applyDecisions(seed(), [promote(id)], gates);

    expect(stateOf(store, id)).toBe("CANDIDATE");
  });

  it("replays them in order, so two promotions reach ACTIVE", () => {
    const id = promotableId();

    const { store } = applyDecisions(seed(), [promote(id), promote(id)], gates);

    expect(stateOf(store, id)).toBe("ACTIVE");
  });

  it("records the human actor in history, which is what GC4 audits", () => {
    const id = promotableId();

    const { store } = applyDecisions(seed(), [promote(id)], gates);

    const entry = store.byId[id]?.history.at(-1);
    expect(entry?.to).toBe("CANDIDATE");
    expect(entry?.actor).not.toBe("SYSTEM");
    expect(entry?.actor).not.toBe("MODEL");
  });

  it("keeps a park parked, which is the one the domain model is loudest about", () => {
    const id = promotableId();

    const { store } = applyDecisions(
      seed(),
      [{ action: "park", hypothesisId: id, at, reason: "revisit next term" }],
      gates,
    );

    expect(stateOf(store, id)).toBe("PARKED");
    expect(store.byId[id]?.history.at(-1)?.reason).toBe("revisit next term");
  });
});

describe("replay validates rather than trusts", () => {
  it("skips a decision the legality table forbids, and says which", () => {
    // Reopening something that was never parked. Storage is editable by anyone with devtools, so
    // replay must go through 013's own actions rather than assigning states.
    const id = promotableId();

    const { store, skipped } = applyDecisions(
      seed(),
      [{ action: "reopen", hypothesisId: id, at }],
      gates,
    );

    expect(stateOf(store, id)).toBe("EMERGING"); // untouched
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.decision.action).toBe("reopen");
  });

  it("skips a decision for a hypothesis the seed no longer has", () => {
    const { store, skipped } = applyDecisions(
      seed(),
      [{ action: "park", hypothesisId: "kid-synthetic-001::gone::build", at }],
      gates,
    );

    expect(skipped).toHaveLength(1);
    expect(Object.keys(store.byId).length).toBe(Object.keys(seed().byId).length);
  });

  it("applies the good decisions either side of a bad one", () => {
    const id = promotableId();

    const { store, skipped } = applyDecisions(
      seed(),
      [promote(id), { action: "reopen", hypothesisId: id, at }, promote(id)],
      gates,
    );

    expect(stateOf(store, id)).toBe("ACTIVE");
    expect(skipped).toHaveLength(1);
  });

  it("is deterministic: the same log always gives the same store", () => {
    const id = promotableId();
    const log = [promote(id), promote(id)];

    const a = applyDecisions(seed(), log, gates).store;
    const b = applyDecisions(seed(), log, gates).store;

    expect(a).toEqual(b);
  });
});

describe("reading what is in storage", () => {
  it("round-trips a log", () => {
    const log: GuideDecision[] = [promote("x"), { action: "park", hypothesisId: "y", at }];

    expect(parseDecisionLog(JSON.stringify(log))).toEqual(log);
  });

  it("treats anything unparseable as no decisions rather than throwing", () => {
    expect(parseDecisionLog("not json")).toEqual([]);
    expect(parseDecisionLog("null")).toEqual([]);
    expect(parseDecisionLog(null)).toEqual([]);
  });

  it("drops entries that are not decisions, keeping the ones that are", () => {
    // A half-valid log should cost the guide the bad entry, not all of their work.
    const raw = JSON.stringify([promote("x"), { action: "explode" }, 7, { hypothesisId: "z" }]);

    expect(parseDecisionLog(raw)).toEqual([promote("x")]);
  });
});
