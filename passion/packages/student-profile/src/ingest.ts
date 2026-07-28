// Accepting observations from a real surface, as opposed to constructing them in a fixture.
//
// A browser sending over a network gets at-least-once delivery and nothing better: a batch can
// arrive twice because the response was lost, not because the child did anything twice. So the
// receiver has to be idempotent, and that belongs here rather than in a route handler, where it
// would be untestable and would have to be rewritten for every transport.
import type { Interaction, SurfacedRecord } from "@gt100k/signal-pipeline";
import type { StudentProfile, OrchestratorContext, CycleBatch } from "./model.js";
import { runCycle } from "./orchestrator.js";

/**
 * A record's identity, for the purpose of "have I already got this one?".
 *
 * Structural rather than a client-generated id, deliberately. An id would have to live on the
 * engine's `Interaction` type, which is shared by every producer including the fixtures, and adding
 * a required field to a shared type to solve one transport's problem is the wrong direction.
 *
 * The cost is that two genuinely distinct records identical in every field including an ISO
 * millisecond timestamp collapse into one. For human input at millisecond resolution that is close
 * enough to impossible, and the trade is against inflating the log on every retry, which is not
 * rare at all. Losing one weak duplicate beats double-counting a real one.
 */
const identity = (r: Interaction | SurfacedRecord): string => JSON.stringify(r);

/**
 * The part of `batch` this profile has not already seen.
 *
 * Deduplicates within the batch as well as against the profile, so a client that retries by
 * concatenating rather than replacing cannot inflate the log either.
 */
export function unseen(profile: StudentProfile, batch: CycleBatch): CycleBatch {
  const knownI = new Set(profile.interactions.map(identity));
  const knownS = new Set(profile.surfaced.map(identity));
  const interactions: Interaction[] = [];
  const surfaced: SurfacedRecord[] = [];

  for (const i of batch.interactions) {
    const k = identity(i);
    if (knownI.has(k)) continue;
    knownI.add(k);
    interactions.push(i);
  }
  for (const s of batch.surfaced) {
    const k = identity(s);
    if (knownS.has(k)) continue;
    knownS.add(k);
    surfaced.push(s);
  }
  return { interactions, surfaced };
}

export interface IngestResult {
  readonly profile: StudentProfile;
  /** How much of the batch was new, so a caller can tell "accepted" from "already had it". */
  readonly accepted: { readonly interactions: number; readonly surfaced: number };
  /** Records rejected for belonging to another child. Never silently retagged. */
  readonly rejected: number;
}

/**
 * Take a batch from a surface and fold it into the profile.
 *
 * Records carrying a different `kidId` are rejected rather than accepted-and-relabelled. A surface
 * that sends one child's play under another child's name is a serious bug, and the honest response
 * is to refuse the data and report the count, not to quietly make it fit.
 */
export function ingest(
  profile: StudentProfile,
  batch: CycleBatch,
  ctx: OrchestratorContext,
  now: string,
): IngestResult {
  const mine = (r: { readonly kidId: string }): boolean => r.kidId === profile.kidId;
  const rejected =
    batch.interactions.filter((r) => !mine(r)).length +
    batch.surfaced.filter((r) => !mine(r)).length;

  const fresh = unseen(profile, {
    interactions: batch.interactions.filter(mine),
    surfaced: batch.surfaced.filter(mine),
  });

  return {
    profile: runCycle(profile, fresh, ctx, now),
    accepted: { interactions: fresh.interactions.length, surfaced: fresh.surfaced.length },
    rejected,
  };
}
