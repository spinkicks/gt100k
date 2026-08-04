/**
 * Minting a perseverance reference from work a child actually did.
 *
 * WHY THIS EXISTS. The Phase 2 to 3 gate has three legs: the child survived a quiet gap, they kept
 * returning across two months, and there is a `perseveranceArtifactRef` on the hypothesis. The
 * first two are derived from the return timeline. The third was only ever set by pilot fixtures, so
 * for every real child it stayed empty and the gate could never pass, however long they kept coming
 * back. A guide watching a genuinely committed child would have found the Promote button disabled
 * forever with nothing on screen explaining why.
 *
 * WHAT COUNTS. A `failure_recovery` event: the child hit something in this domain that did not
 * work, and stayed with it until it did. That is the observable form of the thing the gate is
 * asking about, and it is now emitted for real (chess reports its attempts, so a solve that took
 * more than one go carries the family).
 *
 * WHAT THIS IS NOT. The field's doc calls for an opaque structural reference and offers a Socratic
 * defense record as the example, which is a much stronger artefact: a child explaining work they
 * made, examined by an interviewer. A recovered puzzle is thinner than that. It is what the product
 * can currently observe without an adult in the loop, and the other two legs of the gate carry the
 * weight of time. When the studio's journeys reach the profile, a project whose log shows a stuck
 * moment and a recovery is the better source and should take precedence here.
 */
import type { CellEvent } from "@gt100k/interest-inference";
import { serializeCellKey } from "@gt100k/interest-inference";

/** What the ref points at, so a guide can find the moment rather than trust a boolean. */
const PREFIX = "recovery";

/**
 * The perseverance reference for each cell that has earned one.
 *
 * Keyed by cell so it drops straight into `attachArtifacts`. The EARLIEST recovery wins rather than
 * the latest: the ref should name when the child first showed they would stay with a hard thing,
 * and a later one overwriting it would make the record move under a guide who had already read it.
 */
export function perseveranceRefs(
  cellEvents: readonly CellEvent[],
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const e of cellEvents) {
    if (e.kind !== "failure_recovery") continue;
    const key = serializeCellKey(e.domainPath, e.mode);
    const ref = `${PREFIX}:${e.timestamp}`;
    const held = out[key];
    // Earliest wins. Timestamps are ISO-8601, so a string compare is a time compare.
    if (held === undefined || ref < held) out[key] = ref;
  }
  return out;
}

/**
 * Fold newly earned refs into the ones already on the profile.
 *
 * Existing entries win. A ref may have come from somewhere richer than a recovered puzzle, such as
 * a defense record attached by a guide, and a cheap automatic one must never quietly replace it.
 */
export function mergePerseverance(
  held: Readonly<Record<string, string>>,
  earned: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return { ...earned, ...held };
}
