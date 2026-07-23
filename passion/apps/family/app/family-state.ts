// Pure family-surface state helpers shared by the page and the CI test.
//
// `buildFamilyQaState` is the small `window.__qa.state()` payload the LOOP_QA harness reads. The
// primary action APPROVES the top coaching card for the family — the same thing
// `window.__qa.primaryAction()` invokes — kept pure here so it is testable headless. "System proposes,
// human disposes": a family-facing item appears ONLY after the guide approves it, and nothing is ever
// sent to a parent automatically.
import type { FamilyRead, PressureRisk } from "@gt100k/family";

/** A single approvable coaching offer surfaced to the guide (an ask or a shared-activity idea). */
export interface CoachingCard {
  readonly id: string;
  readonly kind: "ask" | "activity";
  readonly text: string;
}

// The ordered coaching cards for a read: the door-opening asks first (the primary offers), then the
// shared-activity ideas. Ids embed the kid id so they are unique across the roster and stable across
// renders (so an approval survives a re-render / a child switch and back).
export function coachingCards(read: FamilyRead): readonly CoachingCard[] {
  const asks: readonly CoachingCard[] = read.asks.map((text, i) => ({
    id: `${read.kidId}::ask::${i}`,
    kind: "ask",
    text,
  }));
  const activities: readonly CoachingCard[] = read.sharedActivities.map((text, i) => ({
    id: `${read.kidId}::activity::${i}`,
    kind: "activity",
    text,
  }));
  return [...asks, ...activities];
}

/** The top coaching card's id (the primary offer the guide approves first), or null if none. */
export function topCoachingCardId(read: FamilyRead): string | null {
  return coachingCards(read)[0]?.id ?? null;
}

/** How many of a read's coaching cards the guide has approved for the family. */
export function approvedCount(read: FamilyRead, approvedIds: ReadonlySet<string>): number {
  let n = 0;
  for (const card of coachingCards(read)) if (approvedIds.has(card.id)) n++;
  return n;
}

/** The coaching cards the guide has approved — the ONLY items the family-facing preview shows. */
export function approvedCards(
  read: FamilyRead,
  approvedIds: ReadonlySet<string>,
): readonly CoachingCard[] {
  return coachingCards(read).filter((card) => approvedIds.has(card.id));
}

export interface FamilyQaState {
  /** the selected child. */
  readonly kidId: string;
  /** the selected child's family-driven-pressure watch level. */
  readonly risk: PressureRisk;
  /** roster-level "needs your review" queue: children whose read escalates to a human. */
  readonly escalations: number;
  /** coaching cards the guide has approved for the selected child's family preview. */
  readonly approved: number;
}

// Small, stable snapshot for the usability gate — the selected kid, the risk, the roster escalation
// queue, and the approved-card count (so an approve is observable in `state()`).
export function buildFamilyQaState(
  kidId: string,
  read: FamilyRead,
  approvedIds: ReadonlySet<string>,
  escalations: number,
): FamilyQaState {
  return {
    kidId,
    risk: read.pressureWatch.risk,
    escalations,
    approved: approvedCount(read, approvedIds),
  };
}

// The guide's primary action: approve the top coaching card for the family. Returns the new approved
// set, or null when the action is dead (no card, or the top card is already approved) — so the harness
// can hard-fail a dead primary action.
export function applyApproveTop(
  read: FamilyRead,
  approvedIds: ReadonlySet<string>,
): ReadonlySet<string> | null {
  const id = topCoachingCardId(read);
  if (id === null || approvedIds.has(id)) return null;
  const next = new Set(approvedIds);
  next.add(id);
  return next;
}
