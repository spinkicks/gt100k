// Golden constants — see specs/011-interest-inference/spec.md §3.2. Copied verbatim.
export const ALPHA0 = 1;
export const BETA0 = 1;
export const W_ENV = 0.5;
/** Weight on `DomainPrior.masteryTilt`. Was `W_APT`; see that field for why the name changed. */
export const W_MASTERY = 0.5;
export const W_XP = 0.5;
export const A_RETURN = 1.0;
export const A_DEPTH = 0.5;
export const B_SKIP = 0.5;
/**
 * Beta per `decline` × recency, divided by the choice-set size (E4).
 *
 * A decline is a cell that was available and passed over and that the child has never engaged.
 * That is much weaker evidence than passing over a known love — you cannot tire of something you
 * never tried — which is why it sits far below `B_SKIP`. Both are shares of one choice, so both
 * are normalized by `CellEvent.choiceSetSize`.
 */
export const B_DECLINED = 0.15;
/**
 * Alpha scale for the secondary reading of a two-mode action (e.g. `tinker` resolves to build
 * primary + investigate secondary). The secondary mode is inferred from the action's affordances
 * rather than directly observed, so it is weaker evidence. Preserves the weight the old
 * `secondaryWeight` config applied through `magnitude`, but as an explicit engine constant.
 */
export const A_SECONDARY = 0.5;
export const HALFLIFE_DAYS = 14;
/**
 * Minimum non-prior evidence mass before a cell may read `confident` (E6).
 *
 * Raised from 3 to 6. Three non-novel returns is roughly one afternoon of enthusiasm, and the
 * preference literature puts within-sitting stability near 60% against only ~40% for hierarchies
 * that survive months — so three events sat almost entirely inside the range a coin-flip's worth
 * of momentary mood can produce.
 */
export const MIN_EVIDENCE_MASS = 6;
/**
 * Minimum number of distinct UTC calendar days carrying scored evidence before a cell may read
 * `confident` (E6).
 *
 * This gate matters more than the mass floor. Mass alone cannot tell three returns in one
 * afternoon apart from three returns across three weeks, and only the second is evidence of a
 * durable interest; a count can always be run up inside a single sitting, a calendar cannot.
 * Two is the floor implied by the evidence rather than a comfortable margin — it is the smallest
 * span that asserts the interest outlived the sitting that produced it.
 */
export const MIN_DISTINCT_DAYS = 2;
export const MAX_CI_WIDTH = 0.35;
export const K_LCB = 1.0;
export const SPIKE_THRESHOLD = 0.6;
export const MAX_CANDIDATES = 3;
export const ATTR_MARGIN = 0.1;

export const DEPTH_FAMILIES = [
  "unrequired_revision",
  "chosen_challenge",
  "failure_recovery",
  "self_authored_scope",
  "artifact_competence",
] as const;
export type DepthFamily = (typeof DEPTH_FAMILIES)[number];
/**
 * The return horizon split (E2). `voluntary_return` used to cover both "reopened it thirty seconds
 * later" and "came back on day four unprompted"; only the delayed, across-day one is trustworthy
 * evidence of durable interest at 6-8, so it gets the full `A_RETURN` weight and the other is
 * recorded at weight 0.
 *
 * `cross_day_return` — a prior engagement of this same cell exists on an earlier UTC calendar day.
 * `same_day_engagement` — everything else: a first-ever engagement, a reopen inside one session, or
 * a re-entry in a different session on the same calendar day.
 *
 * The proposal called the second kind `same_session_reopen`. That name would lie about two of the
 * three cases it covers — a first-ever touch is not a "reopen", and a same-day return in a
 * different session is not "same session" — so it is named for what it actually asserts: this
 * engagement is not evidence of a delayed return.
 *
 * The two disconfirming kinds are disjoint by construction (E4): `skip` is a cell the child has
 * engaged before and passed over anyway; `decline` is one they have never engaged. A cell must
 * never produce both for the same session, or one behavioural fact would be scored twice.
 */
export type EventKind =
  | "cross_day_return"
  | "same_day_engagement"
  | "prompted_return"
  | DepthFamily
  | "skip"
  | "decline";

export type DomainPath = readonly [string] | readonly [string, string];
export type Attribution = "domain" | "style" | "mixed";

export interface DomainPrior {
  readonly domain: string;
  readonly inEnvironment: boolean;
  /**
   * How well the child is already doing in this domain's school subjects, in [0,1]. Populated in one
   * place, `timeback/src/map.ts`, as a weighted mean of subject mastery from a TimeBack snapshot.
   *
   * Called `aptitudeTilt` until 2026-07-26, which was wrong and cost us a bad proposal. Mastery is
   * ACHIEVEMENT, what a child has already been graded as knowing. Aptitude is a different
   * construct measured a different way, and reading the old name as aptitude led to an argument to
   * halve this weight for six-year-olds on the strength of an SMPY citation about above-level
   * testing at thirteen. For achievement in that band the evidence runs the other way (see the
   * withdrawn E8 in docs/proposals/interest-engine-data-collection-v2.md).
   */
  readonly masteryTilt: number;
  readonly discretionaryTilt: number; // [0,1]
}

