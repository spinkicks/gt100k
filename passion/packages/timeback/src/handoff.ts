// The light two-block daily loop (spec §3.5), encoded as a ONE-WAY handoff: the school signal becomes a
// passion hint (priors = toDomainPriors(snapshot)) and nothing flows back. The two blocks are independent
// (school never gates passion; passion never touches grades) and the passion block is reward-neutral by
// construction — protecting intrinsic motivation. These are INVARIANTS asserted by tests, not runtime config:
// `DailyHandoff` deliberately carries no reward/points/grade/score/streak field, only the reward-neutral flag.
import type { DomainPrior } from "@gt100k/interest-inference";
import { toDomainPriors } from "./map.js";
import type { TimeBackSnapshot } from "./model.js";

export interface DailyHandoff {
  readonly kidId: string;
  readonly date: string; // the day this hint applies to
  /** the ONE-WAY school→passion hint (from toDomainPriors); a starting hint, never a gate. */
  readonly priors: readonly DomainPrior[];
  readonly passionBlockRewardNeutral: true;
  readonly blocksIndependent: true;
}

/** Build the one-way daily handoff for a snapshot + day. Pure; no back-channel, no reward/grade field. */
export function buildDailyHandoff(
  snapshot: TimeBackSnapshot,
  date: string,
): DailyHandoff {
  return {
    kidId: snapshot.kidId,
    date,
    priors: toDomainPriors(snapshot),
    passionBlockRewardNeutral: true,
    blocksIndependent: true,
  };
}
