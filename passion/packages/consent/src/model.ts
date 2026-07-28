// @gt100k/consent — whether this child's data may be collected at all, and for what.
//
// G3 in the roadmap, and named there as a gate that BLOCKS LIVE USE. It exists now because the
// discovery game can post a real session to the console, which it could not do a day ago. That
// capability is currently reachable only by setting an environment variable nobody sets, and an
// opt-in switch is a decision about defaults, not a consent regime.
//
// Scope, honestly. This package decides whether a collection is permitted and records why. It does
// not verify that a guardian is who they say they are: verifiable parental consent under COPPA is a
// process involving an identity signal this repository has no access to, and pretending otherwise
// with a checkbox would be worse than the current absence. `ConsentMethod` therefore records HOW
// consent was obtained so an auditor can see that "asserted-by-guide" is not "verified", rather
// than flattening both into a boolean.

/**
 * What the data may be used for. Consent is per purpose, because a guardian agreeing that a guide
 * may read their child's interests has not agreed to anything else, and a single "yes" that covers
 * every future use is the thing purpose limitation exists to prevent.
 */
export type Purpose =
  /** Deriving interest beliefs from what the child did. The discovery loop itself. */
  | "discovery-measurement"
  /** A named guide reading those beliefs to decide what to offer next. */
  | "guide-review"
  /** Coaching the family on how they respond to the child's pursuit. */
  | "family-coaching"
  /** Putting the child's work in front of someone outside the household. */
  | "external-audience";

export const PURPOSES: readonly Purpose[] = [
  "discovery-measurement",
  "guide-review",
  "family-coaching",
  "external-audience",
];

/**
 * How the consent was obtained, kept because the difference matters and is otherwise invisible.
 *
 * `guide-asserted` is a guide typing that a parent said yes. It is the weakest form, it is what a
 * pilot will actually have, and it is NOT verifiable parental consent. Recording it as its own
 * value is what lets a policy refuse it later without every existing record having to be re-read.
 */
export type ConsentMethod = "guide-asserted" | "signed-form" | "verified-parental";

export interface ConsentRecord {
  readonly kidId: string;
  /** Who granted it. An opaque reference; this package never holds a name or a contact. */
  readonly guardianRef: string;
  readonly method: ConsentMethod;
  readonly purposes: readonly Purpose[];
  readonly grantedAt: string; // ISO-8601
  /**
   * When it lapses. Optional, and its absence means "until withdrawn" rather than "forever":
   * `RETENTION_REVIEW_DAYS` below still applies.
   */
  readonly expiresAt?: string;
  /** Set when a guardian takes it back. Never deleted, because a withdrawal is itself a record. */
  readonly withdrawnAt?: string;
}

/**
 * How long a grant may stand unreviewed.
 *
 * A year, matching the cadence a school year already imposes and short enough that a child who has
 * left is not still being measured. It is a review interval and not a hard expiry, so it produces a
 * `stale` decision a human resolves rather than a silent cut-off mid-session.
 */
export const RETENTION_REVIEW_DAYS = 365;

export type DenialReason =
  | "no-record"
  | "withdrawn"
  | "expired"
  | "purpose-not-granted"
  | "stale-needs-review";

export interface ConsentDecision {
  readonly allowed: boolean;
  /** Present only on a denial, and specific: "no" without a reason is not actionable. */
  readonly reason?: DenialReason;
  /** Present on an allow that a human should look at soon. */
  readonly reviewDue?: boolean;
}
