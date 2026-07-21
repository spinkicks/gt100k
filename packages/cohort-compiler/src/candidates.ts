import { caliperDistance, withinCaliper } from "./caliper";
import type { Caliper, CandidateSet, LearnerProfile } from "./model";

function compareRefs(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function fnv1a32hex(value: string): string {
  let hash = 0x811c9dc5;

  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

/** Build deterministic per-learner near-peer sets from a synthetic pool. */
export function generateCandidates(pool: LearnerProfile[], caliper: Caliper): CandidateSet[] {
  return pool.map((subject) => {
    const candidates = pool
      .filter(
        (peer) =>
          peer.learnerRef !== subject.learnerRef &&
          !subject.separations.includes(peer.learnerRef) &&
          withinCaliper(subject, peer, caliper),
      )
      .map((peer) => ({
        ref: peer.learnerRef,
        distance: caliperDistance(subject, peer),
      }))
      .sort((a, b) => a.distance - b.distance || compareRefs(a.ref, b.ref))
      .slice(0, caliper.k);
    const preimage = `${subject.learnerRef}>${candidates.map(({ ref }) => ref).join(",")}`;

    return {
      learnerRef: subject.learnerRef,
      candidates,
      hash: fnv1a32hex(preimage),
    };
  });
}
