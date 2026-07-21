import type { LearnerProfile, WorkingRhythm } from "./model";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function rhythmOf(member: LearnerProfile): WorkingRhythm {
  return member.workingRhythm ?? "flex";
}

function rhythmsAreCompatible(left: WorkingRhythm, right: WorkingRhythm): boolean {
  return left === "flex" || right === "flex" || left === right;
}

/** Pinned, caliper-independent per-member non-harm benefit. */
export function benefitOf(member: LearnerProfile, cohort: LearnerProfile[]): number {
  const peers = cohort.filter(({ learnerRef }) => learnerRef !== member.learnerRef);
  const peerCount = peers.length;

  const needs = member.accommodations.needs;
  const metNeeds = needs.filter((need) =>
    peers.every(({ accommodations }) => !accommodations.conflicts.includes(need)),
  ).length;
  const accommodation = needs.length === 0 ? 1 : metNeeds / needs.length;

  const peerRefs = new Set(peers.map(({ learnerRef }) => learnerRef));
  const relevantHistory = (member.pairHistory ?? []).filter(({ ref }) => peerRefs.has(ref));
  const positivePairings = relevantHistory.filter(({ flag }) => flag === "positive").length;
  const negativePairings = relevantHistory.filter(({ flag }) => flag === "negative").length;
  const history =
    peerCount === 0
      ? 0.5
      : clamp01(0.5 + 0.5 * (positivePairings / peerCount) - negativePairings / peerCount);

  const duplicateRoles =
    member.preferredRole === undefined
      ? 0
      : peers.filter(({ preferredRole }) => preferredRole === member.preferredRole).length;
  const roleFit = peerCount === 0 ? 1 : 1 - duplicateRoles / peerCount;
  const memberRhythm = rhythmOf(member);
  const compatibleRhythms = peers.filter((peer) =>
    rhythmsAreCompatible(memberRhythm, rhythmOf(peer)),
  ).length;
  const rhythmFit = peerCount === 0 ? 1 : compatibleRhythms / peerCount;
  const pace = 0.5 * roleFit + 0.5 * rhythmFit;

  return clamp01(0.4 * accommodation + 0.35 * history + 0.25 * pace);
}
