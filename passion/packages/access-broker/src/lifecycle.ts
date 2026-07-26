// The access-transfer lifecycle transitions (spec §4.2) — each a PURE function returning a NEW
// Brokerage snapshot (inputs never mutated). These carry the SINGLE GUIDE GATE: the human proposes,
// approves (with a required guardian-consent attribute — a HARD blocker), advances the engineered
// handoff in order, or declines. The FAMILY never owns a gate ([D3]): `approve` always records the
// GUIDE as `approvedBy`, and no family-owned transition exists.
//
// Ids are content-derived (FNV-1a hex over stable input) with NO clock/random, so identical inputs
// yield identical ids (determinism, mirroring @gt100k/project-workspace).
import type { Brokerage, HandoffState } from "./model.js";
import type { Match } from "./broker.js";

/** Deterministic 32-bit FNV-1a over a string → 8-hex-char digest. No clock, no randomness. */
function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** The ordered engineered-handoff ladder past the guide gate. */
export const HANDOFF_ORDER = ["approved", "introduced", "active", "transferred"] as const;

/** The certified spike a brokerage serves (kid + cell). */
export interface SpikeRef {
  readonly kidId: string;
  readonly cellKey: string;
}

/**
 * Propose a match as a new `Brokerage` in state `proposed` (the highest state the SYSTEM ever sets).
 * Id derived from (kidId, cellKey, opportunityId) so re-proposing the same match is idempotent.
 */
export function proposeMatch(match: Match, spike: SpikeRef, now: string): Brokerage {
  const id = `brk_${fnv1aHex([spike.kidId, spike.cellKey, match.opportunity.id].join("|"))}`;
  return {
    id,
    kidId: spike.kidId,
    spikeCell: { cellKey: spike.cellKey },
    opportunityId: match.opportunity.id,
    kind: match.opportunity.kind,
    state: "proposed",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Approve a proposed brokerage — the ONE human gate. Throws `CONSENT_REQUIRED` unless
 * `guardianConsent === true` (a hard blocker), and records the GUIDE as `approvedBy` (never a family
 * member). Only a `proposed` brokerage may be approved.
 */
export function approve(
  b: Brokerage,
  opts: { guardianConsent: boolean; guideId: string },
  now: string,
): Brokerage {
  if (opts.guardianConsent !== true) throw new Error("CONSENT_REQUIRED");
  if (b.state !== "proposed") throw new Error(`INVALID_TRANSITION: ${b.state} -> approved`);
  return {
    ...b,
    state: "approved",
    guardianConsent: true,
    approvedBy: opts.guideId,
    updatedAt: now,
  };
}

/**
 * Advance the engineered handoff one ordered step: approved → introduced → active → transferred.
 * Rejects any skip or reversal (throws `INVALID_TRANSITION`). Optionally records the engineered
 * handoff attributes (warm intro / overlap / why-now) on the transition.
 */
export function advanceHandoff(
  b: Brokerage,
  next: HandoffState,
  now: string,
  handoff?: { warmIntro: boolean; overlap: boolean; whyNow: string },
): Brokerage {
  const curIdx = HANDOFF_ORDER.indexOf(b.state as (typeof HANDOFF_ORDER)[number]);
  const nextIdx = HANDOFF_ORDER.indexOf(next as (typeof HANDOFF_ORDER)[number]);
  if (curIdx === -1 || nextIdx === -1 || nextIdx !== curIdx + 1) {
    throw new Error(`INVALID_TRANSITION: ${b.state} -> ${next}`);
  }
  return { ...b, state: next, updatedAt: now, ...(handoff ? { handoff } : {}) };
}

/** Decline a brokerage (guide-invoked) → `declined`. Terminal. */
export function declineMatch(b: Brokerage, now: string): Brokerage {
  return { ...b, state: "declined", updatedAt: now };
}