export interface CellEvent {
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly kind: EventKind;
  readonly novelty: boolean;
  readonly timestamp: string; // ISO-8601
  readonly dayGap?: number; // whole UTC days since the previous engagement; cross_day_return only
  /**
   * Which reading of a multi-mode action this is. Absent means primary.
   *
   * This replaces the old free-numeric `magnitude` field (E1). `magnitude` was specified only as
   * "depth for returns, strength for depth families", which invited an emitter to fill it with
   * active time — and because it multiplied alpha, duration would silently have become the
   * dominant term in the posterior. At 6-8 the evidence says the opposite: choice predicts durable
   * interest and duration does not.
   *
   * A closed enum cannot smuggle a duration in. One event now means one occurrence; the only
   * graded thing left is whether the mode was directly acted or merely afforded, and that weight
   * lives here as a named constant rather than as data on the event.
   */
  readonly role?: "primary" | "secondary";
  /**
   * How many alternatives were passed over at this choice moment (E4). One choice is one
   * observation, so the disconfirming mass is shared across the alternatives rather than applied
   * in full to each. Absent means "not a choice moment", which scores at full weight.
   */
  readonly choiceSetSize?: number;
}

export interface CellBelief {
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly alpha: number;
  readonly beta: number;
  readonly mean: number;
  readonly sd: number;
  readonly lowerBound: number;
  /**
   * Observation weight AFTER recency decay: how much of what we saw still bears on today's belief.
   * This is what weights a cell's contribution to the domain and mode marginals (E7), where a cell
   * the child has drifted away from SHOULD count for less.
   */
  readonly evidenceMass: number;
  /**
   * The same weights WITHOUT decay: how much looking happened at all. This is what `confident`
   * gates on.
   *
   * Splitting the two fixed a case the single number could not express. Decay is geometric, so a
   * steady cadence converges: fortnightly returns ceiling at 2.0 against MIN_EVIDENCE_MASS of 6,
   * meaning a child who came back every other week for years could never be confident, at any n.
   * Meanwhile 013's promotion gate wants precisely that shape, a 56-day span containing a 14-day
   * quiet gap the child returned from. Observing does not un-happen because time passed.
   */
  readonly observedMass: number;
  /**
   * How many distinct UTC calendar days carried an event that actually moved alpha or beta (E6).
   *
   * Only scored events count, so this is a count of days on which the belief changed, not of days
   * the child was seen. Reported alongside the masses because a reader needs all three to judge a
   * cell: the same observation spread over six days and piled into one are very different claims.
   */
  readonly distinctDays: number;
  readonly confident: boolean;
  readonly attribution: Attribution | null;
  readonly supporting: readonly string[];
  readonly disconfirming: readonly string[];
}

export interface Candidate {
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly lowerBound: number;
  readonly attribution: Attribution;
}

export interface InterestRead {
  readonly cells: readonly CellBelief[];
  readonly candidates: readonly Candidate[];
}

const DEPTH_SET = new Set<string>(DEPTH_FAMILIES);
export function isDepthFamily(kind: string): kind is DepthFamily {
  return DEPTH_SET.has(kind);
}

/**
 * Depth families that feed the interest belief (E11).
 *
 * `artifact_competence` is deliberately absent. It is a judgement about how good the made thing
 * is, which is the Evidence Graph's question, not evidence about what a child is drawn to. A
 * child can produce competent work in something they are bored by, and produce poor work in the
 * thing they love most, so scoring it here reads work quality as interest.
 *
 * It is still emitted and still read downstream: the specialization planner derives
 * `producerIdentity` from it. Unscored for interest, not deleted.
 */
const INTEREST_SCORING_DEPTH = new Set<string>(
  DEPTH_FAMILIES.filter((k) => k !== "artifact_competence"),
);
export function scoresInterest(kind: string): boolean {
  return INTEREST_SCORING_DEPTH.has(kind);
}

export function serializeCellKey(domainPath: DomainPath, mode: string): string {
  const d = domainPath.length === 2 ? `${domainPath[0]}/${domainPath[1]}` : domainPath[0];
  return `${d}::${mode}`;
}

export function recencyWeight(now: number, timestamp: string): number {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return 1; // unparseable timestamp → no decay (never NaN-poison alpha)
  const ageMs = Math.max(0, now - parsed);
  return 0.5 ** (ageMs / 86400000 / HALFLIFE_DAYS);
}

/**
 * The UTC calendar day (`YYYY-MM-DD`) an event falls on, or `null` if the timestamp cannot be
 * parsed (E6).
 *
 * UTC rather than local time so the day gate is deterministic: the engine takes no timezone and
 * must give the same answer wherever it runs. The cost is that a child playing either side of
 * local midnight can have both sittings land on one UTC day, which under-counts. That is the safe
 * direction for a gate whose whole job is to be slow to call an interest durable.
 *
 * An unparseable timestamp yields `null` and is dropped from the day set rather than counted under
 * its raw string. `recencyWeight` already declines to decay what it cannot date; a garbage
 * timestamp must likewise not be able to satisfy a gate that is entirely a claim about dates.
 */
export function utcDay(timestamp: string): string | null {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

// Clamp a documented [0,1] input; NaN → 0. Guards prior tilt inputs against out-of-range poisoning.
export function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
